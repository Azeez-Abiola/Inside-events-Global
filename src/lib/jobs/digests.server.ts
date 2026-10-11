import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";
import { quarterOf, quarterProgress, spendPace } from "@/lib/fiscal";
import { toUsd, type Rates } from "@/lib/currency";
import { computeFundraising } from "@/lib/fundraising.server";

/**
 * Command Center digest emails (TAB 18 §18.4): a daily brief for brands and
 * organisers, and a weekly "Week in Review" on Mondays. Each person chooses
 * daily, weekly or off in Account Settings; suppressed and unsubscribed
 * addresses are skipped by the email sender itself.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- tables newer than the generated types.
const ddb = (): any => supabaseAdmin as any;

const DAY = 86_400_000;
const TERMINAL = ["payment_received", "deal_closed", "deal_lost"];
const COMMITTED = ["verbal_commitment", "contract_sent", "contract_signed"];
const QUARTER_KEYS = ["q1_allocation", "q2_allocation", "q3_allocation", "q4_allocation"] as const;

type Person = {
  id: string;
  email: string;
  first: string;
  frequency: "daily" | "weekly";
  roles: Set<string>;
};

const usd = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
const money = (cur: string, n: number) => {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: cur,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `${cur} ${Math.round(n).toLocaleString()}`;
  }
};
const dateLabel = (d: Date) =>
  d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

async function send(p: Person, key: string, subject: string, lines: string[], cta: string) {
  await sendTransactionalEmailServer({
    templateName: "ige-notice",
    recipientEmail: p.email,
    idempotencyKey: key,
    templateData: {
      subject,
      heading: subject,
      lines: [`Hi ${p.first}, here's where things stand:`, ...lines],
      ctaLabel: cta,
      ctaUrl: `${getSiteUrl()}/dashboard`,
    },
  });
}

async function newMatches(uid: string, sinceMs: number): Promise<number> {
  const { data } = await ddb()
    .from("match_scores")
    .select("id")
    .eq("queue_status", "approved")
    .gte("reviewed_at", new Date(Date.now() - sinceMs).toISOString())
    .or(`subject_user_id.eq.${uid},candidate_user_id.eq.${uid}`);
  return (data ?? []).length;
}

async function stallingDeals(
  uid: string,
  field: "sponsor_user_id" | "organiser_id",
): Promise<number> {
  const { data } = await ddb()
    .from("deals")
    .select("id, status")
    .eq(field, uid)
    .lt("updated_at", new Date(Date.now() - 14 * DAY).toISOString());
  return ((data ?? []) as { status: string }[]).filter((d) => !TERMINAL.includes(d.status)).length;
}

/** "Your IGE morning brief" for a brand / sponsor. */
async function sponsorLines(uid: string, rates: Rates): Promise<string[] | null> {
  const [{ data: markets }, { data: deals }] = await Promise.all([
    ddb().from("market_budgets").select("*").eq("sponsor_user_id", uid),
    ddb()
      .from("deals")
      .select(
        "status, deal_value_native, deal_currency, deal_value_usd, updated_at, created_at, paid_at",
      )
      .eq("sponsor_user_id", uid),
  ]);
  const M = (markets ?? []) as Record<string, unknown>[];
  const lines: string[] = [];
  if (M.length) {
    const primary = quarterProgress(Number(M[0].fiscal_year_start_month ?? 1));
    const current = primary.quarters[primary.index];
    const allocation = M.reduce((n, m) => {
      const mp = quarterProgress(Number(m.fiscal_year_start_month ?? 1));
      return (
        n + (toUsd(Number(m[QUARTER_KEYS[mp.index]] ?? 0), String(m.currency ?? "USD"), rates) ?? 0)
      );
    }, 0);
    let spent = 0;
    for (const d of (deals ?? []) as Record<string, unknown>[]) {
      const paid = d.status === "payment_received";
      if (!paid && !COMMITTED.includes(String(d.status))) continue;
      const date = String((paid ? d.paid_at : null) ?? d.updated_at ?? d.created_at);
      if (quarterOf(date, primary.quarters) !== current.q) continue;
      spent +=
        Number(d.deal_value_usd ?? 0) ||
        (toUsd(Number(d.deal_value_native ?? 0), String(d.deal_currency ?? "USD"), rates) ?? 0);
    }
    const pace = spendPace(spent, allocation, primary.elapsed);
    const paceLabel = pace.pace === "on" ? "on" : pace.pace === "ahead" ? "ahead of" : "behind";
    lines.push(
      `Remaining budget this quarter: ${usd(Math.max(0, allocation - spent))} (${paceLabel} pace).`,
    );
  }
  const [matches, stalling] = await Promise.all([
    newMatches(uid, DAY),
    stallingDeals(uid, "sponsor_user_id"),
  ]);
  if (matches)
    lines.push(
      `${matches} new vetted ${matches === 1 ? "event matches" : "events match"} your sector and budget.`,
    );
  if (stalling)
    lines.push(
      `${stalling} ${stalling === 1 ? "deal hasn't" : "deals haven't"} moved in 14+ days.`,
    );
  return lines.length ? lines : null;
}

