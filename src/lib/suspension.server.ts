import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { IGE_SUPPORT_EMAIL } from "@/lib/support-email";
import { getSiteUrl } from "@/lib/site-url";
import { getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";

/**
 * Suspend or reactivate an account and tell the person. Suspension reaches
 * here only after a second Super Admin approved it (TAB 6 §6.9).
 */
export async function performSuspension(
  userId: string,
  data: { user_id: string; suspended: boolean; reason?: string | null },
) {
  const { error } = await supabaseAdmin
    .from("profiles")
    .update({
      is_suspended: data.suspended,
      suspension_reason: data.suspended ? (data.reason ?? "Suspended by admin") : null,
    } as never)
    .eq("id", data.user_id);
  if (error) throw new Error(error.message);

  if (data.suspended) {
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", data.user_id)
      .maybeSingle();

    await supabaseAdmin.from("notifications").insert({
      user_id: data.user_id,
      type: "account_suspended",
      title: "Account deactivated",
      body:
        data.reason ??
        "Your IGE account has been deactivated. Contact support if you believe this is an error.",
      data: {},
    });

    if (targetProfile?.email) {
      try {
        await sendTransactionalEmailServer({
          templateName: "account-suspended",
          recipientEmail: targetProfile.email,
          idempotencyKey: `account-suspended-${data.user_id}`,
          templateData: {
            name: targetProfile.display_name ?? undefined,
            reason: data.reason ?? "Your account has been deactivated by the IGE team.",
            supportEmail: IGE_SUPPORT_EMAIL,
            siteUrl: getSiteUrl(),
          },
        });
        await flushEmailQueueInDev();
      } catch (e) {
        console.error("[setUserSuspended] deactivation email failed", e);
      }
    }
  } else {
    // Someone told they were deactivated will not try signing in again on
    // spec, so restoring access silently is the same as not restoring it.
    const { data: targetProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", data.user_id)
      .maybeSingle();

    await supabaseAdmin.from("notifications").insert({
      user_id: data.user_id,
      type: "account_restored",
      title: "Account restored",
      body: "Your IGE account is active again. Everything is just as you left it.",
      data: {},
    });

    if (targetProfile?.email) {
      try {
        await sendTransactionalEmailServer({
          templateName: "account-restored",
          recipientEmail: targetProfile.email,
          // Timestamped so a later deactivate/reactivate cycle isn't
          // suppressed as a duplicate of this one.
          idempotencyKey: `account-restored-${data.user_id}-${Date.now()}`,
          templateData: {
            name: targetProfile.display_name ?? undefined,
            supportEmail: IGE_SUPPORT_EMAIL,
            loginUrl: `${getSiteUrl()}/login`,
            siteUrl: getSiteUrl(),
          },
        });
        await flushEmailQueueInDev();
      } catch (e) {
        console.error("[setUserSuspended] reactivation email failed", e);
      }
    }
  }

  const actor = await getActorProfile(userId);
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("email, display_name")
    .eq("id", data.user_id)
    .maybeSingle();

  await auditAdminAction({
    actorId: userId,
    actorEmail: actor?.email,
    action: data.suspended ? "user_suspended" : "user_reactivated",
    summary: data.suspended
      ? `Deactivated ${targetProfile?.email ?? data.user_id}`
      : `Reactivated ${targetProfile?.email ?? data.user_id}`,
    resourceType: "user",
    resourceId: data.user_id,
    metadata: { reason: data.reason ?? null },
    notifyTitle: data.suspended ? "User account deactivated" : "User account reactivated",
    notifyBody: data.suspended
      ? `${actor?.display_name ?? actor?.email ?? "Admin"} deactivated ${targetProfile?.display_name ?? targetProfile?.email ?? "a user"}.`
      : `${actor?.display_name ?? actor?.email ?? "Admin"} reactivated ${targetProfile?.display_name ?? targetProfile?.email ?? "a user"}.`,
  });
}
