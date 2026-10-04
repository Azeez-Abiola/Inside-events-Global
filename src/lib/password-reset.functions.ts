import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getAuthRedirectUrl, getSiteUrl } from "@/lib/site-url";
import { notifyAdmins } from "@/lib/admin-notify";
import { recordSystemAudit, auditAdminAction } from "@/lib/admin-audit";
import { requireAdminPermission, getActorProfile } from "@/lib/admin-auth";
import { generateTempPassword } from "@/lib/temp-password";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";

/**
 * Password reset (TAB 2 §2.4, TAB 6 §6.2.3).
 *
 * Three rules from the spec shape this file:
 *
 *  1. "The reset link is sent automatically to the account's registered email
 *     address only, never to an address typed in on the screen." So the lookup
 *     is server-side with the service role, and the email goes to the address
 *     on the account — not to whatever was submitted.
 *  2. "IGE shows the same confirmation message whether or not an account
 *     exists." So this always resolves `{ ok: true }`. Nothing about the
 *     result distinguishes a hit from a miss.
 *  3. "Every reset request and every completed reset creates a notification in
 *     the Admin Inbox and an Audit Log entry."
 */

/** Look up an account without telling the caller whether we found one. */
async function findUserByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("id, email, display_name")
    .ilike("email", email)
    .maybeSingle();
  return data as { id: string; email: string | null; display_name: string | null } | null;
}

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ email: z.string().trim().email().max(255) }).parse(d))
  .handler(async ({ data }) => {
    const submitted = data.email.toLowerCase();
    const profile = await findUserByEmail(submitted);

    // Unknown address: look identical to the caller, log nothing that would
    // turn the audit trail into a list of addresses people have guessed at.
    if (!profile?.email) return { ok: true as const };

    const { error } = await supabaseAdmin.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${getAuthRedirectUrl()}/reset-password`,
    });

    // A send failure is still not disclosed — the caller gets the same answer
    // either way — but Admin needs to know a reset did not go out.
    if (error) {
      await notifyAdmins({
        type: "password_reset_failed",
        title: "Password reset email failed",
        body: `A reset was requested for ${profile.email} but the email could not be sent: ${error.message}`,
        data: { user_id: profile.id, email: profile.email },
      }).catch(() => {});
      return { ok: true as const };
    }

    await Promise.allSettled([
      notifyAdmins({
        type: "password_reset_requested",
        title: "Password reset requested",
        body: `${profile.display_name ?? profile.email} requested a password reset. The link was sent to their registered email and expires in 60 minutes.`,
        data: { user_id: profile.id, email: profile.email },
      }),
      recordSystemAudit({
        action: "password_reset_requested",
        summary: `Password reset requested for ${profile.email}`,
        subjectId: profile.id,
        subjectEmail: profile.email,
        resourceType: "user",
        resourceId: profile.id,
      }),
    ]);

    return { ok: true as const };
  });

/**
 * Called by the Set New Password screen once the new password has been saved,
 * so the completed half of the trail is recorded too.
 */
export const recordPasswordResetCompleted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", context.userId)
      .maybeSingle();
    const email = (profile as { email?: string | null } | null)?.email ?? null;
    const name = (profile as { display_name?: string | null } | null)?.display_name ?? email;

    await Promise.allSettled([
      notifyAdmins({
        type: "password_reset_completed",
        title: "Password reset completed",
        body: `${name ?? context.userId} set a new password. All of their other sessions were signed out.`,
        data: { user_id: context.userId, email },
      }),
      recordSystemAudit({
        action: "password_reset_completed",
        summary: `Password reset completed for ${email ?? context.userId}`,
        subjectId: context.userId,
        subjectEmail: email,
        resourceType: "user",
        resourceId: context.userId,
      }),
    ]);

    return { ok: true as const };
  });

/**
 * Admin resets a password from the back end (TAB 6 §6.2.3) for someone who
 * cannot complete the self-serve flow. Issues a temporary password and emails
 * it to the registered address — Admin never sees it in a form they could
 * copy out of, and never types one in themselves.
 */
export const adminResetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Taking over someone's credentials sits with the same tier that can
    // suspend an account, which is super admin only.
    await requireAdminPermission(context.userId, "users_suspend");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name")
      .eq("id", data.user_id)
      .maybeSingle();
    const target = profile as {
      id: string;
      email: string | null;
      display_name: string | null;
    } | null;
    if (!target?.email) throw new Error("That account has no email address on file.");

    const password = generateTempPassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(target.id, { password });
    if (error) throw new Error(error.message);

    const siteUrl = getSiteUrl();
    const sendResult = await sendTransactionalEmailServer({
      templateName: "admin-invite",
      recipientEmail: target.email,
      idempotencyKey: `admin-password-reset-${target.id}-${Date.now()}`,
      templateData: {
        name: target.display_name ?? target.email,
        email: target.email,
        temporaryPassword: password,
        loginUrl: `${siteUrl}/login`,
        siteUrl,
      },
    });
    if (!sendResult.success) {
      throw new Error(
        sendResult.reason === "suppressed"
          ? `Password was reset, but ${target.email} is on the email suppression list — tell them another way.`
          : "Password was reset, but the email could not be queued. Tell them another way.",
      );
    }

    const actor = await getActorProfile(context.userId);
    await auditAdminAction({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "password_reset_by_admin",
      summary: `Reset the password for ${target.display_name ?? target.email}`,
      resourceType: "user",
      resourceId: target.id,
      metadata: { target_email: target.email },
      notifyTitle: "Password reset by admin",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "An admin"} reset the password for ${target.display_name ?? target.email} and emailed them a temporary one.`,
    });

    return { ok: true as const };
  });
