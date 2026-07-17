import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { IGE_SUPPORT_EMAIL } from "@/lib/support-email";
import { getSiteUrl } from "@/lib/site-url";
import { requirePlatformAdmin, requireSuperAdmin, getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";
import { isSubAdmin } from "@/lib/admin-permissions";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

const STATUS_LABELS: Record<string, string> = {
  under_review: "Under review",
  revision_requested: "Revisions requested",
  approved: "Approved",
  rejected: "Rejected",
  draft: "Returned to draft",
  listed: "Listed on marketplace",
  closed: "Closed",
  archived: "Archived",
};

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["revision_requested", "approved", "rejected"],
  revision_requested: ["submitted"],
  approved: ["listed", "draft"],
  listed: ["closed", "archived", "draft"],
};

async function ensureAdmin(supabase: any, userId: string) {
  await requirePlatformAdmin(userId);
}

export const listEventsForVetting = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const { data, error } = await supabase
      .from("events")
      .select(
        "id, name, slug, status, event_type, start_date, city, country, created_at, updated_at, organiser_id, vetting_notes, rejection_reason"
      )
      .in("status", ["submitted", "under_review", "revision_requested", "approved", "rejected", "listed"])
      .order("updated_at", { ascending: false });
    if (error) throw new Error(error.message);

    // Pull organiser email per event
    const ids = Array.from(new Set((data ?? []).map((e: any) => e.organiser_id)));
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, email")
      .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const map = new Map((profiles ?? []).map((p: any) => [p.id, p.email]));
    return {
      events: (data ?? []).map((e: any) => ({
        ...e,
        organiser_email: map.get(e.organiser_id) ?? null,
      })),
    };
  });

export const getEventForAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);
    const [{ data: ev, error }, { data: tiers }] = await Promise.all([
      supabase.from("events").select("*").eq("id", data.id).single(),
      supabase
        .from("event_sponsorship_tiers")
        .select("*")
        .eq("event_id", data.id)
        .order("display_order"),
    ]);
    if (error) throw new Error(error.message);
    const { data: profile } = ev.organiser_id
      ? await supabase
          .from("profiles")
          .select("id, email")
          .eq("id", ev.organiser_id)
          .single()
      : { data: null };
    return { event: ev, tiers: tiers ?? [], organiser: profile };
  });

const SetStatusInput = z.object({
  id: z.string().uuid(),
  to_status: z.enum([
    "draft",
    "under_review",
    "revision_requested",
    "approved",
    "rejected",
    "listed",
    "closed",
    "archived",
  ]),
  note: z.string().max(2000).optional().nullable(),
});

