import { c as createServerRpc } from "./createServerRpc-BjI2KYkQ.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { s as supabaseAdmin } from "./client.server-BxqV6VTA.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/ws.mjs";
import { o as objectType, n as numberType, e as enumType, c as booleanType, s as stringType, b as arrayType, l as literalType } from "../_libs/zod.mjs";
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
const FilterInput = objectType({
  q: stringType().max(120).optional(),
  event_types: arrayType(stringType()).max(40).optional(),
  sectors: arrayType(stringType()).max(40).optional(),
  countries: arrayType(stringType()).max(60).optional(),
  city: stringType().max(80).optional(),
  format: enumType(["all", "in_person", "virtual", "hybrid"]).default("all"),
  date_from: stringType().optional(),
  date_to: stringType().optional(),
  audience_min: numberType().int().min(0).optional(),
  audience_max: numberType().int().min(0).optional(),
  vetted_only: booleanType().default(true),
  decision_makers: booleanType().default(false),
  sort: enumType(["newest", "soonest", "audience"]).default("newest"),
  page: numberType().int().min(1).default(1),
  per_page: numberType().int().min(1).max(48).default(12)
});
const FacetInput = objectType({
  vetted_only: booleanType().default(true),
  decision_makers: booleanType().default(false)
});
function uniqueSorted(values) {
  return [...new Set(values.filter((v) => !!v && v.trim()))].sort((a, b) => a.localeCompare(b));
}
const getMarketplaceFilterOptions_createServerFn_handler = createServerRpc({
  id: "c1172298adadc561e270e73aa1ba7c4f4f1645af6c4b0e9e61f4d9b93e224cb0",
  name: "getMarketplaceFilterOptions",
  filename: "src/lib/marketplace.functions.ts"
}, (opts) => getMarketplaceFilterOptions.__executeServer(opts));
const getMarketplaceFilterOptions = createServerFn({
  method: "POST"
}).inputValidator((d) => FacetInput.parse(d ?? {})).handler(getMarketplaceFilterOptions_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("events").select("event_type, primary_sector, country, format, ige_vetted, decision_makers_pct").in("status", ["approved", "listed"]);
  if (data.vetted_only) q = q.eq("ige_vetted", true);
  if (data.decision_makers) q = q.gte("decision_makers_pct", 30);
  const [{
    data: events,
    error
  }, {
    data: allLive,
    error: allErr
  }] = await Promise.all([q, supabaseAdmin.from("events").select("ige_vetted, decision_makers_pct").in("status", ["approved", "listed"])]);
  if (error) throw new Error(error.message);
  if (allErr) throw new Error(allErr.message);
  const rows = events ?? [];
  const live = allLive ?? [];
  return {
    event_types: uniqueSorted(rows.map((e) => e.event_type)),
    sectors: uniqueSorted(rows.map((e) => e.primary_sector)),
    countries: uniqueSorted(rows.map((e) => e.country)),
    formats: uniqueSorted(rows.map((e) => e.format)),
    has_vetted_events: live.some((e) => e.ige_vetted),
    has_non_vetted_events: live.some((e) => !e.ige_vetted),
    has_decision_maker_events: live.some((e) => (e.decision_makers_pct ?? 0) >= 30)
  };
});
const listMarketplaceEvents_createServerFn_handler = createServerRpc({
  id: "9256a6366373c9ce46a2ca6417d26f9458c300a6d5624549a687d46a0e3d94ce",
  name: "listMarketplaceEvents",
  filename: "src/lib/marketplace.functions.ts"
}, (opts) => listMarketplaceEvents.__executeServer(opts));
const listMarketplaceEvents = createServerFn({
  method: "POST"
}).inputValidator((d) => FilterInput.parse(d)).handler(listMarketplaceEvents_createServerFn_handler, async ({
  data
}) => {
  let q = supabaseAdmin.from("events").select("id, slug, name, event_type, format, start_date, end_date, city, country, primary_sector, attendance_size, decision_makers_pct, banner_image_url, ige_vetted, currency, created_at", {
    count: "exact"
  }).in("status", ["approved", "listed"]);
  if (data.vetted_only) q = q.eq("ige_vetted", true);
  if (data.decision_makers) q = q.gte("decision_makers_pct", 30);
  if (data.event_types?.length) q = q.in("event_type", data.event_types);
  if (data.sectors?.length) q = q.in("primary_sector", data.sectors);
  if (data.countries?.length) q = q.in("country", data.countries);
  if (data.city) q = q.ilike("city", `%${data.city}%`);
  if (data.format !== "all") q = q.eq("format", data.format);
  if (data.date_from) q = q.gte("start_date", data.date_from);
  if (data.date_to) q = q.lte("start_date", data.date_to);
  if (data.audience_min !== void 0) q = q.gte("attendance_size", data.audience_min);
  if (data.audience_max !== void 0) q = q.lte("attendance_size", data.audience_max);
  if (data.q) {
    const term = data.q.replace(/[%_]/g, " ");
    q = q.or(`name.ilike.%${term}%,event_theme.ilike.%${term}%,city.ilike.%${term}%,primary_sector.ilike.%${term}%`);
  }
  if (data.sort === "newest") q = q.order("created_at", {
    ascending: false
  });
  else if (data.sort === "soonest") q = q.order("start_date", {
    ascending: true,
    nullsFirst: false
  });
  else q = q.order("attendance_size", {
    ascending: false,
    nullsFirst: false
  });
  const from = (data.page - 1) * data.per_page;
  q = q.range(from, from + data.per_page - 1);
  const {
    data: events,
    error,
    count
  } = await q;
  if (error) throw new Error(error.message);
  const ids = (events ?? []).map((e) => e.id);
  let priceMap = {};
  if (ids.length) {
    const {
      data: tiers
    } = await supabaseAdmin.from("event_sponsorship_tiers").select("event_id, price, currency").in("event_id", ids).order("price", {
      ascending: true
    });
    for (const t of tiers ?? []) {
      if (!priceMap[t.event_id]) priceMap[t.event_id] = {
        price: Number(t.price),
        currency: t.currency
      };
    }
  }
  return {
    events: (events ?? []).map((e) => ({
      ...e,
      starting: priceMap[e.id] ?? null
    })),
    total: count ?? 0,
    page: data.page,
    per_page: data.per_page
  };
});
const getPublicEventBySlug_createServerFn_handler = createServerRpc({
  id: "1668ff3b3e1c42130c27c0ae4c888add310a9d691e81f3b3cceaffef25eddc54",
  name: "getPublicEventBySlug",
  filename: "src/lib/marketplace.functions.ts"
}, (opts) => getPublicEventBySlug.__executeServer(opts));
const getPublicEventBySlug = createServerFn({
  method: "POST"
}).inputValidator((d) => objectType({
  slug: stringType().min(1).max(200)
}).parse(d)).handler(getPublicEventBySlug_createServerFn_handler, async ({
  data
}) => {
  const {
    data: ev,
    error
  } = await supabaseAdmin.from("events").select("*").eq("slug", data.slug).in("status", ["approved", "listed"]).maybeSingle();
  if (error) throw new Error(error.message);
  if (!ev) return {
    event: null,
    tiers: [],
    organiser: null
  };
  const [{
    data: tiers
  }, {
    data: organiser
  }] = await Promise.all([supabaseAdmin.from("event_sponsorship_tiers").select("*").eq("event_id", ev.id).order("display_order"), ev.organiser_id ? supabaseAdmin.from("organiser_profiles").select("org_name, logo_url, bio, website, track_record, event_history, past_sponsor_logos").eq("user_id", ev.organiser_id).maybeSingle() : Promise.resolve({
    data: null
  })]);
  void supabaseAdmin.rpc;
  void supabaseAdmin.from("events").update({
    view_count: (ev.view_count ?? 0) + 1
  }).eq("id", ev.id);
  return {
    event: ev,
    tiers: tiers ?? [],
    organiser
  };
});
const getCurrentRates_createServerFn_handler = createServerRpc({
  id: "4d46fbbb87fad19441d3c5b936df4fab5118283cd438d6ae2d190fa2fc811cb7",
  name: "getCurrentRates",
  filename: "src/lib/marketplace.functions.ts"
}, (opts) => getCurrentRates.__executeServer(opts));
const getCurrentRates = createServerFn({
  method: "GET"
}).handler(getCurrentRates_createServerFn_handler, async () => {
  const {
    data,
    error
  } = await supabaseAdmin.from("exchange_rates").select("ngn_rate, gbp_rate, eur_rate, fetched_at").order("fetched_at", {
    ascending: false
  }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  return {
    rates: data
  };
});
const CommitInput = objectType({
  event_id: stringType().uuid(),
  readiness_confirmed: literalType(true),
  contact_name: stringType().min(2).max(120),
  contact_title: stringType().max(120).optional().nullable(),
  company_name: stringType().min(1).max(160),
  company_linkedin_url: stringType().url().max(300),
  brand_region: stringType().max(80).optional().nullable(),
  currency: enumType(["NGN", "USD", "GBP", "EUR"]),
  partnership_type: enumType(["cash", "in_kind", "co_creation", "jv"]).optional().nullable(),
  budget_range_min: numberType().nonnegative().optional().nullable(),
  budget_range_max: numberType().nonnegative().optional().nullable(),
  expected_roi: stringType().max(1500).optional().nullable(),
  proposed_start_date: stringType().optional().nullable(),
  tier_id: stringType().uuid().optional().nullable(),
  custom_requirements: stringType().max(2e3).optional().nullable(),
  referral_short_code: stringType().max(20).optional().nullable()
});
function domainOf(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}
const submitCommitmentForm_createServerFn_handler = createServerRpc({
  id: "d6eb976c170ad97ee3e2f91bd93df565f5b6661cbc351838e1bb4bbf17e6f45a",
  name: "submitCommitmentForm",
  filename: "src/lib/marketplace.functions.ts"
}, (opts) => submitCommitmentForm.__executeServer(opts));
const submitCommitmentForm = createServerFn({
  method: "POST"
}).inputValidator((d) => CommitInput.parse(d)).handler(submitCommitmentForm_createServerFn_handler, async ({
  data
}) => {
  const {
    data: ev,
    error: evErr
  } = await supabaseAdmin.from("events").select("id, name, organiser_id, status, inquiry_count").eq("id", data.event_id).single();
  if (evErr) throw new Error(evErr.message);
  if (!["approved", "listed"].includes(ev.status)) throw new Error("Event not accepting inquiries");
  const {
    data: rate
  } = await supabaseAdmin.from("exchange_rates").select("ngn_rate, gbp_rate, eur_rate").order("fetched_at", {
    ascending: false
  }).limit(1).maybeSingle();
  let referral_link_id = null;
  let referral_partner_id = null;
  const fraudFlags = [];
  if (data.referral_short_code) {
    const {
      data: link
    } = await supabaseAdmin.from("referral_links").select("id, referral_partner_id, status, expires_at, event_id").eq("short_code", data.referral_short_code).maybeSingle();
    if (link && link.event_id === data.event_id && link.status === "active") {
      referral_link_id = link.id;
      referral_partner_id = link.referral_partner_id;
      const {
        data: partnerProfile
      } = await supabaseAdmin.from("profiles").select("email_domain, linkedin_employer").eq("id", link.referral_partner_id).maybeSingle();
      const linkedinDomain = domainOf(data.company_linkedin_url);
      const employerMatch = partnerProfile?.linkedin_employer && data.company_name.toLowerCase().includes(partnerProfile.linkedin_employer.toLowerCase());
      const domainMatch = partnerProfile?.email_domain && linkedinDomain && linkedinDomain.includes(partnerProfile.email_domain);
      if (employerMatch || domainMatch) {
        fraudFlags.push("self_referral");
      }
    }
  }
  let sponsor_user_id = null;
  try {
    const {
      getRequestHeader
    } = await import("./server-C4w-rPnA.mjs");
    const auth = getRequestHeader("Authorization");
    if (auth?.startsWith("Bearer ")) {
      const {
        data: u
      } = await supabaseAdmin.auth.getUser(auth.slice(7));
      sponsor_user_id = u.user?.id ?? null;
    }
  } catch {
  }
  const {
    data: cf,
    error
  } = await supabaseAdmin.from("commitment_forms").insert({
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
    rate_locked_at: (/* @__PURE__ */ new Date()).toISOString(),
    fraud_flags: fraudFlags
  }).select("id").single();
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("events").update({
    inquiry_count: (ev.inquiry_count ?? 0) + 1
  }).eq("id", ev.id);
  if (ev.organiser_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: ev.organiser_id,
      type: "new_inquiry",
      title: `New sponsor interest in ${ev.name}`,
      body: `${data.company_name} just submitted a commitment form.`,
      data: {
        event_id: ev.id,
        commitment_form_id: cf.id
      }
    });
  }
  if (referral_partner_id) {
    await supabaseAdmin.from("notifications").insert({
      user_id: referral_partner_id,
      type: "referral_conversion",
      title: `Conversion on your referral link`,
      body: `A sponsor submitted a commitment form for ${ev.name}.`,
      data: {
        event_id: ev.id,
        commitment_form_id: cf.id
      }
    });
    await supabaseAdmin.rpc;
    await supabaseAdmin.from("referral_links").update({
      conversion_count: 1
    }).eq("id", referral_link_id);
  }
  if (fraudFlags.length) {
    await supabaseAdmin.from("fraud_flags").insert({
      flagged_user_id: referral_partner_id,
      flag_type: "self_referral",
      description: `Self-referral suspected for ${data.company_name} on ${ev.name}`,
      related_deal_id: null,
      related_referral_link_id: referral_link_id
    });
  }
  return {
    ok: true,
    id: cf.id
  };
});
const toggleSaveEvent_createServerFn_handler = createServerRpc({
  id: "26a484c867491ff5af90f0fef8baab21a5583140c090936932aba3722de28566",
  name: "toggleSaveEvent",
  filename: "src/lib/marketplace.functions.ts"
}, (opts) => toggleSaveEvent.__executeServer(opts));
const toggleSaveEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  event_id: stringType().uuid()
}).parse(d)).handler(toggleSaveEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: existing
  } = await supabase.from("event_saves").select("id").eq("user_id", userId).eq("event_id", data.event_id).maybeSingle();
  if (existing) {
    await supabase.from("event_saves").delete().eq("id", existing.id);
    return {
      saved: false
    };
  }
  await supabase.from("event_saves").insert({
    user_id: userId,
    event_id: data.event_id
  });
  return {
    saved: true
  };
});
export {
  getCurrentRates_createServerFn_handler,
  getMarketplaceFilterOptions_createServerFn_handler,
  getPublicEventBySlug_createServerFn_handler,
  listMarketplaceEvents_createServerFn_handler,
  submitCommitmentForm_createServerFn_handler,
  toggleSaveEvent_createServerFn_handler
};
