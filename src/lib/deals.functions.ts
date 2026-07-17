import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSuperAdmin, requirePlatformAdmin, getActorProfile } from "@/lib/admin-auth";
import { auditAdminAction } from "@/lib/admin-audit";
import { notifyDealParties } from "@/lib/email/deal-notify";
import { sendTransactionalEmailServer } from "@/lib/email/server-send";
import { rankEventsForSponsor } from "@/lib/event-recommendations";

const SITE_URL = process.env.VITE_SITE_URL || "https://www.insideglobalevents.com";

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

    const [{ data: deals }, { data: partners }, { data: configs }, { data: flags }, { data: forms }, { data: allLinks }, { data: customPackages }, { data: staffRoles }] = await Promise.all([
      supabaseAdmin
        .from("deals")
        .select("id, commitment_form_id, event_id, organiser_id, sponsor_user_id, referral_partner_id, assigned_to, status, deal_value_native, deal_currency, deal_value_usd, abw_commission_usd, abw_commission_native, referral_commission_usd, referral_commission_native, referral_commission_paid, payment_link_url, payment_link_provider, payment_link_created_at, contract_url, contract_generated_at, created_at, updated_at, paid_at")
        .order("updated_at", { ascending: false }),
      supabaseAdmin
        .from("referral_partner_profiles")
        .select("user_id, full_name, deals_closed, total_earned_usd, commission_tier, payout_currency"),
      supabaseAdmin
        .from("commission_config")
        .select("event_type_category, standard_rate, premium_rate, abw_platform_rate")
        .order("event_type_category"),
      supabaseAdmin.from("fraud_flags").select("id, status").eq("status", "open"),
      supabaseAdmin
        .from("commitment_forms")
        .select("id, event_id, company_name, contact_name, currency, budget_range_min, budget_range_max, referral_partner_id, partnership_type, fraud_flags, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("referral_links")
        .select("referral_partner_id, click_count, conversion_count, status"),
      supabaseAdmin
        .from("custom_package_requests" as never)
        .select("id, event_id, company_name, contact_name, currency, budget_range_min, budget_range_max, package_brief, status, created_at")
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("user_roles").select("user_id, role").in("role", ["abw_admin", "super_admin"]),
    ]);

    // Inquiries that have not yet been converted into a deal.
    const dealtFormIds = new Set((deals ?? []).map((d) => d.commitment_form_id).filter(Boolean));
    const inquiries = (forms ?? []).filter((f) => !dealtFormIds.has(f.id));

    const eventIds = Array.from(
      new Set([
        ...(deals ?? []).map((d) => d.event_id),
        ...inquiries.map((f) => f.event_id),
        ...(customPackages ?? []).map((c: any) => c.event_id),
      ].filter(Boolean)),
    );
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
        if (!["payment_received", "deal_lost", "deal_closed", "cancelled"].includes(d.status)) {
          acc.open += 1;
          acc.forecast += Number(d.deal_value_usd ?? 0);
        }
        return acc;
      },
      { gmv: 0, abw: 0, refOwed: 0, open: 0, forecast: 0 },
    );

    const linkStats: Record<string, { links: number; clicks: number; conversions: number }> = {};
    for (const l of allLinks ?? []) {
      const id = l.referral_partner_id;
      if (!linkStats[id]) linkStats[id] = { links: 0, clicks: 0, conversions: 0 };
      linkStats[id].links += 1;
      linkStats[id].clicks += l.click_count ?? 0;
      linkStats[id].conversions += l.conversion_count ?? 0;
    }

    const staffIds = Array.from(new Set((staffRoles ?? []).map((r) => r.user_id)));
    let staffMap: Record<string, { email: string; display_name: string | null }> = {};
    if (staffIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("profiles")
        .select("id, email, display_name")
        .in("id", staffIds);
      for (const p of profs ?? []) staffMap[p.id] = { email: p.email ?? "", display_name: p.display_name };
    }

    return {
      deals: deals ?? [],
      inquiries,
      customPackages: customPackages ?? [],
      events: eventMap,
      staff: (staffRoles ?? []).map((r) => ({
        user_id: r.user_id,
        role: r.role,
        ...staffMap[r.user_id],
      })),
      partners: (partners ?? []).map((p) => ({
        ...p,
        owed_usd: partnerOwed[p.user_id] ?? 0,
        paid_usd_running: partnerPaid[p.user_id] ?? 0,
        active_links: linkStats[p.user_id]?.links ?? 0,
        total_clicks: linkStats[p.user_id]?.clicks ?? 0,
        conversions: linkStats[p.user_id]?.conversions ?? 0,
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
      .select("organiser_id, name")
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

    await notifyDealParties({
      dealId: deal.id,
      eventName: ev?.name ?? "Event",
      fromStatus: null,
      toStatus: "inquiry_received",
      userIds: [ev!.organiser_id as string, cf.sponsor_user_id, cf.referral_partner_id].filter(Boolean) as string[],
    }).catch((e) => console.error("[adminCreateDeal] notify", e));

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

    // Notify parties (in-app + email)
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
    if (data.status !== deal.status) {
      const { data: ev } = await supabaseAdmin.from("events").select("name").eq("id", deal.event_id).single();
      await notifyDealParties({
        dealId: data.id,
        eventName: ev?.name ?? "Event",
        fromStatus: deal.status,
        toStatus: data.status,
        note: data.note,
        userIds: recipients,
      }).catch((e) => console.error("[adminUpdateDealStatus] notify", e));
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
      .select("referral_partner_id, referral_commission_native, referral_commission_usd, deal_currency, event_id")
      .eq("id", data.deal_id)
      .single();
    if (!deal?.referral_partner_id) throw new Error("Deal has no referral partner");

    await supabaseAdmin
      .from("deals")
      .update({ referral_commission_paid: true, referral_commission_paid_at: new Date().toISOString() })
      .eq("id", data.deal_id);

    const { data: ev } = await supabaseAdmin.from("events").select("name").eq("id", deal.event_id).single();
    const amount = Number(deal.referral_commission_native ?? 0);

    await supabaseAdmin.from("notifications").insert({
      user_id: deal.referral_partner_id,
      type: "commission_paid",
      title: "Your commission has been paid",
      body: `${deal.deal_currency} ${amount.toLocaleString()}`,
      data: { deal_id: data.deal_id },
    });

    const { data: refProfile } = await supabaseAdmin
      .from("profiles")
      .select("email, display_name")
      .eq("id", deal.referral_partner_id)
      .maybeSingle();
    if (refProfile?.email) {
      await sendTransactionalEmailServer({
        templateName: "commission-paid",
        recipientEmail: refProfile.email,
        idempotencyKey: `commission-paid-${data.deal_id}`,
        templateData: {
          name: refProfile.display_name ?? refProfile.email.split("@")[0],
          eventName: ev?.name ?? "Your referred event",
          amount: amount.toLocaleString(),
          currency: deal.deal_currency ?? "USD",
          dashboardUrl: `${SITE_URL}/dashboard/commissions`,
        },
      }).catch((e) => console.error("[adminMarkCommissionPaid] email", e));
    }

    return { ok: true };
  });

export const adminAssignDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ deal_id: z.string().uuid(), assigned_to: z.string().uuid().nullable() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");

    if (data.assigned_to) {
      const { data: staff } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", data.assigned_to);
      if (!staff?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) {
        throw new Error("Assignee must be IGE staff");
      }
    }

    const { error } = await supabaseAdmin
      .from("deals")
      .update({ assigned_to: data.assigned_to, updated_at: new Date().toISOString() } as never)
      .eq("id", data.deal_id);
    if (error) throw new Error(error.message);
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
    const { userId } = context;
    await requireSuperAdmin(userId);
    const { error } = await supabaseAdmin
      .from("commission_config")
      .upsert({ ...data, updated_by: userId, updated_at: new Date().toISOString() }, { onConflict: "event_type_category" });
    if (error) throw new Error(error.message);
    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId: userId,
      actorEmail: actor?.email,
      action: "commission_rates_updated",
      summary: `Updated commission rates for ${data.event_type_category}`,
      resourceType: "commission_config",
      resourceId: data.event_type_category,
      notifyTitle: "Commission rates updated",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "Admin"} updated commission rates for ${data.event_type_category}.`,
    });
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
    const { userId } = context;
    await requireSuperAdmin(userId);
    const { error } = await supabaseAdmin.from("exchange_rates").insert({ ...data, source: "manual_admin" });
    if (error) throw new Error(error.message);
    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId: userId,
      actorEmail: actor?.email,
      action: "fx_rates_updated",
      summary: `Updated FX rates (NGN ${data.ngn_rate}, GBP ${data.gbp_rate}, EUR ${data.eur_rate})`,
      resourceType: "exchange_rates",
      notifyTitle: "FX rates updated",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "Admin"} updated platform exchange rates.`,
    });
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
  .inputValidator((d: { id: string; status: "actioned" | "dismissed" }) =>
    z.object({ id: z.string().uuid(), status: z.enum(["actioned", "dismissed"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    await requireSuperAdmin(userId);
    await supabaseAdmin
      .from("fraud_flags")
      .update({ status: data.status, reviewed_at: new Date().toISOString(), reviewed_by: userId })
      .eq("id", data.id);
    const actor = await getActorProfile(userId);
    await auditAdminAction({
      actorId: userId,
      actorEmail: actor?.email,
      action: "fraud_flag_updated",
      summary: `Fraud flag marked as ${data.status}`,
      resourceType: "fraud_flag",
      resourceId: data.id,
      metadata: { status: data.status },
      notifyTitle: "Fraud flag updated",
      notifyBody: `${actor?.display_name ?? actor?.email ?? "Admin"} marked a fraud flag as ${data.status}.`,
    });
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
          .select("id, event_id, company_name, contact_name, sponsor_user_id, currency, budget_range_min, budget_range_max, tier_id, submitted_at, referral_partner_id")
          .in("event_id", eventIds)
          .order("submitted_at", { ascending: false }),
        supabaseAdmin
          .from("deals")
          .select("id, event_id, commitment_form_id, status, deal_value_native, deal_currency, deal_value_usd, referral_partner_id, contract_url, payment_link_url, updated_at")
          .in("event_id", eventIds),
      ]);
      forms = f.data ?? [];
      deals = d.data ?? [];
    }
    const partnerIds = Array.from(new Set([
      ...forms.map((f) => f.referral_partner_id).filter(Boolean),
      ...deals.map((d) => d.referral_partner_id).filter(Boolean),
    ])) as string[];
    let partnerMap: Record<string, string> = {};
    if (partnerIds.length) {
      const { data: profs } = await supabaseAdmin
        .from("referral_partner_profiles")
        .select("user_id, full_name")
        .in("user_id", partnerIds);
      for (const p of profs ?? []) partnerMap[p.user_id] = p.full_name ?? "Partner";
    }

    return { events: events ?? [], forms, deals, partnerMap };
  });

