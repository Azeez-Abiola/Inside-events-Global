import { c as createServerRpc } from "./createServerRpc-BjI2KYkQ.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { s as supabaseAdmin } from "./client.server-BxqV6VTA.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/ws.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
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
const rateMap = /* @__PURE__ */ new Map();
function checkRate(userId, max, windowMs) {
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
const generateReferralLink_createServerFn_handler = createServerRpc({
  id: "ead3463169d1c6c2301a516c0ab25d4ea7cb5d4f520ae2fb014b945fedea69fc",
  name: "generateReferralLink",
  filename: "src/lib/referrals.functions.ts"
}, (opts) => generateReferralLink.__executeServer(opts));
const generateReferralLink = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  event_id: stringType().uuid()
}).parse(d)).handler(generateReferralLink_createServerFn_handler, async ({
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
  if (!roles?.some((r) => r.role === "referral_partner")) {
    throw new Error("Only referral partners can generate links");
  }
  if (!checkRate(userId, 10, 60 * 60 * 1e3)) {
    throw new Error("Rate limit: too many links generated. Please wait and try again.");
  }
  const {
    data: existing
  } = await supabaseAdmin.from("referral_links").select("*").eq("referral_partner_id", userId).eq("event_id", data.event_id).maybeSingle();
  if (existing) {
    return {
      link: existing,
      reused: true
    };
  }
  const {
    data: ev
  } = await supabaseAdmin.from("events").select("id, name, event_type, status").eq("id", data.event_id).single();
  if (!ev || !["approved", "listed"].includes(ev.status)) {
    throw new Error("Event not available for referrals");
  }
  const {
    data: partnerProfile
  } = await supabaseAdmin.from("referral_partner_profiles").select("commission_tier").eq("user_id", userId).maybeSingle();
  const tier = partnerProfile?.commission_tier ?? "standard";
  const {
    data: cfg
  } = await supabaseAdmin.from("commission_config").select("standard_rate, premium_rate").eq("event_type_category", ev.event_type ?? "Default").maybeSingle();
  const {
    data: fallback
  } = await supabaseAdmin.from("commission_config").select("standard_rate, premium_rate").eq("event_type_category", "Default").maybeSingle();
  const rates = cfg ?? fallback;
  const commission_rate = tier === "premium" ? Number(rates?.premium_rate ?? 0.1) : Number(rates?.standard_rate ?? 0.07);
  let code = shortCode();
  for (let i = 0; i < 5; i++) {
    const {
      data: clash
    } = await supabaseAdmin.from("referral_links").select("id").eq("short_code", code).maybeSingle();
    if (!clash) break;
    code = shortCode();
  }
  const vouch_link_url = `/r/${code}`;
  const expires_at = new Date(Date.now() + 90 * 86400 * 1e3).toISOString();
  const {
    data: link,
    error
  } = await supabaseAdmin.from("referral_links").insert({
    referral_partner_id: userId,
    event_id: data.event_id,
    short_code: code,
    vouch_link_url,
    commission_rate,
    expires_at,
    status: "active"
  }).select("*").single();
  if (error) throw new Error(error.message);
  return {
    link,
    reused: false
  };
});
const trackReferralClick_createServerFn_handler = createServerRpc({
  id: "ed05c36660f54791bd4e669cb26f36e3ed11715414ab442a8da7583e2eacbdb7",
  name: "trackReferralClick",
  filename: "src/lib/referrals.functions.ts"
}, (opts) => trackReferralClick.__executeServer(opts));
const trackReferralClick = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  short_code: stringType().min(1).max(20),
  ua: stringType().max(500).optional(),
  referrer: stringType().max(500).optional()
}).parse(d)).handler(trackReferralClick_createServerFn_handler, async ({
  data
}) => {
  const {
    data: link
  } = await supabaseAdmin.from("referral_links").select("id, event_id, click_count").eq("short_code", data.short_code).maybeSingle();
  if (!link) return {
    ok: false,
    slug: null
  };
  await supabaseAdmin.from("referral_link_clicks").insert({
    referral_link_id: link.id,
    user_agent: data.ua,
    referrer: data.referrer
  });
  await supabaseAdmin.from("referral_links").update({
    click_count: (link.click_count ?? 0) + 1,
    last_clicked_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", link.id);
  const {
    data: ev
  } = await supabaseAdmin.from("events").select("slug").eq("id", link.event_id).single();
  return {
    ok: true,
    slug: ev?.slug ?? null,
    short_code: data.short_code
  };
});
const getReferralDashboard_createServerFn_handler = createServerRpc({
  id: "b4149100c84f1bf3fbb7367f903a1e8d2dc8c9da0e3f6f598728b27ff9ace4f8",
  name: "getReferralDashboard",
  filename: "src/lib/referrals.functions.ts"
}, (opts) => getReferralDashboard.__executeServer(opts));
const getReferralDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getReferralDashboard_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const [{
    data: links
  }, {
    data: deals
  }, {
    data: profile
  }] = await Promise.all([supabaseAdmin.from("referral_links").select("id, short_code, event_id, status, click_count, unique_click_count, conversion_count, commission_rate, expires_at, vouch_link_url, created_at").eq("referral_partner_id", userId).order("created_at", {
    ascending: false
  }), supabaseAdmin.from("deals").select("id, event_id, status, deal_value_native, deal_currency, referral_commission_native, referral_commission_usd, referral_commission_paid, referral_commission_paid_at, created_at").eq("referral_partner_id", userId), supabaseAdmin.from("referral_partner_profiles").select("commission_tier, deals_closed, total_earned_usd, payout_currency, igb_partner_badge").eq("user_id", userId).maybeSingle()]);
  const eventIds = Array.from(/* @__PURE__ */ new Set([...(links ?? []).map((l) => l.event_id), ...(deals ?? []).map((d) => d.event_id)]));
  let events = {};
  if (eventIds.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, name, slug, banner_image_url, start_date, city, country").in("id", eventIds);
    for (const e of evs ?? []) events[e.id] = e;
  }
  const totals = (deals ?? []).reduce((acc, d) => {
    const v = Number(d.referral_commission_usd ?? 0);
    if (d.referral_commission_paid) acc.paid += v;
    else if (d.status === "payment_received") acc.earned += v;
    else acc.pending += v;
    return acc;
  }, {
    earned: 0,
    pending: 0,
    paid: 0
  });
  return {
    profile,
    links: links ?? [],
    deals: deals ?? [],
    events,
    totals,
    stats: {
      linkCount: links?.length ?? 0,
      clickCount: (links ?? []).reduce((s, l) => s + (l.click_count ?? 0), 0),
      conversionCount: (links ?? []).reduce((s, l) => s + (l.conversion_count ?? 0), 0)
    }
  };
});
export {
  generateReferralLink_createServerFn_handler,
  getReferralDashboard_createServerFn_handler,
  trackReferralClick_createServerFn_handler
};
