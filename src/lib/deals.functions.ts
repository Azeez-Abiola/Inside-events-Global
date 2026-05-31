import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// ───────────────────────────────────────────────────────────────
// Admin: deals pipeline + revenue dashboard
// ───────────────────────────────────────────────────────────────
export const adminGetRevenue = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    const admin = roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin");
    if (!admin) throw new Error("Forbidden");

    const [{ data: deals }, { data: partners }, { data: configs }, { data: flags }] = await Promise.all([
      supabaseAdmin
        .from("deals")
        .select("id, event_id, organiser_id, sponsor_user_id, referral_partner_id, status, deal_value_native, deal_currency, deal_value_usd, abw_commission_usd, abw_commission_native, referral_commission_usd, referral_commission_native, referral_commission_paid, created_at, updated_at, paid_at")
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("referral_partner_profiles")
        .select("user_id, full_name, deals_closed, total_earned_usd, commission_tier, payout_currency"),
      supabaseAdmin
        .from("commission_config")
        .select("event_type_category, standard_rate, premium_rate, abw_platform_rate")
        .order("event_type_category"),
      supabaseAdmin.from("fraud_flags").select("id, status").eq("status", "open"),
    ]);

    const eventIds = Array.from(new Set((deals ?? []).map((d) => d.event_id)));
    let eventMap: Record<string, any> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, name, slug, city, country")
        .in("id", eventIds);
      for (const e of evs ?? []) eventMap[e.id] = e;
    }

    // Compute payout summary per partner
    const partnerOwed: Record<string, number> = {};
    const partnerPaid: Record<string, number> = {};
    for (const d of deals ?? []) {
      if (!d.referral_partner_id) continue;
      const v = Number(d.referral_commission_usd ?? 0);
      if (d.referral_commission_paid) partnerPaid[d.referral_partner_id] = (partnerPaid[d.referral_partner_id] ?? 0) + v;
      else if (d.status === "payment_received") partnerOwed[d.referral_partner_id] = (partnerOwed[d.referral_partner_id] ?? 0) + v;
    }

    const totals = (deals ?? []).reduce(
      (acc, d) => {
        if (d.status === "payment_received") {
          acc.gmv += Number(d.deal_value_usd ?? 0);
          acc.abw += Number(d.abw_commission_usd ?? 0);
          acc.refOwed += Number(d.referral_commission_usd ?? 0) - (d.referral_commission_paid ? Number(d.referral_commission_usd ?? 0) : 0);
        }
        if (!["payment_received", "closed_lost", "cancelled"].includes(d.status)) acc.open += 1;
        return acc;
      },
      { gmv: 0, abw: 0, refOwed: 0, open: 0 },
    );

    return {
      deals: deals ?? [],
      events: eventMap,
      partners: (partners ?? []).map((p) => ({
        ...p,
        owed_usd: partnerOwed[p.user_id] ?? 0,
        paid_usd_running: partnerPaid[p.user_id] ?? 0,
      })),
      commissionConfig: configs ?? [],
      fraudFlagsOpen: flags?.length ?? 0,
      totals,
    };
  });

