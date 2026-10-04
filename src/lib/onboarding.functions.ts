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
import {
  DEFERRABLE_SECTIONS,
  deriveOnboardingProgress,
  getSectionsForRole,
  ROLE_DISPLAY,
  type OnboardingRole,
  type SectionProgress,
} from "@/lib/onboarding-constants";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

// Helper: cast supabaseAdmin to `any` so unregistered tables don't produce type errors.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function odb(): any {
  return supabaseAdmin as any;
}

// ─── Row type for onboarding_applications ─────────────────────────────────────

interface OARow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  sections: Record<string, Record<string, string | string[] | number | boolean | null>>;
  section_status: Record<string, string>;
  current_section: number;
  reviewer_notes: Record<string, string>;
  reviewed_at: string | null;
  submitted_at: string | null;
  created_at: string;
}

// ─── Save a single section (save & resume) ────────────────────────────────────

const SaveSectionInput = z.object({
  role: z.enum([
    "organiser",
    "sponsor",
    "referral_partner",
    "media_partner",
    "partnerships_pro",
    "creative_hub",
    "ige_admin",
  ]),
  sectionKey: z.string().min(1).max(8),
  sectionData: z.record(z.unknown()),
  currentSection: z.number().int().min(0),
  /** "skipped" is only valid for a deferrable section (TAB 3 §3.2A). */
  sectionProgress: z.enum(["complete", "skipped"]).optional().default("complete"),
});

export const saveOnboardingSection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SaveSectionInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const { data: existing } = (await odb()
      .from("onboarding_applications")
      .select("id, sections, section_status, status")
      .eq("user_id", userId)
      .maybeSingle()) as { data: OARow | null };

    const currentSections = existing?.sections ?? {};
    const newSections = { ...currentSections, [data.sectionKey]: data.sectionData };
    // Progress is tracked separately from the answers: a skipped section has no
    // answers but is still a section the completion bar has to mention.
    const currentStatus = (existing?.section_status ?? {}) as Record<string, string>;
    const newStatus = { ...currentStatus, [data.sectionKey]: data.sectionProgress };

    if (!existing) {
      const { error } = (await odb().from("onboarding_applications").insert({
        user_id: userId,
        role: data.role,
        sections: newSections,
        section_status: newStatus,
        current_section: data.currentSection,
        status: "draft",
      })) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    } else {
      // 'approved' is now the terminal state of a *finished* onboarding, not a
      // locked one: Verification & trust is deferrable and §3.2A says it "can
      // be completed at any time from the dashboard". Blocking it here would
      // mean skipping a section made it permanently unfinishable.
      if (["submitted", "under_review"].includes(existing.status)) {
        throw new Error("Application is under review — cannot modify right now.");
      }
      const { error } = (await odb()
        .from("onboarding_applications")
        .update({
          sections: newSections,
          section_status: newStatus,
          current_section: data.currentSection,
          role: data.role,
        })
        .eq("user_id", userId)) as { error: { message: string } | null };
      if (error) throw new Error(error.message);
    }

    // Account-level state, recomputed on every save. This is what unlocks the
    // dashboard (TAB 3 §3.2A, §3.3) — the gate reads it rather than waiting
    // for an admin, so it has to be written here and not only on submit.
    await syncOnboardingStatus(userId, data.role as OnboardingRole, newStatus);

    return { ok: true };
  });

/**
 * Mirrors section_status up to profiles.onboarding_status.
 *
 * Resolved against the live section config, not the code default, so moving a
 * section between compulsory and deferrable changes who gets into the
 * dashboard without a release — which is the whole point of §3.2A.
 *
 * Deliberately non-fatal: a failure here must not lose the section the person
 * just filled in. The gate re-derives from section_status when the column
 * disagrees, so the worst case is one stale read.
 */
