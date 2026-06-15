import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function monthKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function lastNMonths(n: number) {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}

function seriesFromDates(dates: string[], months = 6) {
  const keys = lastNMonths(months);
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const iso of dates) {
    const k = monthKey(iso);
    if (k in counts) counts[k] += 1;
  }
  return keys.map((month) => ({ month, count: counts[month] }));
}

async function requireRole(userId: string, roles: string[]) {
  const { data } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => roles.includes(r.role))) throw new Error("Forbidden");
}

export const getOrganiserAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await requireRole(userId, ["organiser", "abw_admin", "super_admin"]);

    const { data: events } = await supabaseAdmin
      .from("events")
      .select("id, name, view_count, save_count, inquiry_count, status, ige_vetted")
      .eq("organiser_id", userId);

    const eventIds = (events ?? []).map((e) => e.id);
    let forms: any[] = [];
    let deals: any[] = [];
    if (eventIds.length) {
      const [f, d] = await Promise.all([
        supabaseAdmin.from("commitment_forms").select("submitted_at, created_at").in("event_id", eventIds),
        supabaseAdmin.from("deals").select("status, updated_at").in("event_id", eventIds),
      ]);
      forms = f.data ?? [];
      deals = d.data ?? [];
    }

    const dealStatusCounts: Record<string, number> = {};
    for (const d of deals) dealStatusCounts[d.status] = (dealStatusCounts[d.status] ?? 0) + 1;

    return {
      summary: {
        totalViews: (events ?? []).reduce((s, e) => s + (e.view_count ?? 0), 0),
        totalSaves: (events ?? []).reduce((s, e) => s + (e.save_count ?? 0), 0),
        totalInquiries: (events ?? []).reduce((s, e) => s + (e.inquiry_count ?? 0), 0),
        closedDeals: deals.filter((d) => d.status === "payment_received").length,
        totalEvents: events?.length ?? 0,
        vettedEvents: (events ?? []).filter((e) => e.ige_vetted).length,
      },
      eventEngagement: (events ?? [])
        .filter((e) => ["approved", "listed"].includes(e.status))
        .slice(0, 8)
        .map((e) => ({
          name: (e.name ?? "Event").slice(0, 18),
          views: e.view_count ?? 0,
          saves: e.save_count ?? 0,
          inquiries: e.inquiry_count ?? 0,
        })),
      inquiriesOverTime: seriesFromDates(
        forms.map((f) => f.submitted_at ?? f.created_at).filter(Boolean),
      ),
      dealPipeline: Object.entries(dealStatusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, " "),
        count,
      })),
    };
  });

export const getSponsorAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await requireRole(userId, ["sponsor", "abw_admin", "super_admin"]);

    const [{ data: forms }, { data: saves }] = await Promise.all([
      supabaseAdmin
        .from("commitment_forms")
        .select("submitted_at, created_at, currency, budget_range_max, event_id")
        .eq("sponsor_user_id", userId),
      supabaseAdmin.from("event_saves").select("created_at, event_id").eq("user_id", userId),
    ]);

    const eventIds = Array.from(new Set([...(forms ?? []).map((f) => f.event_id), ...(saves ?? []).map((s) => s.event_id)]));
    let sectors: Record<string, number> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin.from("events").select("id, primary_sector").in("id", eventIds);
      for (const e of evs ?? []) {
        const s = e.primary_sector ?? "Other";
        sectors[s] = (sectors[s] ?? 0) + 1;
      }
    }

    const currencyTotals: Record<string, number> = {};
    for (const f of forms ?? []) {
      const c = f.currency ?? "USD";
      currencyTotals[c] = (currencyTotals[c] ?? 0) + Number(f.budget_range_max ?? 0);
    }

    return {
      summary: {
        commitments: forms?.length ?? 0,
        savedEvents: saves?.length ?? 0,
        sectorsExplored: Object.keys(sectors).length,
      },
      commitmentsOverTime: seriesFromDates(
        (forms ?? []).map((f) => f.submitted_at ?? f.created_at).filter(Boolean),
      ),
      savesOverTime: seriesFromDates((saves ?? []).map((s) => s.created_at).filter(Boolean)),
      sectorBreakdown: Object.entries(sectors).map(([sector, count]) => ({ sector, count })),
      budgetByCurrency: Object.entries(currencyTotals).map(([currency, total]) => ({ currency, total })),
    };
  });

