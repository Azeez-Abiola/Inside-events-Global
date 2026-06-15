import { c as createServerRpc } from "./createServerRpc-BjI2KYkQ.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { s as supabaseAdmin } from "./client.server-BxqV6VTA.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/ws.mjs";
import { o as objectType, s as stringType, n as numberType, e as enumType } from "../_libs/zod.mjs";
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
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
const adminGetRevenue_createServerFn_handler = createServerRpc({
  id: "81ca7a1d8392165358f841217013976c7d533818991793985984c833427ac4f6",
  name: "adminGetRevenue",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminGetRevenue.__executeServer(opts));
const adminGetRevenue = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(adminGetRevenue_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const admin = roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin");
  if (!admin) throw new Error("Forbidden");
  const [{
    data: deals
  }, {
    data: partners
  }, {
    data: configs
  }, {
    data: flags
  }, {
    data: forms
  }] = await Promise.all([supabaseAdmin.from("deals").select("id, commitment_form_id, event_id, organiser_id, sponsor_user_id, referral_partner_id, status, deal_value_native, deal_currency, deal_value_usd, abw_commission_usd, abw_commission_native, referral_commission_usd, referral_commission_native, referral_commission_paid, created_at, updated_at, paid_at").order("updated_at", {
    ascending: false
  }), supabaseAdmin.from("referral_partner_profiles").select("user_id, full_name, deals_closed, total_earned_usd, commission_tier, payout_currency"), supabaseAdmin.from("commission_config").select("event_type_category, standard_rate, premium_rate, abw_platform_rate").order("event_type_category"), supabaseAdmin.from("fraud_flags").select("id, status").eq("status", "open"), supabaseAdmin.from("commitment_forms").select("id, event_id, company_name, contact_name, currency, budget_range_min, budget_range_max, referral_partner_id, partnership_type, fraud_flags, created_at").order("created_at", {
    ascending: false
  })]);
  const dealtFormIds = new Set((deals ?? []).map((d) => d.commitment_form_id).filter(Boolean));
  const inquiries = (forms ?? []).filter((f) => !dealtFormIds.has(f.id));
  const eventIds = Array.from(new Set([...(deals ?? []).map((d) => d.event_id), ...inquiries.map((f) => f.event_id)].filter(Boolean)));
  let eventMap = {};
  if (eventIds.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, name, slug, city, country").in("id", eventIds);
    for (const e of evs ?? []) eventMap[e.id] = e;
  }
  const partnerOwed = {};
  const partnerPaid = {};
  for (const d of deals ?? []) {
    if (!d.referral_partner_id) continue;
    const v = Number(d.referral_commission_usd ?? 0);
    if (d.referral_commission_paid) partnerPaid[d.referral_partner_id] = (partnerPaid[d.referral_partner_id] ?? 0) + v;
    else if (d.status === "payment_received") partnerOwed[d.referral_partner_id] = (partnerOwed[d.referral_partner_id] ?? 0) + v;
  }
  const totals = (deals ?? []).reduce((acc, d) => {
    if (d.status === "payment_received") {
      acc.gmv += Number(d.deal_value_usd ?? 0);
      acc.abw += Number(d.abw_commission_usd ?? 0);
      acc.refOwed += Number(d.referral_commission_usd ?? 0) - (d.referral_commission_paid ? Number(d.referral_commission_usd ?? 0) : 0);
    }
    if (!["payment_received", "closed_lost", "cancelled"].includes(d.status)) acc.open += 1;
    return acc;
  }, {
    gmv: 0,
    abw: 0,
    refOwed: 0,
    open: 0
  });
  return {
    deals: deals ?? [],
    inquiries,
    events: eventMap,
    partners: (partners ?? []).map((p) => ({
      ...p,
      owed_usd: partnerOwed[p.user_id] ?? 0,
      paid_usd_running: partnerPaid[p.user_id] ?? 0
    })),
    commissionConfig: configs ?? [],
    fraudFlagsOpen: flags?.length ?? 0,
    totals
  };
});
const adminCreateDeal_createServerFn_handler = createServerRpc({
  id: "602acee96031805e8f458a67b8a9fde42a17a1d7a29d7cc052803fe615bde217",
  name: "adminCreateDeal",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminCreateDeal.__executeServer(opts));
const adminCreateDeal = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  commitment_form_id: stringType().uuid()
}).parse(d)).handler(adminCreateDeal_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  const {
    data: cf
  } = await supabaseAdmin.from("commitment_forms").select("*").eq("id", data.commitment_form_id).single();
  if (!cf) throw new Error("Form not found");
  const {
    data: ev
  } = await supabaseAdmin.from("events").select("organiser_id").eq("id", cf.event_id).single();
  const {
    data: deal,
    error
  } = await supabaseAdmin.from("deals").insert({
    commitment_form_id: cf.id,
    event_id: cf.event_id,
    organiser_id: ev.organiser_id,
    sponsor_user_id: cf.sponsor_user_id,
    referral_partner_id: cf.referral_partner_id,
    deal_currency: cf.currency,
    status: "inquiry_received"
  }).select("id").single();
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("deal_status_history").insert({
    deal_id: deal.id,
    from_status: null,
    to_status: "inquiry_received",
    changed_by: userId
  });
  return {
    id: deal.id
  };
});
const UpdateDealInput = objectType({
  id: stringType().uuid(),
  status: stringType().min(2).max(40),
  deal_value_native: numberType().nonnegative().optional(),
  note: stringType().max(500).optional()
});
const adminUpdateDealStatus_createServerFn_handler = createServerRpc({
  id: "86c9680083ce565b9225bb6d8fc5e0f5e5b584b13b52864a0878fe3c2eacf2da",
  name: "adminUpdateDealStatus",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminUpdateDealStatus.__executeServer(opts));
const adminUpdateDealStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => UpdateDealInput.parse(d)).handler(adminUpdateDealStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  const {
    data: deal
  } = await supabaseAdmin.from("deals").select("*").eq("id", data.id).single();
  if (!deal) throw new Error("Deal not found");
  const update = {
    status: data.status,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  if (data.deal_value_native !== void 0) update.deal_value_native = data.deal_value_native;
  if (data.status === "payment_received") {
    const value = data.deal_value_native ?? Number(deal.deal_value_native ?? 0);
    const {
      data: rate
    } = await supabaseAdmin.from("exchange_rates").select("ngn_rate, gbp_rate, eur_rate").order("fetched_at", {
      ascending: false
    }).limit(1).maybeSingle();
    const toUsd = (n, c) => {
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
    update.paid_at = (/* @__PURE__ */ new Date()).toISOString();
  }
  const {
    error
  } = await supabaseAdmin.from("deals").update(update).eq("id", data.id);
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("deal_status_history").insert({
    deal_id: data.id,
    from_status: deal.status,
    to_status: data.status,
    changed_by: userId,
    note: data.note
  });
  const recipients = [deal.organiser_id, deal.sponsor_user_id, deal.referral_partner_id].filter(Boolean);
  if (recipients.length) {
    await supabaseAdmin.from("notifications").insert(recipients.map((uid) => ({
      user_id: uid,
      type: "deal_status_change",
      title: `Deal status: ${data.status.replace(/_/g, " ")}`,
      body: data.note ?? `Deal moved to ${data.status}`,
      data: {
        deal_id: data.id
      }
    })));
  }
  return {
    ok: true
  };
});
const adminMarkCommissionPaid_createServerFn_handler = createServerRpc({
  id: "0f855a171ed246e8b1955df54acc0cd05eadb03372f1be0d3d359a4067939eba",
  name: "adminMarkCommissionPaid",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminMarkCommissionPaid.__executeServer(opts));
const adminMarkCommissionPaid = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  deal_id: stringType().uuid()
}).parse(d)).handler(adminMarkCommissionPaid_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  const {
    data: deal
  } = await supabaseAdmin.from("deals").select("referral_partner_id, referral_commission_native, deal_currency").eq("id", data.deal_id).single();
  if (!deal?.referral_partner_id) throw new Error("Deal has no referral partner");
  await supabaseAdmin.from("deals").update({
    referral_commission_paid: true,
    referral_commission_paid_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", data.deal_id);
  await supabaseAdmin.from("notifications").insert({
    user_id: deal.referral_partner_id,
    type: "commission_paid",
    title: "Your commission has been paid",
    body: `${deal.deal_currency} ${Number(deal.referral_commission_native ?? 0).toLocaleString()}`,
    data: {
      deal_id: data.deal_id
    }
  });
  return {
    ok: true
  };
});
const ConfigInput = objectType({
  event_type_category: stringType().min(1).max(120),
  standard_rate: numberType().min(0).max(1),
  premium_rate: numberType().min(0).max(1),
  abw_platform_rate: numberType().min(0).max(1)
});
const adminUpsertCommissionConfig_createServerFn_handler = createServerRpc({
  id: "9326c606063e9a548468624b238f828df611daa7c9c0e34ae1991b0d6de385be",
  name: "adminUpsertCommissionConfig",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminUpsertCommissionConfig.__executeServer(opts));
const adminUpsertCommissionConfig = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ConfigInput.parse(d)).handler(adminUpsertCommissionConfig_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  const {
    error
  } = await supabaseAdmin.from("commission_config").upsert({
    ...data,
    updated_by: userId,
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  }, {
    onConflict: "event_type_category"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const RateInput = objectType({
  ngn_rate: numberType().positive(),
  gbp_rate: numberType().positive(),
  eur_rate: numberType().positive()
});
const adminUpdateRates_createServerFn_handler = createServerRpc({
  id: "8cf511bf178f6e4cb393939fcee2ae7882e3a31ff314cff7ab48ff03be5b472b",
  name: "adminUpdateRates",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminUpdateRates.__executeServer(opts));
const adminUpdateRates = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => RateInput.parse(d)).handler(adminUpdateRates_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  const {
    error
  } = await supabaseAdmin.from("exchange_rates").insert({
    ...data,
    source: "manual_admin"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const adminListFraudFlags_createServerFn_handler = createServerRpc({
  id: "b5ab3e766907b91c0fca6be21bb4214f61804efb05f791be4a9e3a63e45908f7",
  name: "adminListFraudFlags",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminListFraudFlags.__executeServer(opts));
const adminListFraudFlags = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(adminListFraudFlags_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  const {
    data
  } = await supabaseAdmin.from("fraud_flags").select("*").order("created_at", {
    ascending: false
  });
  return {
    flags: data ?? []
  };
});
const adminResolveFraudFlag_createServerFn_handler = createServerRpc({
  id: "9f0db7e338b9db1ba9fb9b73ebbfa55f366f432fde9eae12f997070c8e71020f",
  name: "adminResolveFraudFlag",
  filename: "src/lib/deals.functions.ts"
}, (opts) => adminResolveFraudFlag.__executeServer(opts));
const adminResolveFraudFlag = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["actioned", "dismissed"])
}).parse(d)).handler(adminResolveFraudFlag_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: roles
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "abw_admin" || r.role === "super_admin")) throw new Error("Forbidden");
  await supabaseAdmin.from("fraud_flags").update({
    status: data.status,
    reviewed_at: (/* @__PURE__ */ new Date()).toISOString(),
    reviewed_by: userId
  }).eq("id", data.id);
  return {
    ok: true
  };
});
const getOrganiserPipeline_createServerFn_handler = createServerRpc({
  id: "a176f5f098210d802c275bd58d6cdf44a3f65500b13ff4625959b39cff967a42",
  name: "getOrganiserPipeline",
  filename: "src/lib/deals.functions.ts"
}, (opts) => getOrganiserPipeline.__executeServer(opts));
const getOrganiserPipeline = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getOrganiserPipeline_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const {
    data: events
  } = await supabaseAdmin.from("events").select("id, name, slug, status, view_count, save_count, inquiry_count, banner_image_url, start_date, city, country").eq("organiser_id", userId).order("created_at", {
    ascending: false
  });
  const eventIds = (events ?? []).map((e) => e.id);
  let forms = [];
  let deals = [];
  if (eventIds.length) {
    const [f, d] = await Promise.all([supabaseAdmin.from("commitment_forms").select("id, event_id, company_name, contact_name, sponsor_user_id, currency, budget_range_min, budget_range_max, tier_id, submitted_at, referral_partner_id").in("event_id", eventIds).order("submitted_at", {
      ascending: false
    }), supabaseAdmin.from("deals").select("id, event_id, commitment_form_id, status, deal_value_native, deal_currency, referral_partner_id, updated_at").in("event_id", eventIds)]);
    forms = f.data ?? [];
    deals = d.data ?? [];
  }
  return {
    events: events ?? [],
    forms,
    deals
  };
});
const getSponsorDashboard_createServerFn_handler = createServerRpc({
  id: "fef50299be097d17e74e127c994d8f98f39c270cd2e7cbd2235377880716a6eb",
  name: "getSponsorDashboard",
  filename: "src/lib/deals.functions.ts"
}, (opts) => getSponsorDashboard.__executeServer(opts));
const getSponsorDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getSponsorDashboard_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const [{
    data: forms
  }, {
    data: saves
  }, {
    data: fresh
  }] = await Promise.all([supabaseAdmin.from("commitment_forms").select("id, event_id, currency, budget_range_min, budget_range_max, tier_id, submitted_at").eq("sponsor_user_id", userId).order("submitted_at", {
    ascending: false
  }), supabaseAdmin.from("event_saves").select("event_id, created_at").eq("user_id", userId), supabaseAdmin.from("events").select("id, slug, name, banner_image_url, start_date, city, country, primary_sector").in("status", ["approved", "listed"]).order("created_at", {
    ascending: false
  }).limit(6)]);
  const ids = Array.from(/* @__PURE__ */ new Set([...(forms ?? []).map((f) => f.event_id), ...(saves ?? []).map((s) => s.event_id)]));
  let evMap = {};
  if (ids.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, slug, name, banner_image_url, start_date, city, country, organiser_id").in("id", ids);
    for (const e of evs ?? []) evMap[e.id] = e;
  }
  return {
    forms: forms ?? [],
    saves: saves ?? [],
    freshEvents: fresh ?? [],
    eventMap: evMap
  };
});
export {
  adminCreateDeal_createServerFn_handler,
  adminGetRevenue_createServerFn_handler,
  adminListFraudFlags_createServerFn_handler,
  adminMarkCommissionPaid_createServerFn_handler,
  adminResolveFraudFlag_createServerFn_handler,
  adminUpdateDealStatus_createServerFn_handler,
  adminUpdateRates_createServerFn_handler,
  adminUpsertCommissionConfig_createServerFn_handler,
  getOrganiserPipeline_createServerFn_handler,
  getSponsorDashboard_createServerFn_handler
};
