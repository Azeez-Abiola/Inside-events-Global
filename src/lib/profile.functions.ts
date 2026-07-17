import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendWelcomeEmailForUser } from "@/lib/email/welcome";
import { computeProfileComplete, completenessHint } from "@/lib/profile-completeness";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

async function syncDisplayName(userId: string, displayName: string) {
  const trimmed = displayName.trim();
  if (!trimmed) return;
  await supabaseAdmin.from("profiles").update({ display_name: trimmed } as never).eq("id", userId);
}

const OrganiserInput = z.object({
  org_name: z.string().trim().min(1).max(160),
  bio: z.string().trim().max(1000).optional().nullable(),
  website: z.string().trim().url().max(300).optional().nullable().or(z.literal("").transform(() => null)),
  logo_url: z.string().trim().max(500).optional().nullable(),
  event_history: z.string().trim().max(1000).optional().nullable(),
});

export const upsertOrganiserProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => OrganiserInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("organiser_profiles")
      .upsert({ user_id: userId, ...data } as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    await syncDisplayName(userId, data.org_name);
    const profile_complete = await syncProfileCompleteness(userId).catch(() => null);
    return { ok: true, profile_complete };
  });

const SponsorInput = z.object({
  brand_name: z.string().trim().min(1).max(160),
  industry: z.string().trim().max(120).optional().nullable(),
  company_size: z.string().trim().max(40).optional().nullable(),
  hq_country: z.string().trim().max(80).optional().nullable(),
  hq_city: z.string().trim().max(80).optional().nullable(),
  target_geographies: z.array(z.string()).max(20).default([]),
  sponsorship_sectors: z.array(z.string()).max(20).default([]),
  audience_types: z.array(z.string()).max(20).default([]),
  budget_range_min: z.number().nonnegative().optional().nullable(),
  budget_range_max: z.number().nonnegative().optional().nullable(),
  preferred_currency: z.string().min(3).max(3).default("USD"),
});

export const upsertSponsorProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => SponsorInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("sponsor_profiles")
      .upsert({ user_id: userId, ...data } as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    await syncDisplayName(userId, data.brand_name);
    const profile_complete = await syncProfileCompleteness(userId).catch(() => null);
    return { ok: true, profile_complete };
  });

const ReferralInput = z.object({
  full_name: z.string().trim().min(1).max(160),
  professional_title: z.string().trim().max(160).optional().nullable(),
  sector_expertise: z.array(z.string()).max(20).default([]),
  professional_bg: z.string().trim().max(1500).optional().nullable(),
  sponsor_network_desc: z.string().trim().max(1500).optional().nullable(),
  payout_currency: z.enum(["NGN", "USD", "GBP", "EUR"]).default("NGN"),
  linkedin_url: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
});

export const upsertReferralProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ReferralInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { linkedin_url, ...rest } = data;
    const [{ error: pErr }, { error: rErr }] = await Promise.all([
      supabase
        .from("referral_partner_profiles")
        .upsert({ user_id: userId, ...rest } as never, { onConflict: "user_id" }),
      linkedin_url
        ? supabase.from("profiles").update({ linkedin_url } as never).eq("id", userId)
        : Promise.resolve({ error: null } as any),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);
    await syncDisplayName(userId, data.full_name);
    const profile_complete = await syncProfileCompleteness(userId).catch(() => null);
    return { ok: true, profile_complete };
  });

export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ role: z.string().optional() }).optional().parse(d))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const { data: authUser } = await supabase.auth.getUser();
    const role =
      data?.role ||
      roles?.[0]?.role ||
      (authUser.user?.user_metadata?.role as string | undefined);
    if (!role) return { ok: false };
    await sendWelcomeEmailForUser(userId, role);
    return { ok: true };
  });

const BaseProfileInput = z.object({
  display_name: z.string().trim().max(120).optional().nullable(),
  phone: z.string().trim().max(40).optional().nullable(),
  linkedin_url: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  avatar_url: z.string().trim().max(500).optional().nullable(),
});

export const updateBaseProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => BaseProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("profiles").update(data as never).eq("id", userId);
    if (error) throw new Error(error.message);
    const profile_complete = await syncProfileCompleteness(userId).catch(() => null);
    return { ok: true, profile_complete };
  });

const MediaInput = z.object({
  outlet_name: z.string().trim().min(1).max(160),
  outlet_type: z.string().trim().max(80).optional().nullable(),
  beat_sectors: z.array(z.string()).max(20).default([]),
  portfolio_url: z
    .string()
    .trim()
    .url()
    .max(300)
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  bio: z.string().trim().max(1500).optional().nullable(),
});

async function syncProfileCompleteness(userId: string) {
  const [{ data: profile }, { data: roles }, { data: org }, { data: sp }, { data: ref }, { data: media }] =
    await Promise.all([
      supabaseAdmin.from("profiles").select("*").eq("id", userId).single(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", userId),
      supabaseAdmin.from("organiser_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("sponsor_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("referral_partner_profiles").select("*").eq("user_id", userId).maybeSingle(),
      supabaseAdmin.from("media_partner_profiles" as never).select("*").eq("user_id", userId).maybeSingle(),
    ]);
  const role = roles?.[0]?.role ?? "sponsor";
  const roleData =
    role === "organiser" ? org : role === "sponsor" ? sp : role === "referral_partner" ? ref : role === "media_partner" ? media : null;
  const score = computeProfileComplete(role, profile ?? undefined, (roleData ?? undefined) as Record<string, unknown>);
  await supabaseAdmin.from("profiles").update({ profile_complete: score } as never).eq("id", userId);
  return score;
}

export const upsertMediaPartnerProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => MediaInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("media_partner_profiles" as never)
      .upsert({ user_id: userId, ...data } as never, { onConflict: "user_id" });
    if (error) throw new Error(error.message);
    const profile_complete = await syncProfileCompleteness(userId).catch(() => null);
    return { ok: true, profile_complete };
  });

export const getMyProfileSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: org }, { data: sp }, { data: ref }, { data: media }] =
      await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("user_roles").select("role").eq("user_id", userId),
        supabase.from("organiser_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("sponsor_profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase
          .from("referral_partner_profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase.from("media_partner_profiles" as never).select("*").eq("user_id", userId).maybeSingle(),
      ]);
    const role = (roles ?? [])[0]?.role ?? "sponsor";
    const roleData =
      role === "organiser" ? org : role === "sponsor" ? sp : role === "referral_partner" ? ref : role === "media_partner" ? media : null;
    const profileComplete = computeProfileComplete(role, profile ?? undefined, (roleData ?? undefined) as Record<string, unknown>);
    return {
      profile,
      roles: (roles ?? []).map((r: any) => r.role),
      organiser: org,
      sponsor: sp,
      referral: ref,
      media,
      profileComplete,
      completenessHint: completenessHint(role, profileComplete),
    };
  });
