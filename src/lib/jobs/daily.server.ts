import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { runMatchmaking } from "@/lib/matching/engine.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";
import { sendDigests } from "@/lib/jobs/digests.server";
import { escalateOverdueApprovals } from "@/lib/deliverables.functions";

/**
 * The scheduled jobs of TAB 12 §12.1A, run once a day. Each job is
 * independent: one failing never stops the others, and the result says which
 * did what, so a cron log is enough to see the platform's housekeeping.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   the columns these jobs touch postdate the generated types. */
const jdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

type JobResult = Record<string, number | string>;

/**
 * Past Events archival (§1.5C): every live event whose date has passed moves to
 * `past`. One directional and date driven — nobody archives or restores by hand.
 * Uses the end date where there is one, so a three-day summit is not archived
 * on its first morning.
 */
async function archivePastEvents(): Promise<JobResult> {
  const today = new Date().toISOString().slice(0, 10);
  const { data: live } = await jdb()
    .from("events")
    .select("id, start_date, end_date")
    .in("status", ["approved", "listed"]);
  const due = (
    (live ?? []) as { id: string; start_date: string | null; end_date: string | null }[]
  ).filter((e) => {
    const last = e.end_date ?? e.start_date;
    return last != null && last.slice(0, 10) < today;
  });
  if (due.length) {
    await jdb()
      .from("events")
      .update({ status: "past", moved_to_past_at: new Date().toISOString(), is_featured: false })
      .in(
        "id",
        due.map((e) => e.id),
      );
  }
  return { moved_to_past: due.length };
}

/** Featured Event expiry (§6.1A): a feature window ends on its own. */
async function expireFeatured(): Promise<JobResult> {
  const { data } = await jdb()
    .from("events")
    .update({ is_featured: false })
    .eq("is_featured", true)
    .lt("feature_expires_at", new Date().toISOString())
    .select("id");
  return { featured_expired: (data ?? []).length };
}

/** Nightly re-score to catch drift — budgets spent, profiles edited (TAB 19 §19.3 step 1). */
async function rescoreMatches(): Promise<JobResult> {
  const r = await runMatchmaking();
  return { match_candidates: r.scored, match_queued: r.queued, match_removed: r.removed };
}

/**
 * "Meeting Not Yet Booked Reminder" (TAB 18 §18.5): sent once, on the third
 * day after approval, to both sides of an approved match still unbooked.
 */
async function remindUnbookedMeetings(): Promise<JobResult> {
  const now = Date.now();
  const from = new Date(now - 4 * 86_400_000).toISOString();
  const to = new Date(now - 3 * 86_400_000).toISOString();
  const { data: waiting } = await jdb()
    .from("meeting_bookings")
    .select("match_id")
    .eq("status", "awaiting_booking")
    .gte("created_at", from)
    .lt("created_at", to);
  const ids = ((waiting ?? []) as { match_id: string }[]).map((w) => w.match_id);
  if (!ids.length) return { meeting_reminders: 0 };
  const { data: matches } = await jdb()
    .from("match_scores")
    .select(
      "id, subject_user_id, candidate_user_id, user_summary_for_subject, user_summary_for_candidate",
    )
    .in("id", ids);
  const site = getSiteUrl();
  let sent = 0;
  for (const m of (matches ?? []) as Record<string, string>[]) {
    for (const side of ["subject", "candidate"] as const) {
      const uid = m[`${side}_user_id`];
      const summary = m[`user_summary_for_${side}`];
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("email, display_name")
        .eq("id", uid)
        .maybeSingle();
      await supabaseAdmin.from("notifications").insert({
        user_id: uid,
        type: "match_reminder",
        title: "Do not miss your approved match",
        body: `You have an approved match with ${summary} waiting for a meeting to be booked.`,
        data: { match_id: m.id, link: "/dashboard/matches" },
      });
      if (p?.email) {
        await sendTransactionalEmailServer({
          templateName: "ige-notice",
          category: "matches",
          recipientEmail: p.email,
          idempotencyKey: `match-reminder-${m.id}-${uid}`,
          templateData: {
            subject: "Do not miss your approved match",
            heading: "Do not miss your approved match",
            lines: [
              `Hi ${(p.display_name ?? "").split(" ")[0] || "there"},`,
              `You have an approved match with ${summary} waiting for a meeting to be booked. This match may become unavailable if it is not actioned soon.`,
            ],
            ctaLabel: "Book Your Introductory Meeting",
            ctaUrl: `${site}/dashboard/matches`,
          },
        }).catch(() => {});
      }
      sent += 1;
    }
  }
  return { meeting_reminders: sent };
}

/**
 * Instagram feed refresh (§1.5B): cached so the home page never calls
 * Instagram on a visitor's load. Needs INSTAGRAM_ACCESS_TOKEN (a long-lived
 * token on IGE's own account — TAB 12 §12.7); without it this job skips.
 */
async function refreshInstagram(): Promise<JobResult> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return { instagram: "skipped (no INSTAGRAM_ACCESS_TOKEN)" };
  const url = `https://graph.instagram.com/me/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=12&access_token=${encodeURIComponent(token)}`;
  const res = await fetch(url);
  if (!res.ok) return { instagram: `failed (${res.status})` };
  const body = (await res.json()) as {
    data?: {
      id: string;
      caption?: string;
      media_type: string;
      media_url?: string;
      thumbnail_url?: string;
      permalink: string;
      timestamp?: string;
    }[];
  };
  const rows = (body.data ?? [])
    .map((m) => ({
      id: m.id,
      permalink: m.permalink,
      // Videos show their thumbnail; the grid is images only.
      media_url: m.media_type === "VIDEO" ? m.thumbnail_url : m.media_url,
      caption: m.caption ?? null,
      posted_at: m.timestamp ?? null,
      fetched_at: new Date().toISOString(),
    }))
    .filter((r) => r.media_url)
    .slice(0, 6);
  if (rows.length) {
    await jdb().from("instagram_feed_cache").delete().neq("id", "");
    await jdb().from("instagram_feed_cache").insert(rows);
  }
  return { instagram_posts: rows.length };
}

export async function runDailyJobs(): Promise<JobResult> {
  const jobs: [string, () => Promise<JobResult>][] = [
    ["archive_past_events", archivePastEvents],
    ["expire_featured", expireFeatured],
    ["rescore_matches", rescoreMatches],
    ["remind_unbooked_meetings", remindUnbookedMeetings],
    ["refresh_instagram", refreshInstagram],
    // §Module 5: creative approvals past their turnaround window escalate.
    ["escalate_approvals", async () => ({ approvals_escalated: await escalateOverdueApprovals() })],
    // TAB 18 §18.4 digests; the weekly recap goes out on Mondays.
    ["send_digests", () => sendDigests()],
    // Sign-in failure rows only matter for 15 minutes.
    [
      "prune_sign_in_failures",
      async () => {
        await jdb()
          .from("sign_in_failures")
          .delete()
          .lt("created_at", new Date(Date.now() - 86_400_000).toISOString());
        return {};
      },
    ],
  ];
  const out: JobResult = {};
  for (const [name, job] of jobs) {
    try {
      Object.assign(out, await job());
    } catch (e) {
      out[name] = `error: ${e instanceof Error ? e.message : String(e)}`;
    }
  }
  return out;
}