/** "Your funding gap update" for an event organiser. */
async function organiserLines(uid: string): Promise<{ eventName: string; lines: string[] } | null> {
  const { events } = await computeFundraising(uid);
  const upcoming = events
    .filter((e) => e.days_to_event != null && e.days_to_event >= 0)
    .sort((a, b) => (a.days_to_event ?? 0) - (b.days_to_event ?? 0));
  const ev = upcoming.find((e) => e.target != null) ?? upcoming[0];
  if (!ev) return null;
  const lines: string[] = [];
  if (ev.gap != null)
    lines.push(
      `Funding gap remaining: ${money(ev.currency, ev.gap)} (${ev.days_to_event} days to go).`,
    );
  else lines.push(`${ev.days_to_event} days to go. Set a funding target to track your gap.`);

  const { data: scores } = await ddb()
    .from("readiness_scores")
    .select("composite_score, computed_at")
    .eq("event_id", ev.event_id)
    .order("computed_at", { ascending: false })
    .limit(30);
  const S = (scores ?? []) as { composite_score: number; computed_at: string }[];
  if (S.length) {
    const weekAgo = Date.now() - 7 * DAY;
    const before = S.find((s) => Date.parse(s.computed_at) <= weekAgo);
    const delta = before ? S[0].composite_score - before.composite_score : 0;
    lines.push(
      `Brand-Readiness Score: ${S[0].composite_score}/100 (${delta >= 0 ? "+" : ""}${delta} this week).`,
    );
  }
  const { data: nudge } = await ddb()
    .from("coaching_nudges")
    .select("message")
    .eq("event_id", ev.event_id)
    .is("resolved_at", null)
    .is("dismissed_at", null)
    .order("surfaced_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (nudge?.message) lines.push(`Today's coaching tip: ${nudge.message}`);
  return { eventName: ev.name, lines };
}

/** "Your IGE Week in Review". */
async function weeklyLines(uid: string): Promise<string[] | null> {
  const since = new Date(Date.now() - 7 * DAY).toISOString();
  const nextWeek = new Date(Date.now() + 7 * DAY).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const [{ data: moved }, matches, { data: soon }] = await Promise.all([
    ddb()
      .from("deals")
      .select("id")
      .or(`sponsor_user_id.eq.${uid},organiser_id.eq.${uid}`)
      .gte("updated_at", since),
    newMatches(uid, 7 * DAY),
    ddb()
      .from("events")
      .select("name, start_date")
      .eq("organiser_id", uid)
      .gte("start_date", today)
      .lte("start_date", nextWeek),
  ]);
  const lines: string[] = [];
  const m = (moved ?? []).length;
  if (m) lines.push(`Pipeline movement: ${m} deal${m === 1 ? "" : "s"} moved this week.`);
  if (matches) lines.push(`New matches: ${matches} approved by IGE this week.`);
  for (const e of (soon ?? []) as { name: string; start_date: string }[])
    lines.push(
      `Coming up: ${e.name} on ${new Date(e.start_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}.`,
    );
  return lines.length ? lines : null;
}

export async function sendDigests(now = new Date()): Promise<Record<string, number | string>> {
  const { data: rows, error } = await ddb()
    .from("profiles")
    .select("id, email, display_name, digest_frequency, is_suspended, is_active")
    .neq("digest_frequency", "off")
    .limit(5000);
  if (error) return { digests: `skipped (${error.message})` };
  const people = ((rows ?? []) as Record<string, unknown>[]).filter(
    (r) => r.email && !r.is_suspended && r.is_active !== false,
  );
  const ids = people.map((p) => String(p.id));
  if (!ids.length) return { digests_sent: 0 };

  const roleMap = new Map<string, Set<string>>();
  for (let i = 0; i < ids.length; i += 500) {
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", ids.slice(i, i + 500));
    for (const r of roles ?? [])
      roleMap.set(r.user_id, (roleMap.get(r.user_id) ?? new Set()).add(r.role));
  }
  const { data: rate } = await ddb()
    .from("exchange_rates")
    .select("ngn_rate, gbp_rate, eur_rate")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const rates = (rate ?? null) as Rates;
  const isMonday = now.getUTCDay() === 1;
  const day = now.toISOString().slice(0, 10);
  let sent = 0;
  let failed = 0;

  for (const r of people) {
    const roles = roleMap.get(String(r.id)) ?? new Set<string>();
    if (roles.has("abw_admin") || roles.has("super_admin")) continue;
    const p: Person = {
      id: String(r.id),
      email: String(r.email),
      first: String(r.display_name ?? "").split(" ")[0] || "there",
      frequency: r.digest_frequency === "weekly" ? "weekly" : "daily",
      roles,
    };
    try {
      if (p.frequency === "daily") {
        if (roles.has("sponsor")) {
          const lines = await sponsorLines(p.id, rates);
          if (lines) {
            await send(
              p,
              `digest-sponsor-${p.id}-${day}`,
              `Your IGE morning brief - ${dateLabel(now)}`,
              lines,
              "Open My Command Center",
            );
            sent++;
          }
        } else if (roles.has("organiser")) {
          const o = await organiserLines(p.id);
          if (o) {
            await send(
              p,
              `digest-organiser-${p.id}-${day}`,
              `Your funding gap update - ${dateLabel(now)}`,
              [`Today's snapshot for ${o.eventName}:`, ...o.lines],
              "Open My Command Center",
            );
            sent++;
          }
        }
      }
      if (isMonday) {
        const lines = await weeklyLines(p.id);
        if (lines) {
          await send(
            p,
            `digest-weekly-${p.id}-${day}`,
            "Your week on IGE",
            [...lines, "What's coming up in the next 7 days is on your Command Center."],
            "See the Full Recap",
          );
          sent++;
        }
      }
      await ddb()
        .from("profiles")
        .update({ digest_last_sent_at: now.toISOString() })
        .eq("id", p.id);
    } catch {
      failed++;
    }
  }
  return { digests_sent: sent, digests_failed: failed };
}
