import { e as createSsrRpc } from "./router-CyTgVp-T.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { o as objectType, s as stringType, r as recordType, a as anyType, n as numberType, c as booleanType, b as arrayType } from "../_libs/zod.mjs";
const getMyEvents = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6801645af7dd2ad598c49b72a940403a6ab46fe7842286325c6435cdf5001765"));
const createEventDraft = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("5d294d909dfaf7a5ae1e33f79c305790f333030cba6ef23e70c6192da9f6c9a3"));
const getEventForEdit = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("0c509dff0a1c1b41fda5f8b27c3dd992bb456531f6faa537ddca51c5b1cf5cdc"));
const AUTOSAVE_ALLOWED = /* @__PURE__ */ new Set([
  // Basics
  "name",
  "event_type",
  "format",
  "start_date",
  "end_date",
  "country",
  "city",
  "venue",
  "website",
  // Contacts
  "organiser_contact_name",
  "organiser_contact_role",
  "organiser_contact_email",
  "organiser_contact_phone",
  // Track record
  "years_running_event",
  "past_editions",
  "attendance_size",
  // Audience
  "primary_audience",
  "audience_seniority",
  "decision_makers_pct",
  "geographic_mix",
  // Sector & theme
  "primary_sector",
  "secondary_sector",
  "event_theme",
  // Sponsorship economics
  "min_sponsorship_spend",
  "currency",
  "speaking_slots",
  "exposure_channels",
  "speaking_opps",
  "lead_capture",
  "post_event_report",
  // Assets
  "sponsorship_deck_url",
  "banner_image_url",
  "floor_plan_url",
  // Review & submit
  "sponsorship_deadline",
  "payment_terms",
  "abw_management_requested",
  "consent_given"
]);
function pickAutosavePatch(form) {
  const patch = Object.fromEntries(Object.entries(form).filter(([k]) => AUTOSAVE_ALLOWED.has(k)));
  if (typeof patch.format === "string") {
    patch.format = patch.format.toLowerCase();
  }
  return patch;
}
const AutosaveInput = objectType({
  id: stringType().uuid(),
  step: numberType().int().min(0).max(9),
  patch: recordType(stringType(), anyType())
});
const autosaveEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => AutosaveInput.parse(d)).handler(createSsrRpc("8de4f12b84d55784171a4d2136e7bda05205948d24a22aa487ac593c2a7f5898"));
const TierInput = objectType({
  id: stringType().uuid().optional(),
  event_id: stringType().uuid(),
  tier_name: stringType().min(1).max(80),
  price: numberType().nonnegative(),
  currency: stringType().min(3).max(3),
  assets: arrayType(stringType()).default([]),
  slots_total: numberType().int().min(1).default(1),
  is_exclusive: booleanType().default(false),
  custom_options: stringType().max(500).optional().nullable(),
  display_order: numberType().int().default(0)
});
const upsertTier = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => TierInput.parse(d)).handler(createSsrRpc("f5b7b764a8ec2cf4b076249983ea8209b04950f539a86d669a245bf3db208b8c"));
const deleteTier = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("1bfb82222c1d6b5d6f66d984b2374d01da1267c749611641d6e2d539ccd9f54a"));
const submitEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("7222f96b3fb07b434fdaf892e164e23c680a172f2f9104db9dcbb9849abf27ac"));
const deleteDraftEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("e118bff512f47e88245c25591f658c39fcdec56c16e16b295b8c1f65856d037e"));
export {
  autosaveEvent as a,
  deleteTier as b,
  createEventDraft as c,
  deleteDraftEvent as d,
  getMyEvents as e,
  getEventForEdit as g,
  pickAutosavePatch as p,
  submitEvent as s,
  upsertTier as u
};
