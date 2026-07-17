import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { getSiteUrl } from "@/lib/site-url";
import { requireSuperAdmin, getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";

function generateTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$";
  const pick = (s: string) => s[Math.floor(Math.random() * s.length)]!;
  const parts = [pick(upper), pick(lower), pick(digits), pick(special)];
  const all = upper + lower + digits + special;
  while (parts.length < 14) parts.push(pick(all));
  return parts.sort(() => Math.random() - 0.5).join("");
}

const InviteInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255),
});

export const inviteSubAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => InviteInput.parse(d))
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.userId);
    const email = data.email.toLowerCase();
    const password = generateTempPassword();
    const siteUrl = getSiteUrl();

    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile?.id) {
      const { data: existingRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existingProfile.id);
      const roles = (existingRoles ?? []).map((r) => r.role);
      if (roles.includes("super_admin")) throw new Error("This email belongs to a super admin.");
      if (roles.includes("abw_admin")) throw new Error("This email is already a sub-admin.");

      const { error: pwdErr } = await supabaseAdmin.auth.admin.updateUserById(existingProfile.id, {
        password,
        email_confirm: true,
      });
      if (pwdErr) throw new Error(pwdErr.message);

      await supabaseAdmin.from("profiles").update({
        display_name: data.name,
        last_login_at: null,
      } as never).eq("id", existingProfile.id);
      await supabaseAdmin.from("user_roles").delete().eq("user_id", existingProfile.id);
      await supabaseAdmin.from("user_roles").insert({ user_id: existingProfile.id, role: "abw_admin" });
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { role: "abw_admin", full_name: data.name },
      });
      if (createErr || !created.user) throw new Error(createErr?.message ?? "Could not create admin user");

      await supabaseAdmin.from("profiles").upsert({
        id: created.user.id,
        email,
        display_name: data.name,
        last_login_at: null,
      } as never);
      await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "abw_admin" });
    }

    const sendResult = await sendTransactionalEmailServer({
      templateName: "admin-invite",
      recipientEmail: email,
      idempotencyKey: `admin-invite-${email}-${Date.now()}`,
      templateData: {
        name: data.name,
        email,
        temporaryPassword: password,
        loginUrl: `${siteUrl}/login`,
        siteUrl,
      },
    });
    if (!sendResult.success) {
      throw new Error(
        sendResult.reason === "suppressed"
          ? `Could not send invite: ${email} is on the email suppression list.`
          : "Could not queue the invite email. Please try again.",
      );
    }

    const queueFlush = await flushEmailQueueInDev();
    if (queueFlush.error) {
      throw new Error(`Invite created but email delivery failed: ${queueFlush.error}`);
    }
    if (queueFlush.skipped && queueFlush.reason?.includes("RESEND_API_KEY")) {
      throw new Error(
        "Invite created but RESEND_API_KEY is not configured, so the email was not sent. Add it to your environment and invite again.",
      );
    }

    const inviter = await getActorProfile(context.userId);
    await auditAdminAction({
      actorId: context.userId,
      actorEmail: inviter?.email,
      action: "admin_invited",
      summary: `Invited sub-admin ${data.name} (${email})`,
      resourceType: "admin_user",
      resourceId: email,
      metadata: { invitee_name: data.name, invitee_email: email },
      notifyTitle: "Sub-admin invited",
      notifyBody: `${inviter?.display_name ?? inviter?.email ?? "Super admin"} invited ${data.name} (${email}) as a sub-admin.`,
    });

    return { ok: true };
  });

export const listSubAdmins = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireSuperAdmin(context.userId);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "abw_admin");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return { admins: [] };

    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, created_at, last_login_at, is_suspended")
      .in("id", ids)
      .order("created_at", { ascending: false });
    return { admins: profiles ?? [] };
  });

export const recordAdminLogin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: rolesData } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
    const roles = (rolesData ?? []).map((r) => r.role);
    if (!roles.includes("abw_admin") && !roles.includes("super_admin")) {
      return { ok: false };
    }

    await supabaseAdmin
      .from("profiles")
      .update({ last_login_at: new Date().toISOString() } as never)
      .eq("id", userId);

    const profile = await getActorProfile(userId);
    const roleLabel = roles.includes("super_admin") ? "Super admin" : "Sub-admin";

    await auditAdminAction({
      actorId: userId,
      actorEmail: profile?.email,
      action: "admin_login",
      summary: `${roleLabel} signed in (${profile?.email ?? userId})`,
      resourceType: "session",
      metadata: { roles },
      notifyTitle: roles.includes("abw_admin") && !roles.includes("super_admin") ? "Sub-admin signed in" : undefined,
      notifyBody:
        roles.includes("abw_admin") && !roles.includes("super_admin")
          ? `${profile?.display_name ?? profile?.email ?? "Sub-admin"} signed in to the admin dashboard.`
          : undefined,
    });

    return { ok: true };
  });

export const listAdminAuditLog = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ limit: z.number().int().min(1).max(500).optional() }).optional().parse(d))
  .handler(async ({ context, data }) => {
    await requireSuperAdmin(context.userId);
    const limit = data?.limit ?? 200;
    const { data: rows, error } = await supabaseAdmin
      .from("admin_audit_log" as never)
      .select("id, created_at, actor_id, actor_email, actor_role, action, resource_type, resource_id, summary, metadata")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw new Error(error.message);
    return { entries: rows ?? [] };
  });
