import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as useSearch, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, o as useServerFn, f as createSsrRpc } from "./router-BT27-cf7.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { A as AppShell } from "./app-shell-ByWYJGa2.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { s as supabase } from "./client-gmdRS3ZG.mjs";
import "../_libs/ws.mjs";
import "../_libs/seroval.mjs";
import { Y as Plus, M as LoaderCircle, S as MessageSquare, a0 as Send } from "../_libs/lucide-react.mjs";
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
import "./client.server-BxqV6VTA.mjs";
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
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./alert-dialog-BrzSSKxW.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./button-DA2gxxPy.mjs";
import "../_libs/class-variance-authority.mjs";
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
const listMessageContacts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("4bf01b1626148bf69db1774f4b941712031c67cd2bf0f8800a3288450a774044"));
const FORM_INPUT = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring";
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
  const fetchContacts = useServerFn(listMessageContacts);
  const send = useServerFn(sendMessage);
  const qc = useQueryClient();
  const [composing, setComposing] = reactExports.useState(false);
  const [composeTo, setComposeTo] = reactExports.useState(search.to ?? "");
  const [composeEventId, setComposeEventId] = reactExports.useState(search.event_id ?? "");
  const {
    data: tdata,
    isLoading: threadsLoading
  } = useQuery({
    queryKey: ["threads"],
    queryFn: () => fetchThreads()
  });
  const {
    data: contactsData
  } = useQuery({
    queryKey: ["message-contacts"],
    queryFn: () => fetchContacts()
  });
  const active = search.thread ?? (composing ? null : tdata?.threads[0]?.thread_id ?? null);
  const {
    data: mdata
  } = useQuery({
    queryKey: ["thread", active],
    queryFn: () => fetchThread({
      data: {
        thread_id: active
      }
    }),
    enabled: !!active,
    refetchInterval: 15e3
  });
  const [body, setBody] = reactExports.useState("");
  const activeThread = tdata?.threads.find((t) => t.thread_id === active);
  const composeContact = contactsData?.contacts.find((c) => c.user_id === composeTo);
  reactExports.useEffect(() => {
    if (search.to) {
      setComposing(true);
      setComposeTo(search.to);
      if (search.event_id) setComposeEventId(search.event_id);
    }
  }, [search.to, search.event_id]);
  reactExports.useEffect(() => {
    if (!active || !user) return;
    const channel = supabase.channel(`thread-${active}`).on("postgres_changes", {
      event: "INSERT",
      schema: "public",
      table: "messages",
      filter: `thread_id=eq.${active}`
    }, () => {
      qc.invalidateQueries({
        queryKey: ["thread", active]
      });
      qc.invalidateQueries({
        queryKey: ["threads"]
      });
    }).subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [active, user, qc]);
  const sendMut = useMutation({
    mutationFn: (payload) => send({
      data: payload
    }),
    onSuccess: (res) => {
      setBody("");
      setComposing(false);
      qc.invalidateQueries({
        queryKey: ["thread", res.thread_id]
      });
      qc.invalidateQueries({
        queryKey: ["threads"]
      });
      navigate({
        search: {
          thread: res.thread_id
        }
      });
    }
  });
  function startCompose(contact) {
    setComposing(true);
    setComposeTo(contact?.user_id ?? "");
    setComposeEventId(contact?.event_id ?? "");
    navigate({
      search: {}
    });
  }
  const headerName = composing ? composeContact?.name ?? "New message" : activeThread?.other_name ?? "Conversation";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Messages" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => startCompose(), className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " New message"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-6 lg:grid-cols-[320px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "overflow-hidden rounded-xl border border-border bg-card", children: [
        threadsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center p-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-5 w-5 animate-spin text-primary" }) }) : (tdata?.threads ?? []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
          setComposing(false);
          navigate({
            search: {
              thread: t.thread_id
            }
          });
        }, className: `flex w-full items-start gap-3 border-b border-border p-4 text-left transition-colors ${active === t.thread_id && !composing ? "bg-brand-soft" : "hover:bg-muted/50"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold uppercase text-primary-deep", children: (t.other_name ?? "U").slice(0, 2) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-sm font-semibold", children: t.other_name }),
              t.unread > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground", children: t.unread })
            ] }),
            t.event_name && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "truncate text-[11px] text-primary", children: t.event_name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 truncate text-xs text-muted-foreground", children: t.last.body })
          ] })
        ] }, t.thread_id)),
        !threadsLoading && !tdata?.threads.length && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "mx-auto h-6 w-6 opacity-50" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2", children: "No conversations yet." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => startCompose(), className: "mt-3 text-primary font-semibold hover:underline", children: "Start one →" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "flex min-h-[60vh] flex-col rounded-xl border border-border bg-card", children: composing ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold", children: "New message" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Message someone from your network or the IGE team." }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block font-medium", children: "Recipient" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: composeTo, onChange: (e) => setComposeTo(e.target.value), className: FORM_INPUT, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select a contact…" }),
              (contactsData?.contacts ?? []).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("option", { value: c.user_id, children: [
                c.name,
                " — ",
                c.subtitle
              ] }, c.user_id))
            ] })
          ] }),
          composeContact?.event_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-xs text-muted-foreground", children: [
            "Regarding: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: composeContact.event_name })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block font-medium", children: "Message" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 5, value: body, onChange: (e) => setBody(e.target.value), className: FORM_INPUT, placeholder: "Write your message…" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-auto flex justify-end gap-2 border-t border-border pt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setComposing(false), className: "rounded-md px-4 py-2 text-sm hover:bg-muted", children: "Cancel" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: !composeTo || !body.trim() || sendMut.isPending, onClick: () => sendMut.mutate({
            recipient_id: composeTo,
            body: body.trim(),
            event_id: composeEventId || composeContact?.event_id || null,
            thread_id: null
          }), className: "inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
            sendMut.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3.5 w-3.5" }),
            "Send"
          ] })
        ] })
      ] }) : active ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-b border-border px-6 py-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: headerName }),
          activeThread?.other_company && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: activeThread.other_company }),
          activeThread?.event_name && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-primary", children: [
            "Re: ",
            activeThread.event_name
          ] })
        ] }),
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
          if (body.trim() && activeThread) {
            sendMut.mutate({
              recipient_id: activeThread.other_user_id,
              body: body.trim(),
              event_id: activeThread.event_id,
              thread_id: active
            });
          }
        }, className: "flex gap-2 border-t border-border p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: body, onChange: (e) => setBody(e.target.value), placeholder: "Type a message…", className: `flex-1 ${FORM_INPUT}` }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "submit", disabled: !body.trim() || sendMut.isPending, className: "inline-flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3.5 w-3.5" }),
            " Send"
          ] })
        ] })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-8 w-8 opacity-40" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { children: "Select a conversation or start a new message." }),
        (contactsData?.contacts ?? []).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 w-full max-w-sm space-y-2 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold uppercase tracking-wide text-muted-foreground", children: "Quick start" }),
          contactsData.contacts.slice(0, 4).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => startCompose(c), className: "flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground", children: c.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground truncate ml-2", children: c.subtitle })
          ] }, c.user_id))
        ] })
      ] }) })
    ] })
  ] });
}
export {
  MessagesPage as component
};
