import { f as createSsrRpc } from "./router-4-w4Upb_.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import { o as objectType, s as stringType, e as enumType, n as numberType } from "../_libs/zod.mjs";
const adminGetRevenue = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("81ca7a1d8392165358f841217013976c7d533818991793985984c833427ac4f6"));
const adminCreateDeal = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  commitment_form_id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("602acee96031805e8f458a67b8a9fde42a17a1d7a29d7cc052803fe615bde217"));
const UpdateDealInput = objectType({
  id: stringType().uuid(),
  status: stringType().min(2).max(40),
  deal_value_native: numberType().nonnegative().optional(),
  note: stringType().max(500).optional()
});
const adminUpdateDealStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => UpdateDealInput.parse(d)).handler(createSsrRpc("86c9680083ce565b9225bb6d8fc5e0f5e5b584b13b52864a0878fe3c2eacf2da"));
const adminMarkCommissionPaid = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  deal_id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("0f855a171ed246e8b1955df54acc0cd05eadb03372f1be0d3d359a4067939eba"));
const ConfigInput = objectType({
  event_type_category: stringType().min(1).max(120),
  standard_rate: numberType().min(0).max(1),
  premium_rate: numberType().min(0).max(1),
  abw_platform_rate: numberType().min(0).max(1)
});
const adminUpsertCommissionConfig = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ConfigInput.parse(d)).handler(createSsrRpc("9326c606063e9a548468624b238f828df611daa7c9c0e34ae1991b0d6de385be"));
const RateInput = objectType({
  ngn_rate: numberType().positive(),
  gbp_rate: numberType().positive(),
  eur_rate: numberType().positive()
});
const adminUpdateRates = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => RateInput.parse(d)).handler(createSsrRpc("8cf511bf178f6e4cb393939fcee2ae7882e3a31ff314cff7ab48ff03be5b472b"));
const adminListFraudFlags = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("b5ab3e766907b91c0fca6be21bb4214f61804efb05f791be4a9e3a63e45908f7"));
const adminResolveFraudFlag = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid(),
  status: enumType(["actioned", "dismissed"])
}).parse(d)).handler(createSsrRpc("9f0db7e338b9db1ba9fb9b73ebbfa55f366f432fde9eae12f997070c8e71020f"));
const getOrganiserPipeline = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("a176f5f098210d802c275bd58d6cdf44a3f65500b13ff4625959b39cff967a42"));
const getSponsorDashboard = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("fef50299be097d17e74e127c994d8f98f39c270cd2e7cbd2235377880716a6eb"));
export {
  adminCreateDeal as a,
  adminGetRevenue as b,
  adminListFraudFlags as c,
  adminMarkCommissionPaid as d,
  adminResolveFraudFlag as e,
  adminUpdateDealStatus as f,
  adminUpdateRates as g,
  adminUpsertCommissionConfig as h,
  getOrganiserPipeline as i,
  getSponsorDashboard as j
};