export const getReferralAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await requireRole(userId, ["referral_partner", "abw_admin", "super_admin"]);

    const [{ data: links }, { data: deals }] = await Promise.all([
      supabaseAdmin
        .from("referral_links")
        .select("id, short_code, click_count, conversion_count, event_id")
        .eq("referral_partner_id", userId),
      supabaseAdmin
        .from("deals")
        .select("status, referral_commission_usd, referral_commission_paid, created_at")
        .eq("referral_partner_id", userId),
    ]);

    const eventIds = (links ?? []).map((l) => l.event_id);
    let eventNames: Record<string, string> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin.from("events").select("id, name").in("id", eventIds);
      for (const e of evs ?? []) eventNames[e.id] = e.name ?? "Event";
    }

    const commission = { earned: 0, pending: 0, paid: 0 };
    for (const d of deals ?? []) {
      const v = Number(d.referral_commission_usd ?? 0);
      if (d.referral_commission_paid) commission.paid += v;
      else if (d.status === "payment_received") commission.earned += v;
      else commission.pending += v;
    }

    return {
      summary: {
        links: links?.length ?? 0,
        clicks: (links ?? []).reduce((s, l) => s + (l.click_count ?? 0), 0),
        conversions: (links ?? []).reduce((s, l) => s + (l.conversion_count ?? 0), 0),
        ...commission,
      },
      clicksByLink: (links ?? [])
        .sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0))
        .slice(0, 6)
        .map((l) => ({
          name: (eventNames[l.event_id] ?? l.short_code).slice(0, 16),
          clicks: l.click_count ?? 0,
          conversions: l.conversion_count ?? 0,
        })),
      commissionBreakdown: [
        { label: "Earned", value: commission.earned },
        { label: "Pending", value: commission.pending },
        { label: "Paid", value: commission.paid },
      ],
      dealsOverTime: seriesFromDates((deals ?? []).map((d) => d.created_at).filter(Boolean)),
    };
  });

export const getMediaAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await requireRole(userId, ["media_partner", "abw_admin", "super_admin"]);

    const [{ data: requests }, { data: saves }] = await Promise.all([
      supabaseAdmin.from("media_requests").select("status, created_at, event_id").eq("media_partner_id", userId),
      supabaseAdmin.from("event_saves").select("event_id").eq("user_id", userId),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const r of requests ?? []) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;

    const eventIds = Array.from(new Set([...(requests ?? []).map((r) => r.event_id), ...(saves ?? []).map((s) => s.event_id)]));
    let sectors: Record<string, number> = {};
    if (eventIds.length) {
      const { data: evs } = await supabaseAdmin.from("events").select("id, primary_sector").in("id", eventIds);
      for (const e of evs ?? []) {
        const s = e.primary_sector ?? "Other";
        sectors[s] = (sectors[s] ?? 0) + 1;
      }
    }

    return {
      summary: {
        requests: requests?.length ?? 0,
        saved: saves?.length ?? 0,
        approved: statusCounts.approved ?? 0,
      },
      requestsByStatus: Object.entries(statusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, " "),
        count,
      })),
      requestsOverTime: seriesFromDates((requests ?? []).map((r) => r.created_at).filter(Boolean)),
      sectorInterest: Object.entries(sectors).map(([sector, count]) => ({ sector, count })),
    };
  });

export const getAdminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    await requireRole(userId, ["abw_admin", "super_admin"]);

    const [{ data: events }, { data: deals }, { data: waitlist }] = await Promise.all([
      supabaseAdmin.from("events").select("status"),
      supabaseAdmin.from("deals").select("status, deal_value_usd, paid_at, updated_at, created_at"),
      supabaseAdmin.from("waitlist_signups").select("created_at"),
    ]);

    const vettingCounts: Record<string, number> = {};
    for (const e of events ?? []) vettingCounts[e.status] = (vettingCounts[e.status] ?? 0) + 1;

    const dealStatusCounts: Record<string, number> = {};
    for (const d of deals ?? []) dealStatusCounts[d.status] = (dealStatusCounts[d.status] ?? 0) + 1;

    const gmvByMonth: Record<string, number> = Object.fromEntries(lastNMonths(6).map((m) => [m, 0]));
    for (const d of deals ?? []) {
      if (d.status !== "payment_received") continue;
      const k = monthKey(d.paid_at ?? d.updated_at ?? d.created_at);
      if (k in gmvByMonth) gmvByMonth[k] += Number(d.deal_value_usd ?? 0);
    }

    return {
      summary: {
        totalEvents: events?.length ?? 0,
        liveEvents: (events ?? []).filter((e) => e.status === "listed").length,
        openDeals: (deals ?? []).filter((d) => !["payment_received", "closed_lost", "cancelled"].includes(d.status)).length,
        waitlist: waitlist?.length ?? 0,
        gmv: (deals ?? []).filter((d) => d.status === "payment_received").reduce((s, d) => s + Number(d.deal_value_usd ?? 0), 0),
      },
      vettingPipeline: Object.entries(vettingCounts).map(([status, count]) => ({
        status: status.replace(/_/g, " "),
        count,
      })),
      dealPipeline: Object.entries(dealStatusCounts).map(([status, count]) => ({
        status: status.replace(/_/g, " "),
        count,
      })),
      gmvOverTime: Object.entries(gmvByMonth).map(([month, gmv]) => ({ month, gmv: Math.round(gmv) })),
      waitlistOverTime: seriesFromDates((waitlist ?? []).map((w) => w.created_at).filter(Boolean)),
    };
  });