// ───────────────────────────────────────────────────────────────
// Sponsor: my deals + saved events
// ───────────────────────────────────────────────────────────────
export const getSponsorDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const [{ data: forms }, { data: saves }, { data: fresh }, { data: profile }, { data: baseProfile }] = await Promise.all([
      supabaseAdmin
        .from("commitment_forms")
        .select("id, event_id, currency, budget_range_min, budget_range_max, tier_id, submitted_at, referral_partner_id")
        .eq("sponsor_user_id", userId)
        .order("submitted_at", { ascending: false }),
      supabaseAdmin.from("event_saves").select("event_id, created_at").eq("user_id", userId),
      supabaseAdmin
        .from("events")
        .select("id, slug, name, banner_image_url, start_date, city, country, primary_sector, organiser_id, attendance_size, created_at")
        .in("status", ["approved", "listed"])
        .order("created_at", { ascending: false })
        .limit(6),
      supabaseAdmin
        .from("sponsor_profiles")
        .select("sponsorship_sectors, target_geographies, budget_range_min, budget_range_max, preferred_currency")
        .eq("user_id", userId)
        .maybeSingle(),
      supabaseAdmin.from("profiles").select("profile_complete").eq("id", userId).maybeSingle(),
    ]);

    const sectors = (profile?.sponsorship_sectors as string[] | null) ?? [];
    const geos = (profile?.target_geographies as string[] | null) ?? [];
    const matchCtx = {
      sponsorship_sectors: sectors,
      target_geographies: geos,
      budget_range_min: profile?.budget_range_min != null ? Number(profile.budget_range_min) : null,
      budget_range_max: profile?.budget_range_max != null ? Number(profile.budget_range_max) : null,
      preferred_currency: profile?.preferred_currency ?? "USD",
      profile_complete: Number(baseProfile?.profile_complete ?? 0),
    };

    let recommended: any[] = [];
    const { data: pool } = await supabaseAdmin
      .from("events")
      .select("id, slug, name, banner_image_url, start_date, city, country, primary_sector, organiser_id, attendance_size, created_at")
      .in("status", ["approved", "listed"])
      .order("created_at", { ascending: false })
      .limit(36);

    if ((pool ?? []).length) {
      const ids = (pool ?? []).map((e) => e.id);
      const organiserIds = Array.from(new Set((pool ?? []).map((e) => e.organiser_id).filter(Boolean))) as string[];
      const [{ data: tiers }, { data: orgProfiles }] = await Promise.all([
        supabaseAdmin.from("event_sponsorship_tiers").select("event_id, price, currency").in("event_id", ids).order("price", { ascending: true }),
        organiserIds.length
          ? supabaseAdmin.from("profiles").select("id, profile_complete").in("id", organiserIds)
          : Promise.resolve({ data: [] as { id: string; profile_complete: number }[] }),
      ]);
      const priceMap: Record<string, { price: number; currency: string }> = {};
      for (const t of tiers ?? []) {
        if (!priceMap[t.event_id]) priceMap[t.event_id] = { price: Number(t.price), currency: t.currency };
      }
      const orgComplete: Record<string, number> = {};
      for (const p of orgProfiles ?? []) orgComplete[p.id] = Number(p.profile_complete ?? 0);

      const withPrices = (pool ?? []).map((e) => ({ ...e, starting: priceMap[e.id] ?? null }));
      recommended = rankEventsForSponsor(withPrices, matchCtx, orgComplete).slice(0, 12);
    }

    const referralFormIds = (forms ?? []).filter((f) => f.referral_partner_id).map((f) => f.event_id);
    let referralShared: any[] = [];
    if (referralFormIds.length) {
      const { data: refEv } = await supabaseAdmin
        .from("events")
        .select("id, slug, name, banner_image_url, start_date, city, country, primary_sector")
        .in("id", Array.from(new Set(referralFormIds)))
        .limit(6);
      referralShared = refEv ?? [];
    }

    const ids = Array.from(new Set([...(forms ?? []).map((f) => f.event_id), ...(saves ?? []).map((s) => s.event_id)]));
    let evMap: Record<string, any> = {};
    if (ids.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, slug, name, banner_image_url, start_date, city, country, organiser_id")
        .in("id", ids);
      for (const e of evs ?? []) evMap[e.id] = e;
    }
    return {
      forms: forms ?? [],
      saves: saves ?? [],
      freshEvents: fresh ?? [],
      recommendedEvents: recommended,
      referralSharedEvents: referralShared,
      profileSectors: sectors,
      profileComplete: matchCtx.profile_complete,
      eventMap: evMap,
    };
  });

