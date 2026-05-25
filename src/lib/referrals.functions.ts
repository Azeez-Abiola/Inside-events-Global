import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// In-memory rate limit (per worker). Best-effort link-farming guard.
const rateMap = new Map<string, number[]>();
function checkRate(userId: string, max: number, windowMs: number) {
  const now = Date.now();
  const arr = (rateMap.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) return false;
  arr.push(now);
  rateMap.set(userId, arr);
  return true;
}

function shortCode(n = 8) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ───────────────────────────────────────────────────────────────
// Generate / fetch referral link for an event
// ───────────────────────────────────────────────────────────────
export const generateReferralLink = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string }) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Must be referral_partner
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "referral_partner")) {
      throw new Error("Only referral partners can generate links");
    }

    // Rate limit: 10 / hour
    if (!checkRate(userId, 10, 60 * 60 * 1000)) {
      throw new Error("Rate limit: too many links generated. Please wait and try again.");
    }

    // Existing?
    const { data: existing } = await supabaseAdmin
      .from("referral_links")
      .select("*")
      .eq("referral_partner_id", userId)
      .eq("event_id", data.event_id)
      .maybeSingle();
    if (existing) {
      return { link: existing, reused: true };
    }

    // Lookup event + commission rate
    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("id, name, event_type, status")
      .eq("id", data.event_id)
      .single();
    if (!ev || !["approved", "listed"].includes(ev.status)) {
      throw new Error("Event not available for referrals");
    }

    const { data: partnerProfile } = await supabaseAdmin
      .from("referral_partner_profiles")
      .select("commission_tier")
      .eq("user_id", userId)
      .maybeSingle();
    const tier = partnerProfile?.commission_tier ?? "standard";

    const { data: cfg } = await supabaseAdmin
      .from("commission_config")
      .select("standard_rate, premium_rate")
      .eq("event_type_category", ev.event_type ?? "Default")
      .maybeSingle();
    const { data: fallback } = await supabaseAdmin
      .from("commission_config")
      .select("standard_rate, premium_rate")
      .eq("event_type_category", "Default")
      .maybeSingle();
    const rates = cfg ?? fallback;
    const commission_rate = tier === "premium" ? Number(rates?.premium_rate ?? 0.1) : Number(rates?.standard_rate ?? 0.07);

    // Unique short code
    let code = shortCode();
    for (let i = 0; i < 5; i++) {
      const { data: clash } = await supabaseAdmin
        .from("referral_links")
        .select("id")
        .eq("short_code", code)
        .maybeSingle();
      if (!clash) break;
      code = shortCode();
    }

    const vouch_link_url = `/r/${code}`;
    const expires_at = new Date(Date.now() + 90 * 86400 * 1000).toISOString();

    const { data: link, error } = await supabaseAdmin
      .from("referral_links")
      .insert({
        referral_partner_id: userId,
        event_id: data.event_id,
        short_code: code,
        vouch_link_url,
        commission_rate,
        expires_at,
        status: "active",
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return { link, reused: false };
  });

// ───────────────────────────────────────────────────────────────
// Track click — used by /r/$code route
// ───────────────────────────────────────────────────────────────
export const trackReferralClick = createServerFn({ method: "POST" })
  .inputValidator((d: { short_code: string; ua?: string; referrer?: string }) =>
    z.object({ short_code: z.string().min(1).max(20), ua: z.string().max(500).optional(), referrer: z.string().max(500).optional() }).parse(d),
  )
  .handler(async ({ data }) => {
    const { data: link } = await supabaseAdmin
      .from("referral_links")
      .select("id, event_id, click_count")
      .eq("short_code", data.short_code)
      .maybeSingle();
    if (!link) return { ok: false, slug: null };

    await supabaseAdmin.from("referral_link_clicks").insert({
      referral_link_id: link.id,
      user_agent: data.ua,
      referrer: data.referrer,
    });
    await supabaseAdmin
      .from("referral_links")
      .update({ click_count: (link.click_count ?? 0) + 1, last_clicked_at: new Date().toISOString() })
      .eq("id", link.id);

    const { data: ev } = await supabaseAdmin.from("events").select("slug").eq("id", link.event_id).single();
    return { ok: true, slug: ev?.slug ?? null, short_code: data.short_code };
  });

// ───────────────────────────────────────────────────────────────
// Referral partner dashboard data
// ───────────────────────────────────────────────────────────────
export const getReferralDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [{ data: links }, { data: deals }, { data: profile }] = await Promise.all([
      supabaseAdmin
        .from("referral_links")
        .select("id, short_code, event_id, status, click_count, unique_click_count, conversion_count, commission_rate, expires_at, vouch_link_url, created_at")
        .eq("referral_partner_id", userId)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("deals")
        .select("id, event_id, status, deal_value_native, deal_currency, referral_commission_native, referral_commission_usd, referral_commission_paid, referral_commission_paid_at, created_at")
        .eq("referral_partner_id", userId),
      supabaseAdmin
        .from("referral_partner_profiles")
        .select("commission_tier, deals_closed, total_earned_usd, payout_currency, igb_partner_badge")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    const eventIds = Array.from(new Set([...(links ?? []).map((l) => l.event_id), ...(deals ?? []).map((d) => d.event_id)]));
    let events: Record<string, any> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, name, slug, banner_image_url, start_date, city, country")
        .in("id", eventIds);
      for (const e of evs ?? []) events[e.id] = e;
    }

    const totals = (deals ?? []).reduce(
      (acc, d) => {
        const v = Number(d.referral_commission_usd ?? 0);
        if (d.referral_commission_paid) acc.paid += v;
        else if (d.status === "payment_received") acc.earned += v;
        else acc.pending += v;
        return acc;
      },
      { earned: 0, pending: 0, paid: 0 },
    );

    return {
      profile,
      links: links ?? [],
      deals: deals ?? [],
      events,
      totals,
      stats: {
        linkCount: links?.length ?? 0,
        clickCount: (links ?? []).reduce((s, l) => s + (l.click_count ?? 0), 0),
        conversionCount: (links ?? []).reduce((s, l) => s + (l.conversion_count ?? 0), 0),
      },
    };
  });
