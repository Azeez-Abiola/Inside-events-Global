import { c as createServerRpc } from "./createServerRpc-BtR2InOc.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { s as supabaseAdmin } from "./client.server-k0C2Btf0.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/ws.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./supabase-env-Di-uc-dX.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
function monthKey(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function lastNMonths(n) {
  const out = [];
  const now = /* @__PURE__ */ new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return out;
}
function seriesFromDates(dates, months = 6) {
  const keys = lastNMonths(months);
  const counts = Object.fromEntries(keys.map((k) => [k, 0]));
  for (const iso of dates) {
    const k = monthKey(iso);
    if (k in counts) counts[k] += 1;
  }
  return keys.map((month) => ({
    month,
    count: counts[month]
  }));
}
async function requireRole(userId, roles) {
  const {
    data
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!data?.some((r) => roles.includes(r.role))) throw new Error("Forbidden");
}
const getOrganiserAnalytics_createServerFn_handler = createServerRpc({
  id: "b374f0e1177d21e83f921ddd6af739a326dcf0d7c8aea2720c08415b85262d78",
  name: "getOrganiserAnalytics",
  filename: "src/lib/analytics.functions.ts"
}, (opts) => getOrganiserAnalytics.__executeServer(opts));
const getOrganiserAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getOrganiserAnalytics_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireRole(userId, ["organiser", "abw_admin", "super_admin"]);
  const {
    data: events
  } = await supabaseAdmin.from("events").select("id, name, view_count, save_count, inquiry_count, status, ige_vetted").eq("organiser_id", userId);
  const eventIds = (events ?? []).map((e) => e.id);
  let forms = [];
  let deals = [];
  if (eventIds.length) {
    const [f, d] = await Promise.all([supabaseAdmin.from("commitment_forms").select("submitted_at, created_at").in("event_id", eventIds), supabaseAdmin.from("deals").select("status, updated_at").in("event_id", eventIds)]);
    forms = f.data ?? [];
    deals = d.data ?? [];
  }
  const dealStatusCounts = {};
  for (const d of deals) dealStatusCounts[d.status] = (dealStatusCounts[d.status] ?? 0) + 1;
  return {
    summary: {
      totalViews: (events ?? []).reduce((s, e) => s + (e.view_count ?? 0), 0),
      totalSaves: (events ?? []).reduce((s, e) => s + (e.save_count ?? 0), 0),
      totalInquiries: (events ?? []).reduce((s, e) => s + (e.inquiry_count ?? 0), 0),
      closedDeals: deals.filter((d) => d.status === "payment_received").length,
      totalEvents: events?.length ?? 0,
      vettedEvents: (events ?? []).filter((e) => e.ige_vetted).length
    },
    eventEngagement: (events ?? []).filter((e) => ["approved", "listed"].includes(e.status)).slice(0, 8).map((e) => ({
      name: (e.name ?? "Event").slice(0, 18),
      views: e.view_count ?? 0,
      saves: e.save_count ?? 0,
      inquiries: e.inquiry_count ?? 0
    })),
    inquiriesOverTime: seriesFromDates(forms.map((f) => f.submitted_at ?? f.created_at).filter(Boolean)),
    dealPipeline: Object.entries(dealStatusCounts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count
    }))
  };
});
const getSponsorAnalytics_createServerFn_handler = createServerRpc({
  id: "1697b24b19a571c5e9ac8a669efd51f073991d65c346c5a77c07b658723cbe82",
  name: "getSponsorAnalytics",
  filename: "src/lib/analytics.functions.ts"
}, (opts) => getSponsorAnalytics.__executeServer(opts));
const getSponsorAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getSponsorAnalytics_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireRole(userId, ["sponsor", "abw_admin", "super_admin"]);
  const [{
    data: forms
  }, {
    data: saves
  }] = await Promise.all([supabaseAdmin.from("commitment_forms").select("submitted_at, created_at, currency, budget_range_max, event_id").eq("sponsor_user_id", userId), supabaseAdmin.from("event_saves").select("created_at, event_id").eq("user_id", userId)]);
  const eventIds = Array.from(/* @__PURE__ */ new Set([...(forms ?? []).map((f) => f.event_id), ...(saves ?? []).map((s) => s.event_id)]));
  let sectors = {};
  if (eventIds.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, primary_sector").in("id", eventIds);
    for (const e of evs ?? []) {
      const s = e.primary_sector ?? "Other";
      sectors[s] = (sectors[s] ?? 0) + 1;
    }
  }
  const currencyTotals = {};
  for (const f of forms ?? []) {
    const c = f.currency ?? "USD";
    currencyTotals[c] = (currencyTotals[c] ?? 0) + Number(f.budget_range_max ?? 0);
  }
  return {
    summary: {
      commitments: forms?.length ?? 0,
      savedEvents: saves?.length ?? 0,
      sectorsExplored: Object.keys(sectors).length
    },
    commitmentsOverTime: seriesFromDates((forms ?? []).map((f) => f.submitted_at ?? f.created_at).filter(Boolean)),
    savesOverTime: seriesFromDates((saves ?? []).map((s) => s.created_at).filter(Boolean)),
    sectorBreakdown: Object.entries(sectors).map(([sector, count]) => ({
      sector,
      count
    })),
    budgetByCurrency: Object.entries(currencyTotals).map(([currency, total]) => ({
      currency,
      total
    }))
  };
});
const getReferralAnalytics_createServerFn_handler = createServerRpc({
  id: "a849a6fcb8d812bdd92e73dc82ec4bed238b238414b5ca259f01616bb381240c",
  name: "getReferralAnalytics",
  filename: "src/lib/analytics.functions.ts"
}, (opts) => getReferralAnalytics.__executeServer(opts));
const getReferralAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getReferralAnalytics_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireRole(userId, ["referral_partner", "abw_admin", "super_admin"]);
  const [{
    data: links
  }, {
    data: deals
  }] = await Promise.all([supabaseAdmin.from("referral_links").select("id, short_code, click_count, conversion_count, event_id").eq("referral_partner_id", userId), supabaseAdmin.from("deals").select("status, referral_commission_usd, referral_commission_paid, created_at").eq("referral_partner_id", userId)]);
  const eventIds = (links ?? []).map((l) => l.event_id);
  let eventNames = {};
  if (eventIds.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, name").in("id", eventIds);
    for (const e of evs ?? []) eventNames[e.id] = e.name ?? "Event";
  }
  const commission = {
    earned: 0,
    pending: 0,
    paid: 0
  };
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
      ...commission
    },
    clicksByLink: (links ?? []).sort((a, b) => (b.click_count ?? 0) - (a.click_count ?? 0)).slice(0, 6).map((l) => ({
      name: (eventNames[l.event_id] ?? l.short_code).slice(0, 16),
      clicks: l.click_count ?? 0,
      conversions: l.conversion_count ?? 0
    })),
    commissionBreakdown: [{
      label: "Earned",
      value: commission.earned
    }, {
      label: "Pending",
      value: commission.pending
    }, {
      label: "Paid",
      value: commission.paid
    }],
    dealsOverTime: seriesFromDates((deals ?? []).map((d) => d.created_at).filter(Boolean))
  };
});
const getMediaAnalytics_createServerFn_handler = createServerRpc({
  id: "33ec8adbb57c7ebb7090a9284f1b7fc428fc7c681695e142343976ad2db935f0",
  name: "getMediaAnalytics",
  filename: "src/lib/analytics.functions.ts"
}, (opts) => getMediaAnalytics.__executeServer(opts));
const getMediaAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMediaAnalytics_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireRole(userId, ["media_partner", "abw_admin", "super_admin"]);
  const [{
    data: requests
  }, {
    data: saves
  }] = await Promise.all([supabaseAdmin.from("media_requests").select("status, created_at, event_id").eq("media_partner_id", userId), supabaseAdmin.from("event_saves").select("event_id").eq("user_id", userId)]);
  const statusCounts = {};
  for (const r of requests ?? []) statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  const eventIds = Array.from(/* @__PURE__ */ new Set([...(requests ?? []).map((r) => r.event_id), ...(saves ?? []).map((s) => s.event_id)]));
  let sectors = {};
  if (eventIds.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, primary_sector").in("id", eventIds);
    for (const e of evs ?? []) {
      const s = e.primary_sector ?? "Other";
      sectors[s] = (sectors[s] ?? 0) + 1;
    }
  }
  return {
    summary: {
      requests: requests?.length ?? 0,
      saved: saves?.length ?? 0,
      approved: statusCounts.approved ?? 0
    },
    requestsByStatus: Object.entries(statusCounts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count
    })),
    requestsOverTime: seriesFromDates((requests ?? []).map((r) => r.created_at).filter(Boolean)),
    sectorInterest: Object.entries(sectors).map(([sector, count]) => ({
      sector,
      count
    }))
  };
});
const getAdminAnalytics_createServerFn_handler = createServerRpc({
  id: "52a55324d8a6e06dd67ad67256b022a8674c46d777604cbee675d6fb01db9853",
  name: "getAdminAnalytics",
  filename: "src/lib/analytics.functions.ts"
}, (opts) => getAdminAnalytics.__executeServer(opts));
const getAdminAnalytics = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getAdminAnalytics_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  await requireRole(userId, ["abw_admin", "super_admin"]);
  const [{
    data: events
  }, {
    data: deals
  }, {
    data: waitlist
  }] = await Promise.all([supabaseAdmin.from("events").select("status"), supabaseAdmin.from("deals").select("status, deal_value_usd, paid_at, updated_at, created_at"), supabaseAdmin.from("waitlist_signups").select("created_at")]);
  const vettingCounts = {};
  for (const e of events ?? []) vettingCounts[e.status] = (vettingCounts[e.status] ?? 0) + 1;
  const dealStatusCounts = {};
  for (const d of deals ?? []) dealStatusCounts[d.status] = (dealStatusCounts[d.status] ?? 0) + 1;
  const gmvByMonth = Object.fromEntries(lastNMonths(6).map((m) => [m, 0]));
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
      gmv: (deals ?? []).filter((d) => d.status === "payment_received").reduce((s, d) => s + Number(d.deal_value_usd ?? 0), 0)
    },
    vettingPipeline: Object.entries(vettingCounts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count
    })),
    dealPipeline: Object.entries(dealStatusCounts).map(([status, count]) => ({
      status: status.replace(/_/g, " "),
      count
    })),
    gmvOverTime: Object.entries(gmvByMonth).map(([month, gmv]) => ({
      month,
      gmv: Math.round(gmv)
    })),
    waitlistOverTime: seriesFromDates((waitlist ?? []).map((w) => w.created_at).filter(Boolean))
  };
});
export {
  getAdminAnalytics_createServerFn_handler,
  getMediaAnalytics_createServerFn_handler,
  getOrganiserAnalytics_createServerFn_handler,
  getReferralAnalytics_createServerFn_handler,
  getSponsorAnalytics_createServerFn_handler
};
