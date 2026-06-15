import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { n as useServerFn } from "./router-4-w4Upb_.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { A as AppShell, S as StatusBadge } from "./app-shell-B89gTHZ9.mjs";
import { e as getMyEvents, c as createEventDraft, d as deleteDraftEvent } from "./events.functions-CrEuJg7H.mjs";
import "../_libs/seroval.mjs";
import { K as LoaderCircle, W as Plus, f as CalendarDays, O as MapPin, a6 as Trash2 } from "../_libs/lucide-react.mjs";
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
import "./server-Dl4ga8RB.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DnNqQzIF.mjs";
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
import "../_libs/zod.mjs";
function EventsList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEvents = useServerFn(getMyEvents);
  const createDraft = useServerFn(createEventDraft);
  const removeDraft = useServerFn(deleteDraftEvent);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => fetchEvents()
  });
  const create = useMutation({
    mutationFn: () => createDraft(),
    onSuccess: ({
      id
    }) => {
      qc.invalidateQueries({
        queryKey: ["events", "mine"]
      });
      navigate({
        to: "/events/edit/$id",
        params: {
          id
        }
      });
    },
    onError: (e) => toast.error(e.message)
  });
  const del = useMutation({
    mutationFn: (id) => removeDraft({
      data: {
        id
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["events", "mine"]
      });
      toast.success("Draft deleted");
    },
    onError: (e) => toast.error(e.message)
  });
  const events = data?.events ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "My events" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Draft, submit and track vetting status of your events." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => create.mutate(), disabled: create.isPending, className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform disabled:opacity-60", children: [
        create.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        "New event"
      ] })
    ] }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex items-center justify-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] }) : events.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 rounded-2xl border border-dashed border-border bg-card p-12 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold", children: "No events yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "Create your first event draft to start the IGE vetting flow." }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => create.mutate(), className: "mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " Create event"
      ] })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-3", children: events.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/edit/$id", params: {
      id: e.id
    }, className: "group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-base font-bold", children: e.name || "Untitled event" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: e.status }),
          e.ige_vetted && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-deep", children: "IGE Vetted" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground", children: [
          e.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarDays, { className: "h-3 w-3" }),
            " ",
            fmtDateRange(e.start_date, e.end_date)
          ] }),
          (e.city || e.country) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
            " ",
            [e.city, e.country].filter(Boolean).join(", ")
          ] }),
          e.event_type && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            "· ",
            e.event_type
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex gap-4 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            e.view_count,
            " views"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            e.save_count,
            " saves"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            e.inquiry_count,
            " inquiries"
          ] })
        ] })
      ] }),
      e.status === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: (ev) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (confirm("Delete this draft?")) del.mutate(e.id);
      }, className: "rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
    ] }, e.id)) })
  ] });
}
function fmtDateRange(s, e) {
  if (!s) return "";
  const fmt = (d) => new Date(d).toLocaleDateString(void 0, {
    day: "numeric",
    month: "short",
    year: "numeric"
  });
  return e && e !== s ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}
export {
  EventsList as component
};
