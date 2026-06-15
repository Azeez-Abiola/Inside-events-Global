import { c as createServerRpc } from "./createServerRpc-BulwCtAy.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
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
const ALLOWED_TRANSITIONS = {
  draft: ["submitted"],
  submitted: ["under_review"],
  under_review: ["revision_requested", "approved", "rejected"],
  revision_requested: ["submitted"],
  approved: ["listed"],
  listed: ["closed", "archived"]
};
async function ensureAdmin(supabase, userId) {
  const {
    data,
    error
  } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  if (error) throw new Error(error.message);
  const roles = (data ?? []).map((r) => r.role);
  if (!roles.includes("abw_admin") && !roles.includes("super_admin")) {
    throw new Error("Forbidden: admin access required");
  }
}
const listEventsForVetting_createServerFn_handler = createServerRpc({
  id: "bda00c310fa4568441e620fa4b7901e1b8699194489e81ecf9bd779642b0b27d",
  name: "listEventsForVetting",
  filename: "src/lib/admin.functions.ts"
}, (opts) => listEventsForVetting.__executeServer(opts));
const listEventsForVetting = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listEventsForVetting_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  await ensureAdmin(supabase, userId);
  const {
    data,
    error
  } = await supabase.from("events").select("id, name, slug, status, event_type, start_date, city, country, created_at, updated_at, organiser_id, vetting_notes, rejection_reason").in("status", ["submitted", "under_review", "revision_requested", "approved", "rejected"]).order("updated_at", {
    ascending: false
  });
  if (error) throw new Error(error.message);
  const ids = Array.from(new Set((data ?? []).map((e) => e.organiser_id)));
  const {
    data: profiles
  } = await supabase.from("profiles").select("id, email").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const map = new Map((profiles ?? []).map((p) => [p.id, p.email]));
  return {
    events: (data ?? []).map((e) => ({
      ...e,
      organiser_email: map.get(e.organiser_id) ?? null
    }))
  };
});
const getEventForAdmin_createServerFn_handler = createServerRpc({
  id: "773d8acef26731b95061f34b034599a7953aef266332f3e549f6bef17c96c138",
  name: "getEventForAdmin",
  filename: "src/lib/admin.functions.ts"
}, (opts) => getEventForAdmin.__executeServer(opts));
const getEventForAdmin = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  id: stringType().uuid()
}).parse(d)).handler(getEventForAdmin_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  await ensureAdmin(supabase, userId);
  const [{
    data: ev,
    error
  }, {
    data: tiers
  }] = await Promise.all([supabase.from("events").select("*").eq("id", data.id).single(), supabase.from("event_sponsorship_tiers").select("*").eq("event_id", data.id).order("display_order")]);
  if (error) throw new Error(error.message);
  const {
    data: profile
  } = ev.organiser_id ? await supabase.from("profiles").select("id, email").eq("id", ev.organiser_id).single() : {
    data: null
  };
  return {
    event: ev,
    tiers: tiers ?? [],
    organiser: profile
  };
});
const SetStatusInput = objectType({
  id: stringType().uuid(),
  to_status: enumType(["under_review", "revision_requested", "approved", "rejected", "listed", "closed", "archived"]),
  note: stringType().max(2e3).optional().nullable()
});
const setEventVettingStatus_createServerFn_handler = createServerRpc({
  id: "a901d51839bdbcdf14cadafa26818c8fe62ee10b51bf69c9d8fa3674abbe2220",
  name: "setEventVettingStatus",
  filename: "src/lib/admin.functions.ts"
}, (opts) => setEventVettingStatus.__executeServer(opts));
const setEventVettingStatus = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SetStatusInput.parse(d)).handler(setEventVettingStatus_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  await ensureAdmin(supabase, userId);
  const {
    data: ev,
    error
  } = await supabase.from("events").select("id, status").eq("id", data.id).single();
  if (error) throw new Error(error.message);
  const allowed = ALLOWED_TRANSITIONS[ev.status] ?? [];
  if (!allowed.includes(data.to_status)) {
    throw new Error(`Invalid transition '${ev.status}' → '${data.to_status}'. Allowed: ${allowed.join(", ") || "none"}`);
  }
  const patch = {
    status: data.to_status,
    vetted_at: (/* @__PURE__ */ new Date()).toISOString(),
    vetted_by: userId
  };
  if (data.to_status === "approved" || data.to_status === "listed") {
    patch.ige_vetted = true;
  }
  if (data.to_status === "revision_requested") {
    patch.vetting_notes = data.note ?? null;
  }
  if (data.to_status === "rejected") {
    patch.rejection_reason = data.note ?? null;
  }
  const {
    error: upErr
  } = await supabase.from("events").update(patch).eq("id", data.id);
  if (upErr) throw new Error(upErr.message);
  return {
    ok: true,
    status: data.to_status
  };
});
export {
  getEventForAdmin_createServerFn_handler,
  listEventsForVetting_createServerFn_handler,
  setEventVettingStatus_createServerFn_handler
};