// ───────────────────────────────────────────────────────────────
// Create a deal from a commitment form (admin)
// ───────────────────────────────────────────────────────────────
export const adminCreateDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { commitment_form_id: string }) => z.object({ commitment_form_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    const { data: cf } = await supabaseAdmin
      .from("commitment_forms")
      .select("*")
      .eq("id", data.commitment_form_id)
      .single();
    if (!cf) throw new Error("Form not found");

    const { data: ev } = await supabaseAdmin
      .from("events")
      .select("organiser_id")
      .eq("id", cf.event_id)
      .single();

    const { data: deal, error } = await supabaseAdmin
      .from("deals")
      .insert({
        commitment_form_id: cf.id,
        event_id: cf.event_id,
        organiser_id: ev!.organiser_id as string,
        sponsor_user_id: cf.sponsor_user_id,
        referral_partner_id: cf.referral_partner_id,
        deal_currency: cf.currency,
        status: "inquiry_received",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("deal_status_history").insert({
      deal_id: deal.id,
      from_status: null,
      to_status: "inquiry_received",
      changed_by: userId,
    });

    return { id: deal.id };
  });

// ───────────────────────────────────────────────────────────────
// Update deal status / value / commission calc
// ───────────────────────────────────────────────────────────────
const UpdateDealInput = z.object({
  id: z.string().uuid(),
  status: z.string().min(2).max(40),
  deal_value_native: z.number().nonnegative().optional(),
  note: z.string().max(500).optional(),
});

export const adminUpdateDealStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => UpdateDealInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("*")
      .eq("id", data.id)
      .single();
    if (!deal) throw new Error("Deal not found");

    const update: Record<string, any> = { status: data.status, updated_at: new Date().toISOString() };
    if (data.deal_value_native !== undefined) update.deal_value_native = data.deal_value_native;

    // Commission calc when payment received
    if (data.status === "payment_received") {
      const value = data.deal_value_native ?? Number(deal.deal_value_native ?? 0);
      const { data: rate } = await supabaseAdmin
        .from("exchange_rates")
        .select("ngn_rate, gbp_rate, eur_rate")
        .order("fetched_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      const toUsd = (n: number, c: string) => {
        if (c === "USD") return n;
        if (c === "NGN") return n / Number(rate?.ngn_rate ?? 1650);
        if (c === "GBP") return n / Number(rate?.gbp_rate ?? 0.79);
        if (c === "EUR") return n / Number(rate?.eur_rate ?? 0.92);
        return n;
      };
      const abwRate = Number(deal.abw_commission_rate ?? 0.12);
      const refRate = Number(deal.referral_commission_rate ?? 0.07);
      const abwNative = value * abwRate;
      const refNative = deal.referral_partner_id ? abwNative * refRate : 0;
      update.deal_value_usd = toUsd(value, deal.deal_currency);
      update.abw_commission_native = abwNative;
      update.abw_commission_usd = toUsd(abwNative, deal.deal_currency);
      update.referral_commission_native = refNative;
      update.referral_commission_usd = toUsd(refNative, deal.deal_currency);
      update.organiser_payout_native = value - abwNative;
      update.paid_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from("deals").update(update as never).eq("id", data.id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("deal_status_history").insert({
      deal_id: data.id,
      from_status: deal.status,
      to_status: data.status,
      changed_by: userId,
      note: data.note,
    });

    // Notify parties
    const recipients = [deal.organiser_id, deal.sponsor_user_id, deal.referral_partner_id].filter(Boolean) as string[];
    if (recipients.length) {
      await supabaseAdmin.from("notifications").insert(
        recipients.map((uid) => ({
          user_id: uid,
          type: "deal_status_change",
          title: `Deal status: ${data.status.replace(/_/g, " ")}`,
          body: data.note ?? `Deal moved to ${data.status}`,
          data: { deal_id: data.id },
        })),
      );
    }

    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// Mark referral commission paid
// ───────────────────────────────────────────────────────────────
export const adminMarkCommissionPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { deal_id: string }) => z.object({ deal_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    const { data: deal } = await supabaseAdmin
      .from("deals")
      .select("referral_partner_id, referral_commission_native, deal_currency")
      .eq("id", data.deal_id)
      .single();
    if (!deal?.referral_partner_id) throw new Error("Deal has no referral partner");

    await supabaseAdmin
      .from("deals")
      .update({ referral_commission_paid: true, referral_commission_paid_at: new Date().toISOString() })
      .eq("id", data.deal_id);

    await supabaseAdmin.from("notifications").insert({
      user_id: deal.referral_partner_id,
      type: "commission_paid",
      title: "Your commission has been paid",
      body: `${deal.deal_currency} ${Number(deal.referral_commission_native ?? 0).toLocaleString()}`,
      data: { deal_id: data.deal_id },
    });

    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// Update commission config
// ───────────────────────────────────────────────────────────────
const ConfigInput = z.object({
  event_type_category: z.string().min(1).max(120),
  standard_rate: z.number().min(0).max(1),
  premium_rate: z.number().min(0).max(1),
  abw_platform_rate: z.number().min(0).max(1),
});
export const adminUpsertCommissionConfig = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ConfigInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin
      .from("commission_config")
      .upsert({ ...data, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "event_type_category" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// Admin: refresh exchange rates manually (insert a new row)
// ───────────────────────────────────────────────────────────────
const RateInput = z.object({
  ngn_rate: z.number().positive(),
  gbp_rate: z.number().positive(),
  eur_rate: z.number().positive(),
});
export const adminUpdateRates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => RateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("exchange_rates").insert({ ...data, source: "manual_admin" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// Admin: fraud flags
// ───────────────────────────────────────────────────────────────
export const adminListFraudFlags = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
    const { data } = await supabaseAdmin
      .from("fraud_flags")
      .select("*")
      .order("created_at", { ascending: false });
    return { flags: data ?? [] };
  });

export const adminResolveFraudFlag = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: "resolved" | "dismissed" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["resolved", "dismissed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
    await supabaseAdmin
      .from("fraud_flags")
      .update({ status: data.status, reviewed_at: new Date().toISOString(), reviewed_by: userId })
      .eq("id", data.id);
    return { ok: true };
  });

// ───────────────────────────────────────────────────────────────
// Organiser: sponsorship pipeline for own events
// ───────────────────────────────────────────────────────────────
export const getOrganiserPipeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, name, slug, status, view_count, save_count, inquiry_count, banner_image_url, start_date, city, country")
      .eq("organiser_id", userId)
      .order("created_at", { ascending: false });

    const eventIds = (events ?? []).map((e) => e.id);
    let forms: any[] = [];
    let deals: any[] = [];
    if (eventIds.length) {
      const [f, d] = await Promise.all([
        supabaseAdmin
          .from("commitment_forms")
          .select("id, event_id, company_name, contact_name, currency, budget_range_min, budget_range_max, tier_id, submitted_at, referral_partner_id")
          .in("event_id", eventIds)
          .order("submitted_at", { ascending: false }),
        supabaseAdmin
          .from("deals")
          .select("id, event_id, commitment_form_id, status, deal_value_native, deal_currency, referral_partner_id, updated_at")
          .in("event_id", eventIds),
      ]);
      forms = f.data ?? [];
      deals = d.data ?? [];
    }
    return { events: events ?? [], forms, deals };
  });

// ───────────────────────────────────────────────────────────────
// Sponsor: my deals + saved events
// ───────────────────────────────────────────────────────────────
export const getSponsorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [{ data: forms }, { data: saves }, { data: fresh }] = await Promise.all([
      supabaseAdmin
        .from("commitment_forms")
        .select("id, event_id, currency, budget_range_min, budget_range_max, tier_id, submitted_at")
        .eq("sponsor_user_id", userId)
        .order("submitted_at", { ascending: false }),
      supabaseAdmin.from("event_saves").select("event_id, created_at").eq("user_id", userId),
      supabaseAdmin
        .from("events")
        .select("id, slug, name, banner_image_url, start_date, city, country, primary_sector")
        .in("status", ["approved", "listed"])
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    const ids = Array.from(new Set([...(forms ?? []).map((f) => f.event_id), ...(saves ?? []).map((s) => s.event_id)]));
    let evMap: Record<string, any> = {};
    if (ids.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, slug, name, banner_image_url, start_date, city, country")
        .in("id", ids);
      for (const e of evs ?? []) evMap[e.id] = e;
    }
    return { forms: forms ?? [], saves: saves ?? [], freshEvents: fresh ?? [], eventMap: evMap };
  });
