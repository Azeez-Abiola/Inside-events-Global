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
async function enrichProfiles(userIds) {
  if (!userIds.length) return {};
  const {
    data: profiles
  } = await supabaseAdmin.from("profiles").select("id, email, linkedin_employer").in("id", userIds);
  const map = {};
  for (const p of profiles ?? []) {
    map[p.id] = {
      email: p.email ?? "",
      name: p.email?.split("@")[0] ?? "User",
      company: p.linkedin_employer ?? void 0
    };
  }
  return map;
}
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
  const threadList = Array.from(threads.values());
  const otherIds = threadList.map((t) => t.other_user_id);
  const eventIds = threadList.map((t) => t.event_id).filter(Boolean);
  const [profileMap, eventMap] = await Promise.all([enrichProfiles(otherIds), eventIds.length ? supabaseAdmin.from("events").select("id, name").in("id", eventIds).then(({
    data: evs
  }) => {
    const m = {};
    for (const e of evs ?? []) m[e.id] = e.name ?? "Event";
    return m;
  }) : Promise.resolve({})]);
  return {
    threads: threadList.map((t) => ({
      ...t,
      other_name: profileMap[t.other_user_id]?.name ?? "User",
      other_email: profileMap[t.other_user_id]?.email,
      other_company: profileMap[t.other_user_id]?.company,
      event_name: t.event_id ? eventMap[t.event_id] : null
    }))
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
const listMessageContacts_createServerFn_handler = createServerRpc({
  id: "4bf01b1626148bf69db1774f4b941712031c67cd2bf0f8800a3288450a774044",
  name: "listMessageContacts",
  filename: "src/lib/messaging.functions.ts"
}, (opts) => listMessageContacts.__executeServer(opts));
const listMessageContacts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(listMessageContacts_createServerFn_handler, async ({
  context
}) => {
  const {
    userId
  } = context;
  const {
    data: roles
  } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", userId);
  const roleSet = new Set((roles ?? []).map((r) => r.role));
  const contacts = /* @__PURE__ */ new Map();
  function add(id, name, subtitle, event_id, event_name) {
    if (!id || id === userId) return;
    const existing = contacts.get(id);
    if (!existing) contacts.set(id, {
      user_id: id,
      name,
      subtitle,
      event_id,
      event_name
    });
  }
  if (roleSet.has("organiser")) {
    const {
      data: events
    } = await supabaseAdmin.from("events").select("id, name").eq("organiser_id", userId);
    const eventIds = (events ?? []).map((e) => e.id);
    const eventNames = Object.fromEntries((events ?? []).map((e) => [e.id, e.name]));
    if (eventIds.length) {
      const {
        data: forms
      } = await supabaseAdmin.from("commitment_forms").select("sponsor_user_id, company_name, contact_name, event_id").in("event_id", eventIds).not("sponsor_user_id", "is", null);
      for (const f of forms ?? []) {
        add(f.sponsor_user_id, f.contact_name ?? f.company_name ?? "Sponsor", f.company_name ?? "Sponsor", f.event_id, eventNames[f.event_id]);
      }
    }
  }
  if (roleSet.has("sponsor")) {
    const {
      data: forms
    } = await supabaseAdmin.from("commitment_forms").select("event_id, company_name").eq("sponsor_user_id", userId);
    const eventIds = Array.from(new Set((forms ?? []).map((f) => f.event_id)));
    if (eventIds.length) {
      const {
        data: evs
      } = await supabaseAdmin.from("events").select("id, name, organiser_id").in("id", eventIds);
      const {
        data: orgProfiles
      } = await supabaseAdmin.from("organiser_profiles").select("user_id, org_name").in("user_id", (evs ?? []).map((e) => e.organiser_id).filter(Boolean));
      const orgNames = Object.fromEntries((orgProfiles ?? []).map((o) => [o.user_id, o.org_name]));
      for (const e of evs ?? []) {
        add(e.organiser_id, orgNames[e.organiser_id] ?? "Event organiser", e.name ?? "Event", e.id, e.name ?? void 0);
      }
    }
  }
  if (roleSet.has("referral_partner")) {
    const {
      data: deals
    } = await supabaseAdmin.from("deals").select("event_id, organiser_id, sponsor_user_id").eq("referral_partner_id", userId);
    const eventIds = Array.from(new Set((deals ?? []).map((d) => d.event_id)));
    if (eventIds.length) {
      const {
        data: evs
      } = await supabaseAdmin.from("events").select("id, name, organiser_id").in("id", eventIds);
      const evMap = Object.fromEntries((evs ?? []).map((e) => [e.id, e]));
      for (const d of deals ?? []) {
        const ev = evMap[d.event_id];
        if (d.organiser_id) add(d.organiser_id, "Event organiser", ev?.name ?? "Event", d.event_id, ev?.name);
        if (d.sponsor_user_id) add(d.sponsor_user_id, "Sponsor", ev?.name ?? "Event", d.event_id, ev?.name);
      }
    }
  }
  const {
    data: admins
  } = await supabaseAdmin.from("user_roles").select("user_id").in("role", ["abw_admin", "super_admin"]);
  const adminIds = (admins ?? []).map((a) => a.user_id).filter((id) => id !== userId);
  if (adminIds.length) {
    const adminProfiles = await enrichProfiles(adminIds.slice(0, 3));
    for (const id of adminIds.slice(0, 3)) {
      add(id, adminProfiles[id]?.name ?? "IGE Team", "Platform support");
    }
  }
  return {
    contacts: Array.from(contacts.values())
  };
});
export {
  getThread_createServerFn_handler,
  listMessageContacts_createServerFn_handler,
  listThreads_createServerFn_handler,
  sendMessage_createServerFn_handler
};
