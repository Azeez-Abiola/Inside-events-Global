import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { getActorProfile, requireAdminPermission, requireSuperAdmin } from "@/lib/admin-auth";
import { recordAdminAudit } from "@/lib/admin-audit";
import { assertAdminMfa } from "@/lib/admin-mfa.server";
import { openDualControl } from "@/lib/dual-control.server";
import { revokeSessions } from "@/lib/account-lifecycle.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Admin Actions on a user record (TAB 6 §6.2.2): force sign-out, GDPR/NDPR
 * data export or erasure, and merging a duplicate account.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- lifecycle functions postdate the generated types.
const ldb = (): any => supabaseAdmin as any;

const UserId = z.object({ user_id: z.string().uuid() });

async function assertNotAdmin(userId: string) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (data?.some((r) => r.role === "super_admin" || r.role === "abw_admin")) {
    throw new Error("This action isn't available for admin accounts.");
  }
}

export const forceSignOut = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => UserId.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    const sessions = await revokeSessions(data.user_id);
    const actor = await getActorProfile(context.userId);
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "user_signed_out",
      summary: `Signed a user out of ${sessions} session${sessions === 1 ? "" : "s"}`,
      resourceType: "user",
      resourceId: data.user_id,
    });
    return { sessions };
  });

export const exportUserData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => UserId.parse(d))
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    const { data: dump, error } = await ldb().rpc("admin_export_user", { _user_id: data.user_id });
    if (error)
      throw new Error(
        /function|does not exist/.test(error.message)
          ? "Data export isn't switched on yet. Apply the latest migrations."
          : error.message,
      );
    const actor = await getActorProfile(context.userId);
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "user_data_exported",
      summary: "Exported a user's data (GDPR / NDPR request)",
      resourceType: "user",
      resourceId: data.user_id,
    });
    // As a string, so any shape of row survives serialisation.
    return {
      json: JSON.stringify(
        { exported_at: new Date().toISOString(), user_id: data.user_id, data: dump },
        null,
        2,
      ),
    };
  });

export const requestErasure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string; reason: string }) =>
    z
      .object({
        user_id: z.string().uuid(),
        reason: z.string().trim().min(10, "Say how the request came in").max(1000),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireAdminPermission(context.userId, "users_edit");
    assertAdminMfa(context.claims);
    await assertNotAdmin(data.user_id);
    const id = await openDualControl({
      action: "erase_user",
      targetUserId: data.user_id,
      requestedBy: context.userId,
      reason: data.reason,
    });
    return { id };
  });

export const findMergeTarget = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string }) =>
    z.object({ email: z.string().trim().email().max(255) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.userId);
    const { data: p } = await supabaseAdmin
      .from("profiles")
      .select("id, display_name, email, created_at")
      .ilike("email", data.email)
      .maybeSingle();
    return p
      ? {
          id: p.id,
          name: p.display_name ?? p.email ?? "User",
          email: p.email,
          created_at: p.created_at,
        }
      : null;
  });

export const mergeAccounts = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { from_user_id: string; into_user_id: string; reason: string }) =>
    z
      .object({
        from_user_id: z.string().uuid(),
        into_user_id: z.string().uuid(),
        reason: z.string().trim().min(5).max(1000),
      })
      .refine((v) => v.from_user_id !== v.into_user_id, "Pick two different accounts")
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.userId);
    assertAdminMfa(context.claims);
    await assertNotAdmin(data.from_user_id);
    await assertNotAdmin(data.into_user_id);
    const { data: summary, error } = await ldb().rpc("admin_merge_users", {
      _from: data.from_user_id,
      _into: data.into_user_id,
    });
    if (error)
      throw new Error(
        /function|does not exist/.test(error.message)
          ? "Account merging isn't switched on yet. Apply the latest migrations."
          : error.message,
      );
    await revokeSessions(data.from_user_id).catch(() => 0);
    // The duplicate can no longer sign in; its sign-in identity stays for the record.
    await supabaseAdmin.auth.admin
      .updateUserById(data.from_user_id, { ban_duration: "876000h" })
      .catch(() => undefined);

    const actor = await getActorProfile(context.userId);
    const moved = Object.values(
      (summary ?? {}) as Record<string, { moved: number; kept: number }>,
    ).reduce((acc, v) => ({ moved: acc.moved + v.moved, kept: acc.kept + v.kept }), {
      moved: 0,
      kept: 0,
    });
    await recordAdminAudit({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "user_merged",
      summary: `Merged a duplicate account (${moved.moved} records moved, ${moved.kept} kept on the duplicate): ${data.reason}`,
      resourceType: "user",
      resourceId: data.into_user_id,
      metadata: {
        from_user_id: data.from_user_id,
        into_user_id: data.into_user_id,
        tables: summary ?? {},
      },
    });

    const { data: into } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", data.into_user_id)
      .maybeSingle();
    await supabaseAdmin.from("notifications").insert({
      user_id: data.into_user_id,
      type: "admin_change",
      title: "IGE merged your duplicate account",
      body: `Everything from your other IGE account now lives here. Why: ${data.reason}`,
      data: { link: "/dashboard" },
    });
    if (into?.email) {
      await sendTransactionalEmailServer({
        templateName: "ige-notice",
        recipientEmail: into.email,
        idempotencyKey: `merge-${data.from_user_id}-${data.into_user_id}`,
        templateData: {
          subject: "We merged your duplicate IGE account",
          heading: "We merged your duplicate IGE account",
          lines: [
            `Hi ${(into.display_name ?? "").split(" ")[0] || "there"},`,
            "You had two IGE accounts. Our team moved everything from the other one into this one, and closed the duplicate.",
            `Why: ${data.reason}`,
            "If anything is missing, reply through Message IGE.",
          ],
          ctaLabel: "Open IGE",
          ctaUrl: `${getSiteUrl()}/dashboard`,
        },
      }).catch(() => {});
    }
    return { moved: moved.moved, kept: moved.kept };
  });
