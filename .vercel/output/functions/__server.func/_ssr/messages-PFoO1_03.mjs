import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as useSearch, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, n as useServerFn, f as createSsrRpc } from "./router-4-w4Upb_.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { A as AppShell } from "./app-shell-B89gTHZ9.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import "../_libs/seroval.mjs";
import { R as MessageSquare, $ as Send } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "./client-BhermGBt.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "./client.server-U_pH-Evd.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/react-email__render.mjs";
import "../_libs/prettier.mjs";
import "../_libs/html-to-text.mjs";
import "../_libs/selderee__plugin-htmlparser2.mjs";
import "../_libs/selderee.mjs";
import "../_libs/parseley.mjs";
import "../_libs/leac.mjs";
import "../_libs/peberminta.mjs";
import "../_libs/domhandler.mjs";
import "../_libs/domelementtype.mjs";
import "../_libs/htmlparser2.mjs";
import "../_libs/entities.mjs";
import "../_libs/deepmerge.mjs";
import "../_libs/dom-serializer.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/react-email__hr.mjs";
import "../_libs/react-email__link.mjs";
import "../_libs/react-email__button.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
const listThreads = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("3b8a3793e9b8ee0491eba5eae98837be3ee3ad9320bb332c118712614c346649"));
const getThread = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => objectType({
  thread_id: stringType().uuid()
}).parse(d)).handler(createSsrRpc("c9ec8ae4f4401996cae63176fee898d2cc6a312930ceb92f9f85f4eb707a0d46"));
const SendInput = objectType({
  recipient_id: stringType().uuid(),
  body: stringType().min(1).max(4e3),
  event_id: stringType().uuid().optional().nullable(),
  thread_id: stringType().uuid().optional().nullable()
});
const sendMessage = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SendInput.parse(d)).handler(createSsrRpc("fce504a9588bcdb1bfb1c1be751983936ad5974b9b7ae0b63f73cd928dc07531"));
function MessagesPage() {
  const {
    user
  } = useAuth();
  const search = useSearch({
    from: "/_authenticated/messages"
  });
  const navigate = useNavigate({
    from: "/messages"
  });
  const fetchThreads = useServerFn(listThreads);
  const fetchThread = useServerFn(getThread);
  const send = useServerFn(sendMessage);
  const qc = useQueryClient();
  const {
    data: tdata
  } = useQuery({
    queryKey: ["threads"],
    queryFn: () => fetchThreads()
  });
  const active = search.thread ?? tdata?.threads[0]?.thread_id ?? null;
  const {
    data: mdata
  } = useQuery({
    queryKey: ["thread", active],
    queryFn: () => fetchThread({
      data: {
        thread_id: active
      }
    }),
    enabled: !!active
  });
  const [body, setBody] = reactExports.useState("");
  const activeThread = tdata?.threads.find((t) => t.thread_id === active);
  const sendMut = useMutation({
    mutationFn: () => send({
      data: {
        recipient_id: activeThread.other_user_id,
        body,
        event_id: activeThread.event_id,
        thread_id: active
      }
    }),
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({
        queryKey: ["thread", active]
      });
      qc.invalidateQueries({
        queryKey: ["threads"]
      });
    }
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Messages" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[320px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "overflow-hidden rounded-xl border border-border bg-card", children: [
        (tdata?.threads ?? []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => navigate({
          search: {
            thread: t.thread_id
          }
        }), className: `flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors ${active === t.thread_id ? "bg-brand-soft" : "hover:bg-muted/50"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase", children: t.other_user_id.slice(0, 2) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "truncate text-sm font-medium", children: [
                t.other_user_id.slice(0, 8),
                "…"
              ] }),
              t.unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground", children: t.unread })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: t.last.body })
          ] })
        ] }, t.thread_id)),
        !tdata?.threads.length && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "mx-auto h-6 w-6 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2", children: "No conversations yet." })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "flex min-h-[60vh] flex-col rounded-xl border border-border bg-card", children: active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-3 overflow-y-auto p-6", children: [
          (mdata?.messages ?? []).map((m) => {
            const mine = m.sender_id === user?.id;
            return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex ${mine ? "justify-end" : "justify-start"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `max-w-[70%] rounded-2xl px-4 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "whitespace-pre-wrap", children: m.body }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `mt-1 text-[10px] ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`, children: new Date(m.created_at).toLocaleString() })
            ] }) }, m.id);
          }),
          !mdata?.messages?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-center text-sm text-muted-foreground", children: "Start the conversation." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
          e.preventDefault();
          if (body.trim()) sendMut.mutate();
        }, className: "flex gap-2 border-t border-border p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: body, onChange: (e) => setBody(e.target.value), placeholder: "Type a message…", className: "flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:border-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: !body.trim() || sendMut.isPending, className: "inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3.5 w-3.5" }),
            " Send"
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-1 items-center justify-center text-sm text-muted-foreground", children: "Select a conversation" }) })
    ] })
  ] });
}
export {
  MessagesPage as component
};
