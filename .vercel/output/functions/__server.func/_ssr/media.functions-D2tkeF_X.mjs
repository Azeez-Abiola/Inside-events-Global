import { c as createServerRpc } from "./createServerRpc-BjI2KYkQ.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { s as supabaseAdmin } from "./client.server-BxqV6VTA.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import "../_libs/ws.mjs";
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
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
const RequestInput = objectType({
  event_id: stringType().uuid(),
  request_type: enumType(["coverage", "press_credentials", "content"]).default("coverage"),
  message: stringType().trim().max(1e3).optional().nullable()
});
const submitMediaRequest_createServerFn_handler = createServerRpc({
  id: "d7e3322052c4f2176d1f92a1b65923ca2734ef6bfe940caceabc1619a74eb9d6",
  name: "submitMediaRequest",
  filename: "src/lib/media.functions.ts"
}, (opts) => submitMediaRequest.__executeServer(opts));
const submitMediaRequest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => RequestInput.parse(d)).handler(submitMediaRequest_createServerFn_handler, async ({
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
  if (!roles?.some((r) => r.role === "media_partner")) {
    throw new Error("Only media partners can request coverage");
  }
  const {
    error
  } = await supabase.from("media_requests").upsert({
    event_id: data.event_id,
    media_partner_id: userId,
    request_type: data.request_type,
    message: data.message ?? null,
    status: "pending"
  }, {
    onConflict: "event_id,media_partner_id,request_type"
  });
  if (error) throw new Error(error.message);
  const {
    data: admins
  } = await supabaseAdmin.from("user_roles").select("user_id").in("role", ["abw_admin", "super_admin"]);
  if (admins?.length) {
    await supabaseAdmin.from("notifications").insert(admins.map((a) => ({
      user_id: a.user_id,
      type: "media_request",
      title: "New media coverage request",
      body: `A media partner requested ${data.request_type.replace(/_/g, " ")}.`,
      data: {
        event_id: data.event_id
      }
    })));
  }
  return {
    ok: true
  };
});
const getMyMediaRequests_createServerFn_handler = createServerRpc({
  id: "66d75df2d65bae0d952fc0cf9448a4184830d67f412b5d9d3ccecf2b04ef184c",
  name: "getMyMediaRequests",
  filename: "src/lib/media.functions.ts"
}, (opts) => getMyMediaRequests.__executeServer(opts));
const getMyMediaRequests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMyMediaRequests_createServerFn_handler, async ({
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: reqs
  } = await supabase.from("media_requests").select("id, event_id, request_type, message, status, created_at").eq("media_partner_id", userId).order("created_at", {
    ascending: false
  });
  const eventIds = Array.from(new Set((reqs ?? []).map((r) => r.event_id).filter(Boolean)));
  let eventMap = {};
  if (eventIds.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, name, slug, city, country").in("id", eventIds);
    for (const e of evs ?? []) eventMap[e.id] = e;
  }
  return {
    requests: reqs ?? [],
    events: eventMap
  };
});
export {
  getMyMediaRequests_createServerFn_handler,
  submitMediaRequest_createServerFn_handler
};
