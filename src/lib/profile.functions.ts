import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
    return { ok: true };
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
    return { ok: true };
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
    return { ok: true };
  });

export const getMyProfileSummary = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }, { data: org }, { data: sp }, { data: ref }] =
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
      ]);
    return {
      profile,
      roles: (roles ?? []).map((r: any) => r.role),
      organiser: org,
      sponsor: sp,
      referral: ref,
    };
  });
