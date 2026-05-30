import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ───────────────────────────────────────────────────────────────
// Public marketplace listing - supabaseAdmin scoped to live events
// ───────────────────────────────────────────────────────────────
const FilterInput = z.object({
  q: z.string().max(120).optional(),
  event_types: z.array(z.string()).max(40).optional(),
  sectors: z.array(z.string()).max(40).optional(),
  countries: z.array(z.string()).max(60).optional(),
  city: z.string().max(80).optional(),
  format: z.enum(["all", "in_person", "virtual", "hybrid"]).default("all"),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  audience_min: z.number().int().min(0).optional(),
  audience_max: z.number().int().min(0).optional(),
  vetted_only: z.boolean().default(true),
  decision_makers: z.boolean().default(false),
  sort: z.enum(["newest", "soonest", "audience"]).default("newest"),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(48).default(12),
});

export const listMarketplaceEvents = createServerFn({ method: "POST" })
  .inputValidator((d) => FilterInput.parse(d))
  .handler(async ({ data }) => {
    let q = supabaseAdmin
      .from("events")
      .select(
        "id, slug, name, event_type, format, start_date, end_date, city, country, primary_sector, attendance_size, decision_makers_pct, banner_image_url, ige_vetted, currency, created_at",
        { count: "exact" },
      )
      .in("status", ["approved", "listed"]);

    if (data.vetted_only) q = q.eq("ige_vetted", true);
    if (data.decision_makers) q = q.gte("decision_makers_pct", 30);
    if (data.event_types?.length) q = q.in("event_type", data.event_types);
    if (data.sectors?.length) q = q.in("primary_sector", data.sectors);
    if (data.countries?.length) q = q.in("country", data.countries);
    if (data.city) q = q.ilike("city", `%${data.city}%`);
    if (data.format !== "all") q = q.eq("format", data.format);
    if (data.date_from) q = q.gte("start_date", data.date_from);
    if (data.date_to) q = q.lte("start_date", data.date_to);
    if (data.audience_min !== undefined) q = q.gte("attendance_size", data.audience_min);
    if (data.audience_max !== undefined) q = q.lte("attendance_size", data.audience_max);
    if (data.q) {
      const term = data.q.replace(/[%_]/g, " ");
      q = q.or(
        `name.ilike.%${term}%,event_theme.ilike.%${term}%,city.ilike.%${term}%,primary_sector.ilike.%${term}%`,
      );
    }

    if (data.sort === "newest") q = q.order("created_at", { ascending: false });
    else if (data.sort === "soonest") q = q.order("start_date", { ascending: true, nullsFirst: false });
    else q = q.order("attendance_size", { ascending: false, nullsFirst: false });

    const from = (data.page - 1) * data.per_page;
    q = q.range(from, from + data.per_page - 1);

    const { data: events, error, count } = await q;
    if (error) throw new Error(error.message);

    // cheapest tier per event for "From X" pricing
    const ids = (events ?? []).map((e) => e.id);
    let priceMap: Record<string, { price: number; currency: string } | null> = {};
    if (ids.length) {
      const { data: tiers } = await supabaseAdmin
        .from("event_sponsorship_tiers")
        .select("event_id, price, currency")
        .in("event_id", ids)
        .order("price", { ascending: true });
      for (const t of tiers ?? []) {
        if (!priceMap[t.event_id]) priceMap[t.event_id] = { price: Number(t.price), currency: t.currency };
      }
    }

    return {
      events: (events ?? []).map((e) => ({ ...e, starting: priceMap[e.id] ?? null })),
      total: count ?? 0,
      page: data.page,
      per_page: data.per_page,
    };
  });

// ───────────────────────────────────────────────────────────────
// Single event by slug (public). Increments view_count.
// ───────────────────────────────────────────────────────────────
export const getPublicEventBySlug = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    const { data: ev, error } = await supabaseAdmin
      .from("events")
      .select("*")
      .eq("slug", data.slug)
      .in("status", ["approved", "listed"])
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!ev) return { event: null, tiers: [], organiser: null };

    const [{ data: tiers }, { data: organiser }] = await Promise.all([
      supabaseAdmin
        .from("event_sponsorship_tiers")
        .select("*")
        .eq("event_id", ev.id)
        .order("display_order"),
      supabaseAdmin
        .from("organiser_profiles")
        .select("org_name, logo_url, bio, website, track_record, event_history, past_sponsor_logos")
        .eq("user_id", ev.organiser_id)
        .maybeSingle(),
    ]);

    // Fire and forget increment
    void supabaseAdmin.rpc as any;
    void supabaseAdmin
      .from("events")
      .update({ view_count: (ev.view_count ?? 0) + 1 })
      .eq("id", ev.id);

    return { event: ev, tiers: tiers ?? [], organiser };
  });

// ───────────────────────────────────────────────────────────────
// Current exchange rates (public)
// ───────────────────────────────────────────────────────────────
export const getCurrentRates = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("exchange_rates")
    .select("ngn_rate, gbp_rate, eur_rate, fetched_at")
    .order("fetched_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return { rates: data };
});

// ───────────────────────────────────────────────────────────────
// Commitment form submission
// ───────────────────────────────────────────────────────────────
const CommitInput = z.object({
  event_id: z.string().uuid(),
  readiness_confirmed: z.literal(true),
  contact_name: z.string().min(2).max(120),
  contact_title: z.string().max(120).optional().nullable(),
  company_name: z.string().min(1).max(160),
  company_linkedin_url: z.string().url().max(300),
  brand_region: z.string().max(80).optional().nullable(),
  currency: z.enum(["NGN", "USD", "GBP", "EUR"]),
  partnership_type: z.enum(["cash", "in_kind", "co_creation", "jv"]).optional().nullable(),
  budget_range_min: z.number().nonnegative().optional().nullable(),
  budget_range_max: z.number().nonnegative().optional().nullable(),
  expected_roi: z.string().max(1500).optional().nullable(),
  proposed_start_date: z.string().optional().nullable(),
  tier_id: z.string().uuid().optional().nullable(),
  custom_requirements: z.string().max(2000).optional().nullable(),
  referral_short_code: z.string().max(20).optional().nullable(),
});