// ───────────────────────────────────────────────────────────────
// Sponsor Live Deal Pipeline (PRD v3.4 §08.1 Module 2) — Kanban.
// Derived from saved events + commitment forms + deals.
// ───────────────────────────────────────────────────────────────
const DEAL_STAGE_COLUMN: Record<string, string> = {
  inquiry_received: "in_conversation",
  qualification_call_scheduled: "in_conversation",
  proposal_sent: "proposal",
  negotiation: "proposal",
  contract_sent: "proposal",
  contract_signed: "committed",
  payment_received: "paid_active",
  deal_closed: "closed",
  deal_lost: "closed",
  cancelled: "closed",
};

export const getSponsorPipeline = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const [{ data: saves }, { data: forms }, { data: deals }] = await Promise.all([
      supabaseAdmin.from("event_saves").select("event_id, created_at").eq("user_id", userId),
      supabaseAdmin
        .from("commitment_forms")
        .select("id, event_id, company_name, currency, budget_range_min, budget_range_max, created_at")
        .eq("sponsor_user_id", userId),
      supabaseAdmin
        .from("deals")
        .select("id, commitment_form_id, event_id, status, deal_value_native, deal_currency, deal_value_usd, payment_link_url, payment_link_provider, contract_url, updated_at")
        .eq("sponsor_user_id", userId),
    ]);

    const eventIds = Array.from(
      new Set([
        ...(saves ?? []).map((s) => s.event_id),
        ...(forms ?? []).map((f) => f.event_id),
        ...(deals ?? []).map((d) => d.event_id),
      ].filter(Boolean)),
    );
    const eventMap: Record<string, any> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin
        .from("events")
        .select("id, name, slug, city, country, start_date")
        .in("id", eventIds);
      for (const e of evs ?? []) eventMap[e.id] = e;
    }

    const dealByForm: Record<string, any> = {};
    for (const d of deals ?? []) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;
    const formEventIds = new Set((forms ?? []).map((f) => f.event_id));

    const cards: any[] = [];

    // Watching: saved events with no commitment yet.
    for (const s of saves ?? []) {
      if (formEventIds.has(s.event_id)) continue;
      const ev = eventMap[s.event_id];
      if (!ev) continue;
      cards.push({ key: `save-${s.event_id}`, column: "watching", ev, label: "Saved" });
    }

    // Commitment forms → In Conversation, or advanced by their deal's stage.
    for (const f of forms ?? []) {
      const ev = eventMap[f.event_id];
      if (!ev) continue;
      const deal = dealByForm[f.id];
      const column = deal ? DEAL_STAGE_COLUMN[deal.status] ?? "in_conversation" : "in_conversation";
      cards.push({
        key: `form-${f.id}`,
        column,
        ev,
        company: f.company_name,
        currency: deal?.deal_currency ?? f.currency,
        value: deal?.deal_value_native ?? null,
        budgetMin: f.budget_range_min,
        budgetMax: f.budget_range_max,
        status: deal?.status ?? null,
        paymentLinkUrl: deal?.payment_link_url ?? null,
        contractUrl: deal?.contract_url ?? null,
      });
    }

    return { cards };
  });
