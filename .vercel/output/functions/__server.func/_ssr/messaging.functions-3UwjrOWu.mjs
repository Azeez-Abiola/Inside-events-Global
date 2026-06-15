import { c as createServerRpc } from "./createServerRpc-BulwCtAy.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import { s as supabaseAdmin } from "./client.server-U_pH-Evd.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
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
const listThreads_createServerFn_handler = createServerRpc({
  id: "3b8a3793e9b8ee0491eba5eae98837be3ee3ad9320bb332c118712614c346649",
  name: "listThreads",
  filename: "src/lib/messaging.functions.ts"
}, (opts) => listThreads.__executeServer(opts));
const listThreads = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listThreads_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const {
    data
  } = await supabaseAdmin.from("messages").select("thread_id, sender_id, recipient_id, body, created_at, read, event_id").or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order("created_at", {
    ascending: false
  }).limit(200);
  const threads = /* @__PURE__ */ new Map();
  for (const m of data ?? []) {
    const t = threads.get(m.thread_id);
    const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
    if (!t) {
      threads.set(m.thread_id, {
        thread_id: m.thread_id,
        other_user_id: other,
        last: m,
        unread: !m.read && m.recipient_id === userId ? 1 : 0,
        event_id: m.event_id
      });
    } else if (!m.read && m.recipient_id === userId) {
      t.unread += 1;
    }
  }
  return {
    threads: Array.from(threads.values())
  };
});
const getThread_createServerFn_handler = createServerRpc({
  id: "c9ec8ae4f4401996cae63176fee898d2cc6a312930ceb92f9f85f4eb707a0d46",
  name: "getThread",
  filename: "src/lib/messaging.functions.ts"
}, (opts) => getThread.__executeServer(opts));
const getThread = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  thread_id: stringType().uuid()
}).parse(d)).handler(getThread_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const {
    data: msgs
  } = await supabaseAdmin.from("messages").select("*").eq("thread_id", data.thread_id).order("created_at", {
    ascending: true
  });
  const messages = msgs ?? [];
  const isParticipant = messages.some((m) => m.sender_id === userId || m.recipient_id === userId);
  if (!isParticipant) throw new Error("Forbidden");
  await supabase.from("messages").update({
    read: true,
    read_at: (/* @__PURE__ */ new Date()).toISOString()
  }).eq("thread_id", data.thread_id).eq("recipient_id", userId).eq("read", false);
  return {
    messages
  };
});
const SendInput = objectType({
  recipient_id: stringType().uuid(),
  body: stringType().min(1).max(4e3),
  event_id: stringType().uuid().optional().nullable(),
  thread_id: stringType().uuid().optional().nullable()
});
const sendMessage_createServerFn_handler = createServerRpc({
  id: "fce504a9588bcdb1bfb1c1be751983936ad5974b9b7ae0b63f73cd928dc07531",
  name: "sendMessage",
  filename: "src/lib/messaging.functions.ts"
}, (opts) => sendMessage.__executeServer(opts));
const sendMessage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SendInput.parse(d)).handler(sendMessage_createServerFn_handler, async ({
  data,
  context
}) => {
  const {
    supabase,
    userId
  } = context;
  const thread_id = data.thread_id ?? crypto.randomUUID();
  const {
    error
  } = await supabase.from("messages").insert({
    thread_id,
    sender_id: userId,
    recipient_id: data.recipient_id,
    event_id: data.event_id ?? null,
    body: data.body
  });
  if (error) throw new Error(error.message);
  await supabaseAdmin.from("notifications").insert({
    user_id: data.recipient_id,
    type: "new_message",
    title: "New message",
    body: data.body.slice(0, 140),
    data: {
      thread_id
    }
  });
  return {
    ok: true,
    thread_id
  };
});
export {
  getThread_createServerFn_handler,
  listThreads_createServerFn_handler,
  sendMessage_createServerFn_handler
};
