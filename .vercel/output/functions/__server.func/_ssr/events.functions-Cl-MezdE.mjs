import { c as createServerRpc } from "./createServerRpc-BulwCtAy.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import { s as supabaseAdmin } from "./client.server-U_pH-Evd.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, r as recordType, a as anyType, n as numberType, c as booleanType, b as arrayType } from "../_libs/zod.mjs";
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
const VALID_TRANSITIONS = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["revision_requested", "approved", "rejected"],
  revision_requested: ["submitted"],
  approved: ["listed"],
  listed: ["closed", "archived"]
};
const getMyEvents_createServerFn_handler = createServerRpc({
  id: "6801645af7dd2ad598c49b72a940403a6ab46fe7842286325c6435cdf5001765",
  name: "getMyEvents",
  filename: "src/lib/events.functions.ts"
}, (opts) => getMyEvents.__executeServer(opts));
const getMyEvents = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyEvents_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("events").select("id, name, slug, status, start_date, end_date, city, country, event_type, view_count, save_count, inquiry_count, ige_vetted, created_at, updated_at").eq("organiser_id", userId).order("updated_at", {
    ascending: false
  });
  if (error) throw new Error(error.message);
  return {
    events: data ?? []
  };
});
const createEventDraft_createServerFn_handler = createServerRpc({
  id: "5d294d909dfaf7a5ae1e33f79c305790f333030cba6ef23e70c6192da9f6c9a3",
  name: "createEventDraft",
  filename: "src/lib/events.functions.ts"
}, (opts) => createEventDraft.__executeServer(opts));
const createEventDraft = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createEventDraft_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data,
    error
  } = await supabase.from("events").insert({
    organiser_id: userId,
    name: "Untitled event",
    status: "draft",
    form_step_completed: 0
  }).select("id").single();
  if (error) throw new Error(error.message);
  return {
    id: data.id
  };
});
const getEventForEdit_createServerFn_handler = createServerRpc({
  id: "0c509dff0a1c1b41fda5f8b27c3dd992bb456531f6faa537ddca51c5b1cf5cdc",
  name: "getEventForEdit",
  filename: "src/lib/events.functions.ts"
}, (opts) => getEventForEdit.__executeServer(opts));
const getEventForEdit = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(getEventForEdit_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const [{
    data: ev,
    error
  }, {
    data: tiers
  }] = await Promise.all([supabase.from("events").select("*").eq("id", data.id).single(), supabase.from("event_sponsorship_tiers").select("*").eq("event_id", data.id).order("display_order")]);
  if (error) throw new Error(error.message);
  return {
    event: ev,
    tiers: tiers ?? []
  };
});
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
const AutosaveInput = objectType({
  id: stringType().uuid(),
  step: numberType().int().min(0).max(9),
  patch: recordType(stringType(), anyType())
});
const autosaveEvent_createServerFn_handler = createServerRpc({
  id: "8de4f12b84d55784171a4d2136e7bda05205948d24a22aa487ac593c2a7f5898",
  name: "autosaveEvent",
  filename: "src/lib/events.functions.ts"
}, (opts) => autosaveEvent.__executeServer(opts));
const autosaveEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => AutosaveInput.parse(d)).handler(autosaveEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: ev,
    error: e1
  } = await supabase.from("events").select("organiser_id, status").eq("id", data.id).single();
  if (e1) throw new Error(e1.message);
  if (ev.organiser_id !== userId) throw new Error("Forbidden");
  if (!["draft", "revision_requested"].includes(ev.status)) {
    throw new Error("Event can no longer be edited in current status");
  }
  const safePatch = Object.fromEntries(Object.entries(data.patch).filter(([k]) => AUTOSAVE_ALLOWED.has(k)));
  const payload = {
    ...safePatch,
    form_step_completed: Math.max(data.step, 0),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const {
    error
  } = await supabase.from("events").update(payload).eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true,
    savedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
});
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
const upsertTier_createServerFn_handler = createServerRpc({
  id: "f5b7b764a8ec2cf4b076249983ea8209b04950f539a86d669a245bf3db208b8c",
  name: "upsertTier",
  filename: "src/lib/events.functions.ts"
}, (opts) => upsertTier.__executeServer(opts));
const upsertTier = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => TierInput.parse(d)).handler(upsertTier_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: ev
  } = await supabase.from("events").select("organiser_id, status").eq("id", data.event_id).single();
  if (!ev || ev.organiser_id !== userId) throw new Error("Forbidden");
  if (!["draft", "revision_requested"].includes(ev.status)) {
    throw new Error("Event can no longer be edited in current status");
  }
  const row = {
    event_id: data.event_id,
    tier_name: data.tier_name,
    price: data.price,
    currency: data.currency,
    assets: data.assets ?? [],
    slots_total: data.slots_total,
    slots_remaining: data.slots_total,
    is_exclusive: data.is_exclusive,
    custom_options: data.custom_options ?? null,
    display_order: data.display_order
  };
  if (data.id) {
    const {
      data: updated,
      error: error2
    } = await supabase.from("event_sponsorship_tiers").update({
      tier_name: row.tier_name,
      price: row.price,
      currency: row.currency,
      assets: row.assets,
      slots_total: row.slots_total,
      is_exclusive: row.is_exclusive,
      custom_options: row.custom_options,
      display_order: row.display_order
    }).eq("id", data.id).select().single();
    if (error2) throw new Error(error2.message);
    return {
      tier: updated
    };
  }
  const {
    count
  } = await supabase.from("event_sponsorship_tiers").select("*", {
    count: "exact",
    head: true
  }).eq("event_id", data.event_id);
  if ((count ?? 0) >= 6) throw new Error("Maximum of 6 sponsorship tiers per event");
  const {
    data: inserted,
    error
  } = await supabase.from("event_sponsorship_tiers").insert({
    ...row,
    assets: row.assets
  }).select().single();
  if (error) throw new Error(error.message);
  return {
    tier: inserted
  };
});
const deleteTier_createServerFn_handler = createServerRpc({
  id: "1bfb82222c1d6b5d6f66d984b2374d01da1267c749611641d6e2d539ccd9f54a",
  name: "deleteTier",
  filename: "src/lib/events.functions.ts"
}, (opts) => deleteTier.__executeServer(opts));
const deleteTier = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteTier_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: tier,
    error: tierErr
  } = await supabase.from("event_sponsorship_tiers").select("id, event_id").eq("id", data.id).single();
  if (tierErr) throw new Error(tierErr.message);
  const {
    data: ev,
    error: evErr
  } = await supabase.from("events").select("organiser_id, status").eq("id", tier.event_id).single();
  if (evErr) throw new Error(evErr.message);
  if (ev.organiser_id !== userId) throw new Error("Forbidden");
  if (!["draft", "revision_requested"].includes(ev.status)) {
    throw new Error("Event can no longer be edited in current status");
  }
  const {
    error
  } = await supabase.from("event_sponsorship_tiers").delete().eq("id", data.id);
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
const submitEvent_createServerFn_handler = createServerRpc({
  id: "7222f96b3fb07b434fdaf892e164e23c680a172f2f9104db9dcbb9849abf27ac",
  name: "submitEvent",
  filename: "src/lib/events.functions.ts"
}, (opts) => submitEvent.__executeServer(opts));
const submitEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(submitEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: ev,
    error
  } = await supabase.from("events").select("id, organiser_id, status, name, city, slug, consent_given, sponsorship_deck_url, banner_image_url").eq("id", data.id).single();
  if (error) throw new Error(error.message);
  if (ev.organiser_id !== userId) throw new Error("Forbidden");
  const allowed = VALID_TRANSITIONS[ev.status] ?? [];
  if (!allowed.includes("submitted")) {
    throw new Error(`Cannot submit from status '${ev.status}'`);
  }
  if (!ev.consent_given) throw new Error("Consent must be confirmed before submitting");
  if (!ev.sponsorship_deck_url) throw new Error("Sponsorship deck PDF is required");
  if (!ev.banner_image_url) throw new Error("Banner image is required");
  const {
    count: tierCount
  } = await supabase.from("event_sponsorship_tiers").select("*", {
    count: "exact",
    head: true
  }).eq("event_id", ev.id);
  if (!tierCount || tierCount < 1) throw new Error("At least one sponsorship tier is required");
  let slug = ev.slug;
  if (!slug) {
    const {
      data: slugData,
      error: slugErr
    } = await supabaseAdmin.rpc("generate_event_slug", {
      p_name: ev.name,
      p_city: ev.city ?? ""
    });
    if (slugErr) throw new Error(slugErr.message);
    slug = slugData;
  }
  const {
    error: upErr
  } = await supabase.from("events").update({
    status: "submitted",
    slug,
    consent_given_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("id", ev.id);
  if (upErr) throw new Error(upErr.message);
  return {
    ok: true,
    slug
  };
});
const deleteDraftEvent_createServerFn_handler = createServerRpc({
  id: "e118bff512f47e88245c25591f658c39fcdec56c16e16b295b8c1f65856d037e",
  name: "deleteDraftEvent",
  filename: "src/lib/events.functions.ts"
}, (opts) => deleteDraftEvent.__executeServer(opts));
const deleteDraftEvent = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(deleteDraftEvent_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase
  } = context;
  const {
    error
  } = await supabase.from("events").delete().eq("id", data.id).eq("status", "draft");
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  autosaveEvent_createServerFn_handler,
  createEventDraft_createServerFn_handler,
  deleteDraftEvent_createServerFn_handler,
  deleteTier_createServerFn_handler,
  getEventForEdit_createServerFn_handler,
  getMyEvents_createServerFn_handler,
  submitEvent_createServerFn_handler,
  upsertTier_createServerFn_handler
};
