import { c as createServerRpc } from "./createServerRpc-BtR2InOc.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { s as supabaseAdmin } from "./client.server-k0C2Btf0.mjs";
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
import "./supabase-env-Di-uc-dX.mjs";
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
async function assertMediaPartner(userId) {
  const {
    data: roles
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  if (!roles?.some((r) => r.role === "media_partner")) {
    throw new Error("Only media partners can request coverage");
  }
}
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
    userId
  } = context;
  await assertMediaPartner(userId);
  const {
    error
  } = await supabaseAdmin.from("media_requests").upsert({
    event_id: data.event_id,
    media_partner_id: userId,
    request_type: data.request_type,
    message: data.message ?? null,
    status: "pending"
  }, {
    onConflict: "event_id,media_partner_id,request_type"
  });
  if (error) {
    if (error.message.includes("media_requests") || error.code === "42P01") {
      throw new Error("Media requests are not enabled yet. Run the latest database migration.");
    }
    throw new Error(error.message);
  }
  try {
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
  } catch (notifyErr) {
    console.error("[submitMediaRequest] admin notify failed", notifyErr);
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
    userId
  } = context;
  try {
    const {
      data: reqs,
      error
    } = await supabaseAdmin.from("media_requests").select("id, event_id, request_type, message, status, created_at").eq("media_partner_id", userId).order("created_at", {
      ascending: false
    });
    if (error) {
      if (error.message.includes("media_requests") || error.code === "42P01") {
        return {
          requests: [],
          events: {}
        };
      }
      throw new Error(error.message);
    }
    const eventIds = Array.from(new Set((reqs ?? []).map((r) => r.event_id).filter(Boolean)));
    const eventMap = {};
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
  } catch (e) {
    console.error("[getMyMediaRequests]", e);
    return {
      requests: [],
      events: {}
    };
  }
});
const getMediaPartnerSaves_createServerFn_handler = createServerRpc({
  id: "fdd3969ac97481c49af9c5eb1ce7251dda9d4b5e11e3b514a2838518d4bfdaee",
  name: "getMediaPartnerSaves",
  filename: "src/lib/media.functions.ts"
}, (opts) => getMediaPartnerSaves.__executeServer(opts));
const getMediaPartnerSaves = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(getMediaPartnerSaves_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const {
    data: saves
  } = await supabaseAdmin.from("event_saves").select("event_id, created_at").eq("user_id", userId).order("created_at", {
    ascending: false
  });
  const ids = (saves ?? []).map((s) => s.event_id);
  const eventMap = {};
  if (ids.length) {
    const {
      data: evs
    } = await supabaseAdmin.from("events").select("id, slug, name, banner_image_url, start_date, city, country, primary_sector").in("id", ids);
    for (const e of evs ?? []) eventMap[e.id] = e;
  }
  return {
    saves: saves ?? [],
    eventMap
  };
});
export {
  getMediaPartnerSaves_createServerFn_handler,
  getMyMediaRequests_createServerFn_handler,
  submitMediaRequest_createServerFn_handler
};