async function syncOnboardingStatus(
  userId: string,
  role: OnboardingRole,
  sectionStatus: Record<string, string>,
) {
  try {
    const sections = getSectionsForRole(role);
    const fallback = DEFERRABLE_SECTIONS[role] ?? [];
    const { data: config } = await odb()
      .from("onboarding_section_config")
      .select("section_key, compulsory")
      .eq("role", role);

    const byKey = new Map(
      ((config ?? []) as { section_key: string; compulsory: boolean }[]).map((r) => [
        r.section_key,
        r.compulsory,
      ]),
    );

    const resolved = sections.map((s) => ({
      key: s.key,
      compulsory: byKey.get(s.key) ?? !fallback.includes(s.key),
    }));

    const progress = deriveOnboardingProgress(
      resolved,
      sectionStatus as Record<string, SectionProgress>,
    );

    await odb().from("profiles").update({ onboarding_status: progress }).eq("id", userId);
  } catch {
    /* see docblock — never fail a save over the derived column */
  }
}

// ─── Submit application ────────────────────────────────────────────────────────

const SubmitInput = z.object({
  dataConsentAccepted: z.boolean(),
  termsConsentAccepted: z.boolean(),
  clientIp: z.string().optional(),
});

export const submitOnboardingApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SubmitInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    if (!data.dataConsentAccepted) throw new Error("Data processing consent is required.");
    if (!data.termsConsentAccepted) throw new Error("Terms & Privacy consent is required.");

    const now = new Date().toISOString();

    const { data: app } = (await odb()
      .from("onboarding_applications")
      .select("id, sections, status, role")
      .eq("user_id", userId)
      .maybeSingle()) as { data: OARow | null };

    if (!app) throw new Error("No application found — please complete the wizard first.");
    if (["submitted", "under_review", "approved"].includes(app.status)) {
      throw new Error("Application already submitted.");
    }

    // v6.2 §3.2A removed Admin approval from accounts: "No Admin approval to
    // sign up, sign in or use the dashboard. Admin vets an event only when it
    // is published to the marketplace." The application is therefore complete
    // the moment the person finishes it, not when someone reviews it.
    //
    // 'approved' is reused rather than adding an enum value, because every
    // existing reader — the admin console, the vetting panel, the resume
    // logic — already treats it as the terminal state.
    const { error: updateErr } = (await odb()
      .from("onboarding_applications")
      .update({
        status: "approved",
        submitted_at: now,
        reviewed_at: now,
        data_consent_at: now,
        data_consent_ip: data.clientIp ?? "unknown",
        terms_consent_at: now,
        terms_consent_ip: data.clientIp ?? "unknown",
      })
      .eq("user_id", userId)) as { error: { message: string } | null };
    if (updateErr) throw new Error(updateErr.message);

    // Deliberately NOT setting is_active = false. That is what used to happen
    // here, and it meant finishing onboarding deactivated your own account
    // and parked you on the pending screen indefinitely.

    // Fetch profile for emails
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.email) {
      try {
        await sendTransactionalEmailServer({
          templateName: "welcome",
          recipientEmail: profile.email,
          idempotencyKey: `onboarding-complete-${userId}`,
          templateData: {
            name: profile.display_name ?? undefined,
            role: app.role,
            roleLabel: ROLE_DISPLAY[app.role as OnboardingRole]?.label ?? "workspace",
            siteUrl: SITE_URL,
            dashboardUrl: `${SITE_URL}/dashboard`,
            messagesUrl: `${SITE_URL}/messages`,
            marketplaceUrl: `${SITE_URL}/marketplace`,
          },
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
      // Informational now, not a queue item: nothing is waiting on Admin.
      await supabaseAdmin.from("notifications").insert({
        user_id: a.user_id,
        type: "user_onboarding_complete",
        title: "Onboarding completed",
        body: `${profile?.display_name ?? profile?.email ?? "A user"} finished their ${app.role} onboarding.`,
        data: { user_id: userId, role: app.role },
      } as never);
    }

    return { ok: true };
  });

// ─── Get my application (for resume + pending screen) ─────────────────────────

export interface OutstandingSection {
  key: string;
  title: string;
  compulsory: boolean;
}

/**
 * What the dashboard gate needs, in one round trip (TAB 3 §3.2A, §3.3).
 *
 * Derives the verdict from section_status rather than trusting
 * profiles.onboarding_status alone, so a row written before the column
 * existed — or one whose sync failed — still resolves correctly instead of
 * stranding someone outside their own dashboard.
 */
export const getOnboardingGateState = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    const userId = (context as any).userId as string;

    const { data: app } = await odb()
      .from("onboarding_applications")
      .select("role, section_status, status")
      .eq("user_id", userId)
      .maybeSingle();

    // No application at all: a legacy account, or someone who has not picked
    // a role yet. Neither is ours to block here.
    if (!app?.role) {
      return { hasApplication: false, progress: null, outstanding: [] as string[] };
    }

    const role = app.role as OnboardingRole;
    const sectionStatus = (app.section_status ?? {}) as Record<string, SectionProgress>;
    const sections = getSectionsForRole(role);
    const fallback = DEFERRABLE_SECTIONS[role] ?? [];

    const { data: config } = await odb()
      .from("onboarding_section_config")
      .select("section_key, compulsory")
      .eq("role", role);
    const byKey = new Map(
      ((config ?? []) as { section_key: string; compulsory: boolean }[]).map((r) => [
        r.section_key,
        r.compulsory,
      ]),
    );

    const resolved = sections.map((s) => ({
      key: s.key,
      title: s.title,
      compulsory: byKey.get(s.key) ?? !fallback.includes(s.key),
    }));

    return {
      hasApplication: true,
      progress: deriveOnboardingProgress(resolved, sectionStatus),
      // The completion bar links straight to each outstanding section, so it
      // needs the key as well as the title.
      outstanding: resolved
        .filter((s) => sectionStatus[s.key] !== "complete")
        .map((s) => ({ key: s.key, title: s.title, compulsory: s.compulsory })),
      verificationStatus: (app.verification_status as string | null) ?? "not_submitted",
      // Verification is section G for most roles and H for organisers, so the
      // locks resolve it rather than hardcoding a letter (§3.2A).
      verificationSectionKey:
        sections.find((x) => x.title.toLowerCase().startsWith("verification"))?.key ?? null,
    };
  });

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

