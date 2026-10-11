import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { recordAdminAudit } from "@/lib/admin-audit";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Approve and Notify (TAB 19 §19.3A), shared by the Match Approval Queue and
 * the dual-control sign-off for Managed Service matches (TAB 6 §6.9).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the matching tables postdate the generated types.
const mdb = (): any => supabaseAdmin as any;

export async function notifyBoth(
  m: Record<string, string>,
  title: string,
  bodyFor: (forSubject: boolean) => string,
  cta: { label: string; path: string },
) {
  const site = getSiteUrl();
  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id, email, display_name")
    .in("id", [m.subject_user_id, m.candidate_user_id]);
  for (const forSubject of [true, false]) {
    const uid = forSubject ? m.subject_user_id : m.candidate_user_id;
    const p = (profiles ?? []).find((x) => x.id === uid);
    const body = bodyFor(forSubject);
    await supabaseAdmin.from("notifications").insert({
      user_id: uid,
      type: "match",
      title,
      body,
      data: { match_id: m.id, link: cta.path },
    });
    if (p?.email) {
      const first = (p.display_name ?? "").split(" ")[0] || "there";
      await sendTransactionalEmailServer({
        templateName: "ige-notice",
        category: "matches",
        recipientEmail: p.email,
        idempotencyKey: `match-${m.id}-${title}-${uid}`,
        templateData: {
          subject: title,
          heading: title,
          lines: [`Hi ${first},`, ...body.split("\n")],
          ctaLabel: cta.label,
          ctaUrl: `${site}${cta.path}`,
        },
      }).catch(() => {});
    }
  }
}

export async function performMatchApproval(
  actorId: string,
  m: Record<string, string>,
  input: { proposed_slots: string[]; video_call_url: string; note?: string | null },
) {
  const now = new Date().toISOString();
  await mdb()
    .from("match_scores")
    .update({
      queue_status: "approved",
      reviewed_by: actorId,
      reviewed_at: now,
      review_note: input.note ?? null,
      notification_sent_at: now,
    })
    .eq("id", m.id);
  await mdb().from("meeting_bookings").upsert(
    {
      match_id: m.id,
      proposed_slots: input.proposed_slots,
      video_call_url: input.video_call_url,
      status: "awaiting_booking",
      updated_at: now,
    },
    { onConflict: "match_id" },
  );

  await notifyBoth(
    m,
    "Admin has approved a match for you",
    (forSubject) =>
      `${forSubject ? m.user_summary_for_subject : m.user_summary_for_candidate} has been approved as a match for you by our team.\nHere is why: ${m.why_user_text ?? "a strong fit on what you both told IGE"}.\nUse the link below to book a short introductory call at a time that works for you.`,
    { label: "Book Your Introductory Meeting", path: "/dashboard/matches" },
  );

  await recordAdminAudit({
    actorId: actorId,
    action: "match_approved",
    summary: `Approved a ${m.pairing_type.replace(/_/g, " ")} match (score ${m.composite_score})`,
    resourceType: "match",
    resourceId: m.id,
    metadata: { subject_user_id: m.subject_user_id, candidate_user_id: m.candidate_user_id },
  }).catch(() => {});
}