function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

export const submitCommitmentForm = createServerFn({ method: "POST" })
  .inputValidator((d) => CommitInput.parse(d))
  .handler(async ({ data }) => {
    // Fetch event
    const { data: ev, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id, name, organiser_id, status, inquiry_count")
      .eq("id", data.event_id)
      .single();
    if (evErr) throw new Error(evErr.message);
    if (!["approved", "listed"].includes(ev.status)) throw new Error("Event not accepting inquiries");

    // Lock rates
    const { data: rate } = await supabaseAdmin
      .from("exchange_rates")
      .select("ngn_rate, gbp_rate, eur_rate")
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Resolve referral attribution
    let referral_link_id: string | null = null;
    let referral_partner_id: string | null = null;
    const fraudFlags: string[] = [];
    if (data.referral_short_code) {
      const { data: link } = await supabaseAdmin
        .from("referral_links")
        .select("id, referral_partner_id, status, expires_at, event_id")
        .eq("short_code", data.referral_short_code)
        .maybeSingle();
      if (link && link.event_id === data.event_id && link.status === "active") {
        referral_link_id = link.id;
        referral_partner_id = link.referral_partner_id;

        // Fraud check - self-referral
        const { data: partnerProfile } = await supabaseAdmin
          .from("profiles")
          .select("email_domain, linkedin_employer")
          .eq("id", link.referral_partner_id)
          .maybeSingle();
        const linkedinDomain = domainOf(data.company_linkedin_url);
        const employerMatch =
          partnerProfile?.linkedin_employer &&
          data.company_name.toLowerCase().includes(partnerProfile.linkedin_employer.toLowerCase());
        const domainMatch =
          partnerProfile?.email_domain &&
          linkedinDomain &&
          linkedinDomain.includes(partnerProfile.email_domain);
        if (employerMatch || domainMatch) {
          fraudFlags.push("self_referral");
        }
      }
    }

    // Get sponsor user_id from auth header if present (best-effort, non-blocking)
    let sponsor_user_id: string | null = null;
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const auth = getRequestHeader("Authorization");
      if (auth?.startsWith("Bearer ")) {
        const { data: u } = await supabaseAdmin.auth.getUser(auth.slice(7));
        sponsor_user_id = u.user?.id ?? null;
      }
    } catch {}

    // Insert commitment form
    const { data: cf, error } = await supabaseAdmin
      .from("commitment_forms")
      .insert({
        event_id: data.event_id,
        sponsor_user_id,
        readiness_confirmed: true,
        contact_name: data.contact_name,
        contact_title: data.contact_title,
        company_name: data.company_name,
        company_linkedin_url: data.company_linkedin_url,
        brand_region: data.brand_region,
        currency: data.currency,
        partnership_type: data.partnership_type,
        budget_range_min: data.budget_range_min,
        budget_range_max: data.budget_range_max,
        expected_roi: data.expected_roi,
        proposed_start_date: data.proposed_start_date,
        tier_id: data.tier_id,
        custom_requirements: data.custom_requirements,
        referral_partner_id,
        referral_link_id,
        ngn_usd_rate_locked: rate?.ngn_rate ?? null,
        gbp_usd_rate_locked: rate?.gbp_rate ?? null,
        eur_usd_rate_locked: rate?.eur_rate ?? null,
        rate_locked_at: new Date().toISOString(),
        fraud_flags: fraudFlags,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    // Side effects (best effort)
    await supabaseAdmin
      .from("events")
      .update({ inquiry_count: (ev.inquiry_count ?? 0) + 1 })
      .eq("id", ev.id);

    await supabaseAdmin.from("notifications").insert({
      user_id: ev.organiser_id,
      type: "new_inquiry",
      title: `New sponsor interest in ${ev.name}`,
      body: `${data.company_name} just submitted a commitment form.`,
      data: { event_id: ev.id, commitment_form_id: cf.id },
    });

    if (referral_partner_id) {
      await supabaseAdmin.from("notifications").insert({
        user_id: referral_partner_id,
        type: "referral_conversion",
        title: `Conversion on your referral link`,
        body: `A sponsor submitted a commitment form for ${ev.name}.`,
        data: { event_id: ev.id, commitment_form_id: cf.id },
      });
      await supabaseAdmin.rpc as any; // noop typing
      await supabaseAdmin
        .from("referral_links")
        .update({ conversion_count: 1 })
        .eq("id", referral_link_id!);
    }

    if (fraudFlags.length) {
      await supabaseAdmin.from("fraud_flags").insert({
        flagged_user_id: referral_partner_id,
        flag_type: "self_referral",
        description: `Self-referral suspected for ${data.company_name} on ${ev.name}`,
        related_deal_id: null,
        related_referral_link_id: referral_link_id,
      });
    }

    return { ok: true, id: cf.id };
  });

// ───────────────────────────────────────────────────────────────
// Save / unsave event (sponsor)
// ───────────────────────────────────────────────────────────────
export const toggleSaveEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event_id: string }) => z.object({ event_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("event_saves")
      .select("id")
      .eq("user_id", userId)
      .eq("event_id", data.event_id)
      .maybeSingle();
    if (existing) {
      await supabase.from("event_saves").delete().eq("id", existing.id);
      return { saved: false };
    }
    await supabase.from("event_saves").insert({ user_id: userId, event_id: data.event_id });
    return { saved: true };
  });
