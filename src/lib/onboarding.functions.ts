/**
 * Server functions for the IGE onboarding wizard (PRD §3).
 * Handles save-and-resume, submission, retrieval, and admin review actions.
 *
 * NOTE: `onboarding_applications` is not yet in the generated Supabase types (migration is new).
 * All queries on that table use `odb()` which casts to `any` for type safety until
 * `supabase gen types` is re-run after applying the migration.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { flushEmailQueueInDev } from "@/lib/email/flush-queue-dev";
import { requirePlatformAdmin, getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

// Helper: cast supabaseAdmin to `any` so unregistered tables don't produce type errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function odb(): any { return supabaseAdmin as any; }

// ─── Row type for onboarding_applications ─────────────────────────────────────

interface OARow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  sections: Record<string, Record<string, string | string[] | number | boolean | null>>;
  current_section: number;
  reviewer_notes: Record<string, string>;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

// ─── Save a single section (save & resume) ────────────────────────────────────

const SaveSectionInput = z.object({
  role:           z.enum(["organiser","sponsor","referral_partner","media_partner","partnerships_pro","creative_hub","ige_admin"]),
  sectionKey:     z.string().min(1).max(8),
  sectionData:    z.record(z.unknown()),
  currentSection: z.number().int().min(0),
});

export const saveOnboardingSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SaveSectionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: existing } = await odb()
      .from("onboarding_applications")
      .select("id, sections, status")
      .eq("user_id", userId)
      .maybeSingle() as { data: OARow | null };

    const currentSections = existing?.sections ?? {};
    const newSections = { ...currentSections, [data.sectionKey]: data.sectionData };

    if (!existing) {
      const { error } = await odb()
        .from("onboarding_applications")
        .insert({
          user_id:         userId,
          role:            data.role,
          sections:        newSections,
          current_section: data.currentSection,
          status:          "draft",
        }) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    } else {
      if (["submitted", "under_review", "approved"].includes(existing.status)) {
        throw new Error("Application already submitted — cannot modify.");
      }
      const { error } = await odb()
        .from("onboarding_applications")
        .update({
          sections:        newSections,
          current_section: data.currentSection,
          role:            data.role,
        })
        .eq("user_id", userId) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    }

    return { ok: true };
  });

// ─── Submit application ────────────────────────────────────────────────────────

const SubmitInput = z.object({
  dataConsentAccepted:  z.boolean(),
  termsConsentAccepted: z.boolean(),
  clientIp:             z.string().optional(),
});

export const submitOnboardingApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!data.dataConsentAccepted) throw new Error("Data processing consent is required.");
    if (!data.termsConsentAccepted) throw new Error("Terms & Privacy consent is required.");

    const now = new Date().toISOString();

    const { data: app } = await odb()
      .from("onboarding_applications")
      .select("id, sections, status, role")
      .eq("user_id", userId)
      .maybeSingle() as { data: OARow | null };

    if (!app) throw new Error("No application found — please complete the wizard first.");
    if (["submitted", "under_review", "approved"].includes(app.status)) {
      throw new Error("Application already submitted.");
    }

    const { error: updateErr } = await odb()
      .from("onboarding_applications")
      .update({
        status:           "submitted",
        submitted_at:     now,
        data_consent_at:  now,
        data_consent_ip:  data.clientIp ?? "unknown",
        terms_consent_at: now,
        terms_consent_ip: data.clientIp ?? "unknown",
      })
      .eq("user_id", userId) as { error: { message: string } | null };
    if (updateErr) throw new Error(updateErr.message);

    // Set profile as pending approval
    await supabaseAdmin
      .from("profiles")
      .update({ is_active: false } as never)
      .eq("id", userId);

    // Fetch profile for emails
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.email) {
      try {
        await sendTransactionalEmailServer({
          templateName: "account-pending-approval",
          recipientEmail: profile.email,
          idempotencyKey: `onboarding-pending-${userId}`,
          templateData: { name: profile.display_name ?? undefined, siteUrl: SITE_URL },
        });
        await flushEmailQueueInDev();
      } catch (e) {
        console.error("[submitOnboarding] email failed", e);
      }
    }

    // Notify admins
    const { data: admins } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .in("role", ["super_admin", "abw_admin"]);
    for (const a of admins ?? []) {
      await supabaseAdmin.from("notifications").insert({
        user_id: a.user_id,
        type:    "user_pending_approval",
        title:   "New onboarding submission",
        body:    `${profile?.display_name ?? profile?.email ?? "A user"} submitted their ${app.role} application.`,
        data:    { user_id: userId, role: app.role },
      } as never);
    }

    return { ok: true };
  });

// ─── Get my application (for resume + pending screen) ─────────────────────────

export const getMyOnboardingApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const userId = (context as any).userId as string;
    const res = await odb()
      .from("onboarding_applications")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return { application: (res.data ?? null) as OARow | null };
  });

// ─── Admin: list all applications ─────────────────────────────────────────────

export const listOnboardingApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; role?: string; limit?: number; offset?: number }) =>
    z.object({
      status: z.enum(["all","submitted","under_review","approved","rejected","changes_requested"]).optional().default("all"),
      role:   z.string().optional(),
      limit:  z.number().int().min(1).max(200).optional().default(100),
      offset: z.number().int().min(0).optional().default(0),
    }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const userId = (context as any).userId as string;
    await requirePlatformAdmin(userId);

    let query = odb()
      .from("onboarding_applications")
      .select("id, user_id, role, status, submitted_at, reviewed_at, current_section, reviewer_notes, sections, created_at")
      .order("submitted_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.role) query = query.eq("role", data.role);

    const { data: apps } = await query as { data: OARow[] | null };

    const userIds = (apps ?? []).map((a) => a.user_id);
    const profileMap: Record<string, { email: string | null; display_name: string | null }> = {};
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);
      for (const p of profiles ?? []) profileMap[p.id] = { email: p.email, display_name: p.display_name };
    }

    return {
      applications: (apps ?? []).map((a) => ({
        ...a,
        profile: profileMap[a.user_id] ?? { email: null, display_name: null },
      })),
    };
  });

// ─── Admin: get single application in full ────────────────────────────────────

export const getOnboardingApplicationDetail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { user_id: string }) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const userId = (context as any).userId as string;
    await requirePlatformAdmin(userId);

    const { data: app } = await odb()
      .from("onboarding_applications")
      .select("*")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      .eq("user_id", (data as any).user_id)
      .single() as { data: OARow | null };

    if (!app) throw new Error("Application not found.");

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("id, email, display_name, phone, created_at")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      .eq("id", (data as any).user_id)
      .maybeSingle();

    return { application: app, profile };
  });

// ─── Admin: review (approve / reject / request changes) ───────────────────────

const ReviewInput = z.object({
  user_id:        z.string().uuid(),
  action:         z.enum(["approve", "reject", "request_changes"]),
  notes:          z.record(z.string()).optional(),
  rejection_note: z.string().max(2000).optional(),
});

export const reviewOnboardingApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requirePlatformAdmin(userId);

    const { data: app } = await odb()
      .from("onboarding_applications")
      .select("role, status, user_id")
      .eq("user_id", data.user_id)
      .maybeSingle() as { data: OARow | null };

    if (!app) throw new Error("Application not found.");
    if (!["submitted","under_review","changes_requested"].includes(app.status)) {
      throw new Error(`Cannot review application with status "${app.status}".`);
    }

    const now = new Date().toISOString();
    const newStatus =
      data.action === "approve"        ? "approved" :
      data.action === "reject"         ? "rejected" :
      "changes_requested";

    await odb()
      .from("onboarding_applications")
      .update({
        status:         newStatus,
        reviewer_id:    userId,
        reviewer_notes: data.notes ?? {},
        reviewed_at:    now,
      })
      .eq("user_id", data.user_id);

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", data.user_id)
      .maybeSingle();

    if (data.action === "approve") {
      await supabaseAdmin
        .from("profiles")
        .update({ is_active: true } as never)
        .eq("id", data.user_id);

      if (profile?.email) {
        try {
          await sendTransactionalEmailServer({
            templateName: "account-approved",
            recipientEmail: profile.email,
            idempotencyKey: `onboarding-approved-${data.user_id}`,
            templateData: { name: profile.display_name ?? undefined, dashboardUrl: `${SITE_URL}/dashboard`, siteUrl: SITE_URL },
          });
          await flushEmailQueueInDev();
        } catch (e) { console.error(e); }
      }
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id, type: "account_approved",
        title: "Application approved", body: "Your IGE application has been approved.", data: {},
      } as never);
    }

    if (data.action === "reject") {
      if (profile?.email) {
        try {
          await sendTransactionalEmailServer({
            templateName: "account-declined",
            recipientEmail: profile.email,
            idempotencyKey: `onboarding-rejected-${data.user_id}`,
            templateData: { name: profile.display_name ?? undefined, reason: data.rejection_note, siteUrl: SITE_URL },
          });
          await flushEmailQueueInDev();
        } catch (e) { console.error(e); }
      }
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id, type: "account_declined",
        title: "Application outcome",
        body: data.rejection_note ?? "Your IGE application was not approved at this time.",
        data: {},
      } as never);
    }

    if (data.action === "request_changes") {
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id, type: "onboarding_changes_requested",
        title: "Revisions requested for your application",
        body: "An IGE reviewer has requested changes. Sign in to review and resubmit.",
        data: { reviewer_notes: data.notes ?? {} },
      } as never);
    }

    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId:      userId,
      actorEmail:   actor?.email,
      action:       data.action === "approve" ? "user_approved" : data.action === "reject" ? "user_declined" : "user_unapproved",
      summary:      `${data.action} onboarding application for ${profile?.email ?? data.user_id}`,
      resourceType: "onboarding_application",
      resourceId:   data.user_id,
    });

    return { ok: true, newStatus };
  });

// ─── Admin: mark under_review ─────────────────────────────────────────────────

export const markApplicationUnderReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ user_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requirePlatformAdmin(userId);
    await odb()
      .from("onboarding_applications")
      .update({ status: "under_review" })
      .eq("user_id", data.user_id)
      .eq("status", "submitted");
    return { ok: true };
  });
