import { c as createServerRpc } from "./createServerRpc-BulwCtAy.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, l as literalType, n as numberType, b as arrayType, e as enumType } from "../_libs/zod.mjs";
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
const OrganiserInput = objectType({
  org_name: stringType().trim().min(1).max(160),
  bio: stringType().trim().max(1e3).optional().nullable(),
  website: stringType().trim().url().max(300).optional().nullable().or(literalType("").transform(() => null)),
  logo_url: stringType().trim().max(500).optional().nullable(),
  event_history: stringType().trim().max(1e3).optional().nullable()
});
const upsertOrganiserProfile_createServerFn_handler = createServerRpc({
  id: "bc56a692c5935f1226453e89e08fe60526b5d6aaeb7ee1659871e2fe9b363547",
  name: "upsertOrganiserProfile",
  filename: "src/lib/profile.functions.ts"
}, (opts) => upsertOrganiserProfile.__executeServer(opts));
const upsertOrganiserProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => OrganiserInput.parse(d)).handler(upsertOrganiserProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("organiser_profiles").upsert({
    user_id: userId,
    ...data
  }, {
    onConflict: "user_id"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const SponsorInput = objectType({
  brand_name: stringType().trim().min(1).max(160),
  industry: stringType().trim().max(120).optional().nullable(),
  company_size: stringType().trim().max(40).optional().nullable(),
  hq_country: stringType().trim().max(80).optional().nullable(),
  hq_city: stringType().trim().max(80).optional().nullable(),
  target_geographies: arrayType(stringType()).max(20).default([]),
  sponsorship_sectors: arrayType(stringType()).max(20).default([]),
  audience_types: arrayType(stringType()).max(20).default([]),
  budget_range_min: numberType().nonnegative().optional().nullable(),
  budget_range_max: numberType().nonnegative().optional().nullable(),
  preferred_currency: stringType().min(3).max(3).default("USD")
});
const upsertSponsorProfile_createServerFn_handler = createServerRpc({
  id: "018c1456792c2aa5b53d8e429e290e58b6c0668c321e32e846ffce7e77641d79",
  name: "upsertSponsorProfile",
  filename: "src/lib/profile.functions.ts"
}, (opts) => upsertSponsorProfile.__executeServer(opts));
const upsertSponsorProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SponsorInput.parse(d)).handler(upsertSponsorProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    error
  } = await supabase.from("sponsor_profiles").upsert({
    user_id: userId,
    ...data
  }, {
    onConflict: "user_id"
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const ReferralInput = objectType({
  full_name: stringType().trim().min(1).max(160),
  professional_title: stringType().trim().max(160).optional().nullable(),
  sector_expertise: arrayType(stringType()).max(20).default([]),
  professional_bg: stringType().trim().max(1500).optional().nullable(),
  sponsor_network_desc: stringType().trim().max(1500).optional().nullable(),
  payout_currency: enumType(["NGN", "USD", "GBP", "EUR"]).default("NGN"),
  linkedin_url: stringType().trim().url().max(300).optional().nullable().or(literalType("").transform(() => null))
});
const upsertReferralProfile_createServerFn_handler = createServerRpc({
  id: "fac5f4305f47b0cb03546157f8c0cc1d3bd175e34f487058fd818db4ddd6b96d",
  name: "upsertReferralProfile",
  filename: "src/lib/profile.functions.ts"
}, (opts) => upsertReferralProfile.__executeServer(opts));
const upsertReferralProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ReferralInput.parse(d)).handler(upsertReferralProfile_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    linkedin_url,
    ...rest
  } = data;
  const [{
    error: pErr
  }, {
    error: rErr
  }] = await Promise.all([supabase.from("referral_partner_profiles").upsert({
    user_id: userId,
    ...rest
  }, {
    onConflict: "user_id"
  }), linkedin_url ? supabase.from("profiles").update({
    linkedin_url
  }).eq("id", userId) : Promise.resolve({
    error: null
  })]);
  if (pErr) throw new Error(pErr.message);
  if (rErr) throw new Error(rErr.message);
  return {
    ok: true
  };
});
const getMyProfileSummary_createServerFn_handler = createServerRpc({
  id: "edcbfc75ecea8286e696e8e6da12836411ed43cddeee15cf9ddc241705fd7a85",
  name: "getMyProfileSummary",
  filename: "src/lib/profile.functions.ts"
}, (opts) => getMyProfileSummary.__executeServer(opts));
const getMyProfileSummary = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyProfileSummary_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const [{
    data: profile
  }, {
    data: roles
  }, {
    data: org
  }, {
    data: sp
  }, {
    data: ref
  }] = await Promise.all([supabase.from("profiles").select("*").eq("id", userId).single(), supabase.from("user_roles").select("role").eq("user_id", userId), supabase.from("organiser_profiles").select("*").eq("user_id", userId).maybeSingle(), supabase.from("sponsor_profiles").select("*").eq("user_id", userId).maybeSingle(), supabase.from("referral_partner_profiles").select("*").eq("user_id", userId).maybeSingle()]);
  return {
    profile,
    roles: (roles ?? []).map((r) => r.role),
    organiser: org,
    sponsor: sp,
    referral: ref
  };
});
export {
  getMyProfileSummary_createServerFn_handler,
  upsertOrganiserProfile_createServerFn_handler,
  upsertReferralProfile_createServerFn_handler,
  upsertSponsorProfile_createServerFn_handler
};
