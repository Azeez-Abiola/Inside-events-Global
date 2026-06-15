import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, n as useServerFn } from "./router-4-w4Upb_.mjs";
import { a as useQuery, b as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { A as AppShell, S as StatusBadge } from "./app-shell-B89gTHZ9.mjs";
import { l as listEventsForVetting, g as getEventForAdmin, s as setEventVettingStatus } from "./admin.functions-CKqdtjXT.mjs";
import "../_libs/seroval.mjs";
import { a1 as ShieldAlert, K as LoaderCircle, a as ArrowRight, m as CircleCheck, U as Pencil, n as CircleX } from "../_libs/lucide-react.mjs";
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
const COLUMNS = [{
  key: "submitted",
  label: "New submissions"
}, {
  key: "under_review",
  label: "Under review"
}, {
  key: "revision_requested",
  label: "Revision requested"
}, {
  key: "approved",
  label: "Approved"
}, {
  key: "rejected",
  label: "Rejected"
}];
function VettingQueue() {
  const {
    roles,
    loading
  } = useAuth();
  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");
  const fetchList = useServerFn(listEventsForVetting);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin", "vetting"],
    queryFn: () => fetchList(),
    enabled: isAdmin
  });
  const [open, setOpen] = reactExports.useState(null);
  if (loading) return null;
  if (!isAdmin) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldAlert, { className: "h-5 w-5" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm", children: "You don't have access to the vetting queue." })
    ] }) });
  }
  const grouped = {};
  COLUMNS.forEach((c) => grouped[c.key] = []);
  (data?.events ?? []).forEach((e) => {
    if (grouped[e.status]) grouped[e.status].push(e);
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Vetting queue" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Review submitted events and approve, reject, or send back for revisions." })
    ] }) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 flex items-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-8 grid gap-4 xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1", children: COLUMNS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/30 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: c.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-card px-2 py-0.5", children: grouped[c.key].length })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        grouped[c.key].map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setOpen(e.id), className: "block w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-primary", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: e.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: [e.event_type, e.city, e.country].filter(Boolean).join(" · ") || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] text-muted-foreground", children: e.organiser_email })
        ] }, e.id)),
        grouped[c.key].length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground", children: "Empty" })
      ] })
    ] }, c.key)) }),
    open && /* @__PURE__ */ jsxRuntimeExports.jsx(VettingDrawer, { id: open, onClose: () => setOpen(null) })
  ] });
}
function VettingDrawer({
  id,
  onClose
}) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(getEventForAdmin);
  const setStatus = useServerFn(setEventVettingStatus);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchOne({
      data: {
        id
      }
    })
  });
  const [note, setNote] = reactExports.useState("");
  const transition = useMutation({
    mutationFn: (to) => setStatus({
      data: {
        id,
        to_status: to,
        note: note || null
      }
    }),
    onSuccess: (_res, to) => {
      toast.success(`Moved to ${to.replace(/_/g, " ")}`);
      qc.invalidateQueries({
        queryKey: ["admin", "vetting"]
      });
      qc.invalidateQueries({
        queryKey: ["admin", "event", id]
      });
      setNote("");
      if (to === "approved" || to === "rejected" || to === "listed") onClose();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex justify-end bg-black/40", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "text-sm text-muted-foreground hover:text-foreground", children: "× Close" }),
      data && /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: data.event.status })
    ] }),
    isLoading || !data ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex items-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading event…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold", children: data.event.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: data.organiser?.email }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "mt-6 grid grid-cols-2 gap-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Type", value: data.event.event_type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Format", value: data.event.format }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Start", value: data.event.start_date }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "End", value: data.event.end_date }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Location", value: [data.event.city, data.event.country].filter(Boolean).join(", ") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Attendance", value: data.event.attendance_size }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Primary sector", value: data.event.primary_sector }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Info, { label: "Min spend", value: data.event.min_sponsorship_spend ? `${data.event.currency} ${Number(data.event.min_sponsorship_spend).toLocaleString()}` : "-" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-5 space-y-1.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLink, { label: "Sponsorship deck", url: data.event.sponsorship_deck_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLink, { label: "Banner image", url: data.event.banner_image_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLink, { label: "Floor plan", url: data.event.floor_plan_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLink, { label: "Event website", url: data.event.website })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
          "Tiers (",
          data.tiers.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: data.tiers.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-md border border-border bg-card p-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold", children: t.tier_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            t.currency,
            " ",
            Number(t.price).toLocaleString(),
            " · ",
            t.slots_total,
            " slot(s)"
          ] })
        ] }, t.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 border-t border-border pt-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Note to organiser (for revisions / rejection)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: note, onChange: (e) => setNote(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-2", children: [
          data.event.status === "submitted" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("under_review"), variant: "primary", icon: ArrowRight, label: "Start review", pending: transition.isPending }),
          data.event.status === "under_review" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("approved"), variant: "success", icon: CircleCheck, label: "Approve", pending: transition.isPending }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("revision_requested"), variant: "warning", icon: Pencil, label: "Request revision", pending: transition.isPending }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("rejected"), variant: "danger", icon: CircleX, label: "Reject", pending: transition.isPending })
          ] }),
          data.event.status === "approved" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("listed"), variant: "primary", icon: ArrowRight, label: "List publicly", pending: transition.isPending })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 flex flex-wrap gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/edit/$id", params: {
            id
          }, className: "text-xs text-primary hover:underline", children: "View full event editor →" }),
          (data.event.status === "approved" || data.event.status === "listed") && data.event.slug && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/$slug", params: {
            slug: data.event.slug
          }, className: "text-xs text-primary hover:underline", children: "View public listing →" })
        ] })
      ] })
    ] })
  ] }) });
}
function Info({
  label,
  value
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-0.5", children: value ?? "-" })
  ] });
}
function AssetLink({
  label,
  url
}) {
  if (!url) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
    label,
    ": ",
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic", children: "not provided" })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: url, target: "_blank", rel: "noreferrer", className: "block truncate text-sm text-primary hover:underline", children: [
    label,
    " ↗"
  ] });
}
function ActionBtn({
  onClick,
  variant,
  icon: Icon,
  label,
  pending
}) {
  const cls = variant === "primary" ? "bg-brand-gradient text-white" : variant === "success" ? "bg-secondary text-secondary-foreground" : variant === "warning" ? "bg-amber-500 text-white" : "bg-destructive text-destructive-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: pending, onClick, className: `inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50 ${cls}`, children: [
    pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-4 w-4" }),
    " ",
    label
  ] });
}
export {
  VettingQueue as component
};