export const setEventVettingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SetStatusInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: ev, error } = await supabase
      .from("events")
      .select("id, status, name, organiser_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const allowed = ALLOWED_TRANSITIONS[ev.status] ?? [];
    if (!allowed.includes(data.to_status)) {
      throw new Error(
        `Invalid transition '${ev.status}' → '${data.to_status}'. Allowed: ${allowed.join(", ") || "none"}`
      );
    }

    const patch: Record<string, any> = {
      status: data.to_status,
      vetted_at: new Date().toISOString(),
      vetted_by: userId,
    };
    if (data.to_status === "approved" || data.to_status === "listed") {
      patch.ige_vetted = true;
    }
    if (data.to_status === "draft") {
      patch.ige_vetted = false;
      patch.vetting_notes = data.note ?? patch.vetting_notes ?? null;
    }
    if (data.to_status === "revision_requested") {
      patch.vetting_notes = data.note ?? null;
    }
    if (data.to_status === "rejected") {
      patch.rejection_reason = data.note ?? null;
    }

    const { error: upErr } = await supabase.from("events").update(patch as never).eq("id", data.id);
    if (upErr) throw new Error(upErr.message);

    // Notify organiser by email (best effort)
    try {
      if (ev.organiser_id && ["revision_requested", "approved", "rejected", "listed", "draft"].includes(data.to_status)) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", ev.organiser_id)
          .single();
        if (profile?.email) {
          await sendTransactionalEmailServer({
            templateName: "vetting-status",
            recipientEmail: profile.email,
            idempotencyKey: `vetting-${data.id}-${data.to_status}`,
            templateData: {
              eventName: ev.name,
              statusLabel: STATUS_LABELS[data.to_status] ?? data.to_status,
              note: data.note ?? undefined,
              dashboardUrl: `${SITE_URL}/dashboard`,
            },
          });
        }
      }
    } catch (emailErr) {
      console.error("[setEventVettingStatus] email failed", emailErr);
    }

    // In-app notification for organiser
    if (ev.organiser_id && ["revision_requested", "approved", "rejected", "listed", "under_review", "draft"].includes(data.to_status)) {
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: ev.organiser_id,
          type: "vetting_status",
          title: `Event vetting: ${STATUS_LABELS[data.to_status] ?? data.to_status}`,
          body: data.note ?? `Your event "${ev.name}" was updated.`,
          data: { event_id: data.id, status: data.to_status },
        });
      } catch (notifyErr) {
        console.error("[setEventVettingStatus] notify failed", notifyErr);
      }
    }

    if (["approved", "rejected", "listed", "revision_requested"].includes(data.to_status)) {
      const actor = await getActorProfile(userId);
      const roles = await requirePlatformAdmin(userId);
      await auditAdminAction({
        actorId: userId,
        actorEmail: actor?.email,
        action: "event_vetting_updated",
        summary: `Event "${ev.name}" → ${STATUS_LABELS[data.to_status] ?? data.to_status}`,
        resourceType: "event",
        resourceId: data.id,
        metadata: { to_status: data.to_status, note: data.note ?? null },
        notifyTitle: isSubAdmin(roles) ? "Sub-admin updated event vetting" : undefined,
        notifyBody: isSubAdmin(roles)
          ? `${actor?.display_name ?? actor?.email ?? "Sub-admin"} set "${ev.name}" to ${STATUS_LABELS[data.to_status] ?? data.to_status}.`
          : undefined,
      });
    }

    return { ok: true, status: data.to_status };
  });

export const adminDeleteEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireSuperAdmin(userId);

    const { data: ev, error } = await supabaseAdmin
      .from("events")
      .select("id, name, status, organiser_id")
      .eq("id", data.id)
      .single();
    if (error) throw new Error(error.message);

    const { data: deals } = await supabaseAdmin
      .from("deals")
      .select("status")
      .eq("event_id", data.id);
    const hasBlockingDeals = (deals ?? []).some(
      (d) => !["deal_lost", "cancelled"].includes(d.status),
    );
    if (hasBlockingDeals) {
      throw new Error("Cannot delete — this event has active deals in the pipeline. Close or cancel deals first.");
    }

    const { error: delErr } = await supabaseAdmin.from("events").delete().eq("id", data.id);
    if (delErr) throw new Error(delErr.message);

    if (ev.organiser_id) {
      try {
        await supabaseAdmin.from("notifications").insert({
          user_id: ev.organiser_id,
          type: "event_removed",
          title: "Event removed",
          body: `Your event "${ev.name}" was removed from IGE by an administrator.`,
          data: { event_id: data.id },
        });
      } catch {
        /* best effort */
      }
    }

    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId: userId,
      actorEmail: actor?.email,
      action: "event_deleted",
      summary: `Deleted event "${ev.name}"`,
      resourceType: "event",
      resourceId: data.id,
      notifyTitle: "Event deleted",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "Admin"} deleted event "${ev.name}".`,
    });

    return { ok: true };
  });

const SuspendInput = z.object({
  user_id: z.string().uuid(),
  suspended: z.boolean(),
  reason: z.string().max(500).optional().nullable(),
});

export const listPlatformUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await ensureAdmin(supabase, userId);

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, is_suspended, suspension_reason, is_active, created_at, last_login_at")
      .order("created_at", { ascending: false })
      .limit(300);
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p) => p.id);
    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role);
      roleMap.set(r.user_id, arr);
    }

    return {
      users: (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.id) ?? [],
      })),
    };
  });

export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SuspendInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireSuperAdmin(userId);
    if (data.user_id === userId) throw new Error("You cannot suspend your own account");

    const { data: targetRoles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", data.user_id);
    if (targetRoles?.some((r) => r.role === "super_admin")) throw new Error("Cannot suspend a super admin");

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
        body: data.reason ?? "Your IGE account has been deactivated. Contact support if you believe this is an error.",
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

    return { ok: true };
  });