// ─── Section configuration (TAB 3 §3.2A) ──────────────────────────────────────

/**
 * Which sections are compulsory for a role. The table wins so ABW can change
 * the split without a release; DEFERRABLE_SECTIONS covers any section the table
 * has no row for, and a failed read falls back to it entirely rather than
 * leaving the wizard unable to tell compulsory from deferrable.
 */
export const getOnboardingSectionConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { role: string }) =>
    z
      .object({
        role: z.enum([
          "organiser",
          "sponsor",
          "referral_partner",
          "media_partner",
          "partnerships_pro",
          "creative_hub",
        ]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const fallback = DEFERRABLE_SECTIONS[data.role as OnboardingRole] ?? [];
    const sections = getSectionsForRole(data.role as OnboardingRole);

    const { data: rows, error } = (await odb()
      .from("onboarding_section_config")
      .select("section_key, compulsory")
      .eq("role", data.role)) as {
      data: { section_key: string; compulsory: boolean }[] | null;
      error: { message: string } | null;
    };

    const configured = new Map((rows ?? []).map((r) => [r.section_key, r.compulsory]));
    return {
      sections: sections.map((s) => ({
        key: s.key,
        title: s.title,
        subtitle: s.subtitle,
        compulsory: error
          ? !fallback.includes(s.key)
          : (configured.get(s.key) ?? !fallback.includes(s.key)),
      })),
      /** True when the table could not be read and the code map was used. */
      usedFallback: Boolean(error),
    };
  });

// ─── Admin: list all applications ─────────────────────────────────────────────

export const listOnboardingApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { status?: string; role?: string; limit?: number; offset?: number }) =>
    z
      .object({
        status: z
          .enum(["all", "submitted", "under_review", "approved", "rejected", "changes_requested"])
          .optional()
          .default("all"),
        role: z.string().optional(),
        limit: z.number().int().min(1).max(200).optional().default(100),
        offset: z.number().int().min(0).optional().default(0),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
    const userId = (context as any).userId as string;
    await requirePlatformAdmin(userId);

    let query = odb()
      .from("onboarding_applications")
      .select(
        "id, user_id, role, status, submitted_at, reviewed_at, current_section, reviewer_notes, sections, created_at",
      )
      .order("submitted_at", { ascending: false })
      .range(data.offset, data.offset + data.limit - 1);

    if (data.status !== "all") query = query.eq("status", data.status);
    if (data.role) query = query.eq("role", data.role);

    const { data: apps } = (await query) as { data: OARow[] | null };

    const userIds = (apps ?? []).map((a) => a.user_id);
    const profileMap: Record<string, { email: string | null; display_name: string | null }> = {};
    if (userIds.length) {
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id, email, display_name")
        .in("id", userIds);
      for (const p of profiles ?? [])
        profileMap[p.id] = { email: p.email, display_name: p.display_name };
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

    const { data: app } = (await odb()
      .from("onboarding_applications")
      .select("*")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      .eq("user_id", (data as any).user_id)
      .single()) as { data: OARow | null };

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
  user_id: z.string().uuid(),
  action: z.enum(["approve", "reject", "request_changes"]),
  notes: z.record(z.string()).optional(),
  rejection_note: z.string().max(2000).optional(),
});

export const reviewOnboardingApplication = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ReviewInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requirePlatformAdmin(userId);

    const { data: app } = (await odb()
      .from("onboarding_applications")
      .select("role, status, user_id")
      .eq("user_id", data.user_id)
      .maybeSingle()) as { data: OARow | null };

    if (!app) throw new Error("Application not found.");
    if (!["submitted", "under_review", "changes_requested"].includes(app.status)) {
      throw new Error(`Cannot review application with status "${app.status}".`);
    }

    const now = new Date().toISOString();
    const newStatus =
      data.action === "approve"
        ? "approved"
        : data.action === "reject"
          ? "rejected"
          : "changes_requested";

    await odb()
      .from("onboarding_applications")
      .update({
        status: newStatus,
        reviewer_id: userId,
        reviewer_notes: data.notes ?? {},
        reviewed_at: now,
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
            templateData: {
              name: profile.display_name ?? undefined,
              dashboardUrl: `${SITE_URL}/dashboard`,
              siteUrl: SITE_URL,
            },
          });
          await flushEmailQueueInDev();
        } catch (e) {
          console.error(e);
        }
      }
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        type: "account_approved",
        title: "Application approved",
        body: "Your IGE application has been approved.",
        data: {},
      } as never);
    }

    if (data.action === "reject") {
      if (profile?.email) {
        try {
          await sendTransactionalEmailServer({
            templateName: "account-declined",
            recipientEmail: profile.email,
            idempotencyKey: `onboarding-rejected-${data.user_id}`,
            templateData: {
              name: profile.display_name ?? undefined,
              reason: data.rejection_note,
              siteUrl: SITE_URL,
            },
          });
          await flushEmailQueueInDev();
        } catch (e) {
          console.error(e);
        }
      }
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        type: "account_declined",
        title: "Application outcome",
        body: data.rejection_note ?? "Your IGE application was not approved at this time.",
        data: {},
      } as never);
    }

    if (data.action === "request_changes") {
      await supabaseAdmin.from("notifications").insert({
        user_id: data.user_id,
        type: "onboarding_changes_requested",
        title: "Revisions requested for your application",
        body: "An IGE reviewer has requested changes. Sign in to review and resubmit.",
        data: { reviewer_notes: data.notes ?? {} },
      } as never);
    }

    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId: userId,
      actorEmail: actor?.email,
      action:
        data.action === "approve"
          ? "user_approved"
          : data.action === "reject"
            ? "user_declined"
            : "user_unapproved",
      summary: `${data.action} onboarding application for ${profile?.email ?? data.user_id}`,
      resourceType: "onboarding_application",
      resourceId: data.user_id,
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
