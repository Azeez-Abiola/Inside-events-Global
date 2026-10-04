import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSuperAdmin, getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";
import { notifyAdmins } from "@/lib/admin-notify";
import { isAdminEmailDomain, ADMIN_EMAIL_DOMAINS } from "@/lib/admin-domains";

/**
 * Admin access requests (TAB 3 §3.6.7).
 *
 * Admin accounts are invite-only and never go through the public wizard.
 * Picking "IGE Admin" on the role screen lands here instead, and an existing
 * super-admin grants access by hand from User Management.
 *
 * Requests are accepted only from ABW or IGE addresses. The check lives here
 * rather than only in the form, so posting straight at the endpoint cannot
 * get round it — which is also why there is no client INSERT policy on the
 * table and every write goes through the service role.
 */

/* eslint-disable @typescript-eslint/no-explicit-any --
   `admin_access_requests` postdates the last `supabase gen types` run. Same
   cast convention as odb()/adb() elsewhere. */
const rdb = (): any => supabaseAdmin as any;
/* eslint-enable @typescript-eslint/no-explicit-any */

export interface AdminAccessRequestRow {
  id: string;
  user_id: string | null;
  full_name: string;
  work_email: string;
  role_at_org: string;
  reason: string;
  status: "pending" | "granted" | "rejected";
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
}

const RequestInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  work_email: z.string().trim().email().max(255),
  role_at_org: z.string().trim().min(1).max(120),
  reason: z.string().trim().min(1).max(2000),
  terms_consent: z.literal(true, { message: "Terms & Privacy consent is required." }),
});

export const submitAdminAccessRequest = createServerFn({ method: "POST" })
  .inputValidator((d) => RequestInput.parse(d))
  .handler(async ({ data }) => {
    const email = data.work_email.toLowerCase();

    if (!isAdminEmailDomain(email)) {
      const list = ADMIN_EMAIL_DOMAINS.map((d) => `@${d}`).join(" or ");
      throw new Error(
        `Admin access is only available to ABW and IGE staff. Use your company address (${list}).`,
      );
    }

    // Already an admin: say so rather than filing a request that will sit in
    // the queue until someone works out it was a no-op.
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (existing?.id) {
      const { data: roles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", existing.id);
      if ((roles ?? []).some((r) => r.role === "abw_admin" || r.role === "super_admin")) {
        return { ok: true as const, alreadyAdmin: true };
      }
    }

    const { error } = await rdb()
      .from("admin_access_requests")
      .insert({
        user_id: existing?.id ?? null,
        full_name: data.full_name,
        work_email: email,
        role_at_org: data.role_at_org,
        reason: data.reason,
        terms_consent_at: new Date().toISOString(),
      });

    // The partial unique index rejects a second pending request for the same
    // address. That is not an error worth showing — they already asked.
    if (error && !/duplicate|unique/i.test(error.message)) {
      throw new Error(error.message);
    }

    await notifyAdmins({
      type: "admin_access_requested",
      title: "Admin access requested",
      body: `${data.full_name} (${email}, ${data.role_at_org}) asked for admin access.`,
      data: { work_email: email },
    }).catch(() => {});

    return { ok: true as const, alreadyAdmin: false };
  });

export const listAdminAccessRequests = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({ status: z.enum(["pending", "granted", "rejected", "all"]).default("pending") })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.userId);
    let q = rdb()
      .from("admin_access_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (data.status !== "all") q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return { requests: (rows ?? []) as AdminAccessRequestRow[] };
  });

export const reviewAdminAccessRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        request_id: z.string().uuid(),
        grant: z.boolean(),
        note: z.string().trim().max(1000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireSuperAdmin(context.userId);

    const { data: req } = await rdb()
      .from("admin_access_requests")
      .select("id, full_name, work_email, status, user_id")
      .eq("id", data.request_id)
      .maybeSingle();
    if (!req) throw new Error("That request no longer exists.");
    if (req.status !== "pending") throw new Error("That request has already been reviewed.");

    // Re-check the domain at grant time. The allow-list is editable, and a
    // request filed before a domain was removed must not slip through.
    if (data.grant && !isAdminEmailDomain(req.work_email as string)) {
      throw new Error(`${req.work_email} is no longer on the admin domain allow-list.`);
    }

    await rdb()
      .from("admin_access_requests")
      .update({
        status: data.grant ? "granted" : "rejected",
        reviewed_by: context.userId,
        reviewed_at: new Date().toISOString(),
        review_note: data.note ?? null,
      })
      .eq("id", data.request_id);

    // Granting records the decision; it does not create the account. The
    // super-admin still issues the invite from Team, so there is exactly one
    // path that provisions an admin and one place it is audited.
    const actor = await getActorProfile(context.userId);
    await auditAdminAction({
      actorId: context.userId,
      actorEmail: actor?.email,
      action: "admin_invited",
      summary: `${data.grant ? "Granted" : "Rejected"} admin access request from ${req.full_name} (${req.work_email})`,
      resourceType: "admin_access_request",
      resourceId: data.request_id,
      metadata: { work_email: req.work_email, granted: data.grant },
      notifyTitle: data.grant ? "Admin access granted" : "Admin access rejected",
      notifyBody: `${actor?.display_name ?? "A super admin"} ${data.grant ? "granted" : "rejected"} ${req.full_name}'s request. ${data.grant ? "Send them an invite from Team to create the account." : ""}`,
    });

    return { ok: true as const };
  });
