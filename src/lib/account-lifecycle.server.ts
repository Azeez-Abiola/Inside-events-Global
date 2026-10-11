import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getActorProfile } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lifecycle columns postdate the generated types.
const ldb = (): any => supabaseAdmin as any;

/** Ends every session; an access token already issued lapses within the hour. */
export async function revokeSessions(userId: string): Promise<number> {
  const { data, error } = await ldb().rpc("admin_revoke_sessions", { _user_id: userId });
  if (error)
    throw new Error(
      /function|does not exist/.test(error.message)
        ? "Force sign-out isn't switched on yet. Apply the latest migrations."
        : error.message,
    );
  return Number(data ?? 0);
}

/**
 * GDPR / NDPR erasure (TAB 6 §6.2.2), carried out only after a second Super
 * Admin approved it. Personal details are removed and sign-in is closed for
 * good; deal, payment and commission records are kept, pseudonymised, because
 * the law requires financial records to be retained.
 */
export async function performErasure(
  userId: string,
  by: { requestedBy: string; approvedBy: string; reason: string },
) {
  const { data: p } = await ldb()
    .from("profiles")
    .select("email, display_name")
    .eq("id", userId)
    .maybeSingle();
  if (!p) throw new Error("User not found");

  // Confirm to the person before their address is removed.
  if (p.email) {
    await sendTransactionalEmailServer({
      templateName: "ige-notice",
      recipientEmail: p.email,
      idempotencyKey: `erasure-${userId}`,
      templateData: {
        subject: "Your IGE data has been erased",
        heading: "Your IGE data has been erased",
        lines: [
          `Hi ${(p.display_name ?? "").split(" ")[0] || "there"},`,
          "As requested, IGE has erased the personal details on your account and closed it.",
          "Records of completed deals and payments are kept in pseudonymised form, as the law requires.",
          "If you didn't ask for this, reply to this email straight away.",
        ],
        ctaLabel: "Contact IGE",
        ctaUrl: `${getSiteUrl()}/contact`,
      },
    }).catch(() => {});
  }

  const placeholder = `erased-${userId.slice(0, 8)}@erased.invalid`;
  const { error } = await ldb()
    .from("profiles")
    .update({
      display_name: "Erased user",
      email: placeholder,
      email_domain: null,
      phone: null,
      avatar_url: null,
      linkedin_url: null,
      linkedin_id: null,
      linkedin_employer: null,
      google_id: null,
      is_suspended: true,
      suspension_reason: "Personal data erased at the user's request",
      erased_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);

  // Personal content goes; a table that is referenced elsewhere is skipped.
  for (const table of [
    "onboarding_applications",
    "organiser_profiles",
    "sponsor_profiles",
    "referral_partner_profiles",
    "media_partner_profiles",
    "notifications",
    "notification_preferences",
    "admin_inbox_threads",
  ]) {
    await ldb()
      .from(table)
      .delete()
      .eq("user_id", userId)
      .then(
        () => undefined,
        () => undefined,
      );
  }

  await revokeSessions(userId).catch(() => 0);
  // Soft delete scrambles the sign-in identity but keeps the row, so the
  // retained financial records still point somewhere.
  const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId, true);
  if (authErr)
    throw new Error(`Profile erased, but sign-in could not be closed: ${authErr.message}`);

  const approver = await getActorProfile(by.approvedBy);
  await recordAdminAudit({
    actorId: by.requestedBy,
    action: "user_erased",
    summary: `Erased personal data (approved by ${approver?.display_name ?? approver?.email ?? "a second Super Admin"}): ${by.reason}`,
    resourceType: "user",
    resourceId: userId,
    metadata: { approved_by: by.approvedBy, dual_control: true },
  });
}
