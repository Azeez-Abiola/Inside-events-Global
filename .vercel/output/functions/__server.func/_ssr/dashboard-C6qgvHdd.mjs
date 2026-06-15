import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { L as Link, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { A as AppShell, S as StatusBadge } from "./app-shell-B89gTHZ9.mjs";
import { u as useAuth, n as useServerFn, j as getReferralDashboard, l as listMarketplaceEvents, g as generateReferralLink, f as createSsrRpc } from "./router-4-w4Upb_.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { e as getMyEvents, c as createEventDraft, d as deleteDraftEvent } from "./events.functions-CrEuJg7H.mjs";
import { b as adminGetRevenue, c as adminListFraudFlags, e as adminResolveFraudFlag, h as adminUpsertCommissionConfig, a as adminCreateDeal, f as adminUpdateDealStatus, d as adminMarkCommissionPaid, i as getOrganiserPipeline, j as getSponsorDashboard } from "./deals.functions-BR3-t1sS.mjs";
import { a as fmtMoney } from "./currency-Cm9QA4xQ.mjs";
import { d as createServerFn } from "./server-Dl4ga8RB.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DnNqQzIF.mjs";
import { s as supabase } from "./client-BhermGBt.mjs";
import { l as listEventsForVetting, g as getEventForAdmin, s as setEventVettingStatus } from "./admin.functions-CKqdtjXT.mjs";
import "../_libs/seroval.mjs";
import { K as LoaderCircle, a2 as ShieldCheck, ac as Users, D as DollarSign, a8 as TriangleAlert, j as Check, ae as X, a3 as SlidersHorizontal, b as Award, ad as Wallet, I as Inbox, a as ArrowRight, W as Plus, f as CalendarDays, u as Eye, R as MessageSquare, x as FolderOpen, c as Bookmark, i as ChartColumn, C as Calendar, J as Link2, S as MousePointerClick, a7 as TrendingUp, o as Copy, Q as MessageCircle, a0 as Share2, N as Mail, T as Newspaper, m as CircleCheck, U as Pencil, n as CircleX, O as MapPin, t as ExternalLink, a6 as Trash2, $ as Send } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
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
function StatCard({
  icon: Icon,
  label,
  value,
  loading
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-5 hover:shadow-soft transition-all duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-5 w-5 text-primary" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 font-display text-2xl font-bold text-foreground", children: loading ? "…" : value }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-xs uppercase tracking-wider font-semibold text-muted-foreground", children: label })
  ] });
}
function fmtDateRange(s, e) {
  if (!s) return "";
  const fmt = (d) => new Date(d).toLocaleDateString(void 0, { day: "numeric", month: "short", year: "numeric" });
  return e && e !== s ? `${fmt(s)} – ${fmt(e)}` : fmt(s);
}
function DashboardHeader({
  title,
  subtitle,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl", children: title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1.5 max-w-2xl text-sm text-muted-foreground", children: subtitle })
    ] }),
    action
  ] });
}
function DashboardTabs({
  tabs,
  active,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 overflow-x-auto pb-px", children: tabs.map((tab) => {
    const selected = active === tab.id;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        type: "button",
        onClick: () => onChange(tab.id),
        className: `shrink-0 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${selected ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`,
        children: [
          tab.label,
          tab.count !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `ml-2 rounded-full px-2 py-0.5 text-[11px] ${selected ? "bg-brand-soft text-primary-deep" : "bg-muted text-muted-foreground"}`, children: tab.count })
        ]
      },
      tab.id
    );
  }) }) });
}
function DashboardPanel({
  title,
  description,
  children,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "rounded-xl border border-border bg-card overflow-hidden", children: [
    (title || action) && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 px-5 py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        title && /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-base font-bold text-foreground", children: title }),
        description && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-0.5 text-xs text-muted-foreground", children: description })
      ] }),
      action
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-5", children })
  ] });
}
function DashboardEmpty({
  icon: Icon,
  title,
  description,
  action
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "mx-auto h-10 w-10 text-muted-foreground" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "mt-4 font-display text-lg font-bold text-foreground", children: title }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-2 max-w-md text-sm text-muted-foreground", children: description }),
    action && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-5", children: action })
  ] });
}
function DashboardLoading({ label = "Loading workspace…" }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center py-16 text-muted-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-5 w-5 animate-spin text-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-medium", children: label })
  ] });
}
const VETTING_STEPS = [
  { key: "draft", label: "Draft" },
  { key: "submitted", label: "Submitted" },
  { key: "under_review", label: "Under review" },
  { key: "approved", label: "Approved" },
  { key: "listed", label: "Listed" }
];
function VettingTimeline({ status }) {
  const terminal = ["revision_requested", "rejected", "closed", "archived"].includes(status);
  const activeIdx = VETTING_STEPS.findIndex((s) => s.key === status);
  const revision = status === "revision_requested";
  const rejected = status === "rejected";
  if (terminal && !revision && !rejected && !VETTING_STEPS.some((s) => s.key === status)) {
    return null;
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-lg border border-border bg-muted/20 p-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground", children: "Vetting progress" }),
    revision && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-amber-800", children: "IGE requested revisions — update your listing and resubmit when ready." }),
    rejected && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-red-800", children: "This listing was not approved. Check reviewer notes on the event editor." }),
    !revision && !rejected && /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "mt-2 flex flex-wrap gap-2", children: VETTING_STEPS.map((step, i) => {
      const done = activeIdx > i;
      const current = activeIdx === i;
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "li",
        {
          className: `rounded-full px-2.5 py-1 text-[11px] font-semibold ${current ? "bg-brand-gradient text-white" : done ? "bg-secondary/15 text-secondary-deep" : "bg-muted text-muted-foreground"}`,
          children: step.label
        },
        step.key
      );
    }) })
  ] });
}
const EVENT_STATUS_GROUPS = {
  draft: {
    label: "Drafts",
    statuses: ["draft"],
    description: "Events you are still building."
  },
  pending: {
    label: "Pending vetting",
    statuses: ["submitted", "under_review"],
    description: "Submitted to IGE and awaiting admin review."
  },
  approved: {
    label: "Approved",
    statuses: ["approved"],
    description: "IGE vetted — awaiting public listing on the marketplace."
  },
  live: {
    label: "Live",
    statuses: ["listed"],
    description: "Public on the marketplace and open to sponsors."
  },
  revision: {
    label: "Revision requested",
    statuses: ["revision_requested"],
    description: "Sent back for updates before resubmission."
  },
  rejected: {
    label: "Rejected",
    statuses: ["rejected"],
    description: "Not approved for listing."
  },
  past: {
    label: "Closed",
    statuses: ["closed", "archived"],
    description: "Past or archived events."
  }
};
function groupEventsByStatus(events) {
  const counts = {
    all: events.length,
    draft: 0,
    pending: 0,
    approved: 0,
    live: 0,
    revision: 0,
    rejected: 0,
    past: 0
  };
  const buckets = {
    draft: [],
    pending: [],
    approved: [],
    live: [],
    revision: [],
    rejected: [],
    past: []
  };
  for (const event of events) {
    for (const [group, meta] of Object.entries(EVENT_STATUS_GROUPS)) {
      if (meta.statuses.includes(event.status)) {
        buckets[group].push(event);
        counts[group]++;
        break;
      }
    }
  }
  return { counts, buckets };
}
function filterEventsByGroup(events, group) {
  if (group === "all") return events;
  const statuses = EVENT_STATUS_GROUPS[group].statuses;
  return events.filter((e) => statuses.includes(e.status));
}
const EVENT_TABS = [
  { id: "all", label: "All events" },
  { id: "draft", label: "Drafts" },
  { id: "pending", label: "Pending vetting" },
  { id: "approved", label: "Approved" },
  { id: "live", label: "Live" },
  { id: "revision", label: "Revisions" },
  { id: "rejected", label: "Rejected" },
  { id: "past", label: "Closed" }
];
function OrganiserDashboard() {
  const [mainTab, setMainTab] = reactExports.useState("events");
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEvents = useServerFn(getMyEvents);
  const fetchPipeline = useServerFn(getOrganiserPipeline);
  const createDraft = useServerFn(createEventDraft);
  const removeDraft = useServerFn(deleteDraftEvent);
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => fetchEvents()
  });
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ["org-pipeline"],
    queryFn: () => fetchPipeline()
  });
  const create = useMutation({
    mutationFn: () => createDraft(),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      navigate({ to: "/events/edit/$id", params: { id } });
    },
    onError: (e) => toast.error(e.message)
  });
  const del = useMutation({
    mutationFn: (id) => removeDraft({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      toast.success("Draft deleted");
    },
    onError: (e) => toast.error(e.message)
  });
  const events = eventsData?.events ?? [];
  const { counts, buckets } = reactExports.useMemo(() => groupEventsByStatus(events), [events]);
  const filteredEvents = reactExports.useMemo(
    () => filterEventsByGroup(events, statusFilter),
    [events, statusFilter]
  );
  const activeEventsCount = counts.approved + counts.live;
  const pendingVettingCount = counts.pending;
  const totalViews = events.reduce((acc, e) => acc + (e.view_count ?? 0), 0);
  const totalInquiries = events.reduce((acc, e) => acc + (e.inquiry_count ?? 0), 0);
  const totalSaves = events.reduce((acc, e) => acc + (e.save_count ?? 0), 0);
  const closedDeals = (pipelineData?.deals ?? []).filter((d) => d.status === "payment_received").length;
  const createBtn = /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => create.mutate(),
      disabled: create.isPending,
      className: "inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-60",
      children: [
        create.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        "Create event"
      ]
    }
  );
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        title: "Organiser workspace",
        subtitle: "Manage your event listings, track IGE vetting status, and monitor sponsor inquiries across your portfolio.",
        action: createBtn
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarDays, label: "Active listings", value: activeEventsCount, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "Pending vetting", value: pendingVettingCount, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Eye, label: "Profile views", value: totalViews, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MessageSquare, label: "Sponsor inquiries", value: totalInquiries, loading: eventsLoading })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardTabs,
      {
        active: mainTab,
        onChange: (id) => setMainTab(id),
        tabs: [
          { id: "events", label: "My events", count: events.length },
          { id: "pipeline", label: "Sponsorship pipeline", count: pipelineData?.forms?.length ?? 0 },
          { id: "analytics", label: "Analytics" }
        ]
      }
    ),
    mainTab === "events" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashboardTabs,
        {
          active: statusFilter,
          onChange: (id) => setStatusFilter(id),
          tabs: EVENT_TABS.map((t) => ({
            id: t.id,
            label: t.label,
            count: counts[t.id]
          }))
        }
      ),
      statusFilter !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: EVENT_STATUS_GROUPS[statusFilter]?.description }),
      eventsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading your events…" }) : filteredEvents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashboardEmpty,
        {
          icon: FolderOpen,
          title: statusFilter === "all" ? "No events yet" : `No ${EVENT_TABS.find((t) => t.id === statusFilter)?.label.toLowerCase()}`,
          description: statusFilter === "all" ? "Create your first event draft to start the IGE vetting flow. Your progress auto-saves at every step." : "Events in this status will appear here once created or submitted.",
          action: statusFilter === "all" ? createBtn : void 0
        }
      ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: filteredEvents.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(
        EventCard,
        {
          event: e,
          onDelete: () => {
            if (confirm("Delete this draft?")) del.mutate(e.id);
          },
          showVettingTimeline: ["submitted", "under_review", "approved", "revision_requested", "rejected"].includes(e.status)
        },
        e.id
      )) }),
      counts.revision > 0 && statusFilter !== "revision" && /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title: "Action needed", description: "Events sent back for revision", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: buckets.revision.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/events/edit/$id",
          params: { id: e.id },
          className: "flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:border-amber-300",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-amber-950", children: e.name || "Untitled event" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-amber-800", children: "Continue editing →" })
          ]
        },
        e.id
      )) }) })
    ] }),
    mainTab === "pipeline" && (pipelineLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading sponsorship pipeline…" }) : !pipelineData?.events?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardEmpty,
      {
        icon: MessageSquare,
        title: "No live pipeline yet",
        description: "Once an event is listed on the marketplace, sponsor commitment forms and deal stages will appear here.",
        action: createBtn
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: pipelineData.events.map((ev) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      PipelineEventTable,
      {
        event: ev,
        forms: (pipelineData.forms ?? []).filter((f) => f.event_id === ev.id),
        deals: (pipelineData.deals ?? []).filter((d) => d.event_id === ev.id)
      },
      ev.id
    )) })),
    mainTab === "analytics" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Eye, label: "Total profile views", value: totalViews, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Times saved by sponsors", value: totalSaves, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MessageSquare, label: "Commitment inquiries", value: totalInquiries, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ChartColumn, label: "Closed deals", value: closedDeals, loading: pipelineLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarDays, label: "Total events", value: events.length, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "IGE vetted", value: events.filter((e) => e.ige_vetted).length, loading: eventsLoading })
    ] })
  ] }) });
}
function EventCard({
  event: e,
  onDelete,
  showVettingTimeline
}) {
  const isLive = e.status === "listed" || e.status === "approved";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/events/edit/$id",
            params: { id: e.id },
            className: "font-display text-base font-bold text-foreground hover:text-primary-deep",
            children: e.name || "Untitled event"
          }
        ),
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
          e.view_count ?? 0,
          " views"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          e.save_count ?? 0,
          " saves"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
          e.inquiry_count ?? 0,
          " inquiries"
        ] })
      ] }),
      showVettingTimeline && /* @__PURE__ */ jsxRuntimeExports.jsx(VettingTimeline, { status: e.status })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex shrink-0 flex-col items-end gap-2", children: [
      isLive && e.slug && /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Link,
        {
          to: "/events/$slug",
          params: { slug: e.slug },
          className: "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline",
          children: [
            "View listing ",
            /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
          ]
        }
      ),
      e.status === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: onDelete,
          className: "rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
          children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" })
        }
      )
    ] })
  ] }) });
}
function PipelineEventTable({
  event: ev,
  forms,
  deals
}) {
  const dealByForm = {};
  for (const d of deals) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    DashboardPanel,
    {
      title: ev.name,
      description: [ev.city, ev.country].filter(Boolean).join(", "),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4 flex gap-4 text-xs text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "h-3 w-3" }),
            " ",
            ev.view_count ?? 0,
            " views"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-3 w-3" }),
            " ",
            ev.save_count ?? 0,
            " saves"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-3 w-3" }),
            " ",
            ev.inquiry_count ?? 0,
            " inquiries"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto -mx-5 px-5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full min-w-[700px] text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Company" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Contact" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Budget" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Referral" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Deal stage" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Submitted" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
            forms.map((f) => {
              const deal = dealByForm[f.id];
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 font-medium", children: f.company_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-muted-foreground", children: f.contact_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs font-semibold", children: f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs text-muted-foreground", children: f.referral_partner_id ? "Partner referred" : "Direct" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 capitalize", children: deal ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-deep", children: deal.status.replace(/_/g, " ") }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground", children: "Awaiting deal" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs text-muted-foreground", children: f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "—" })
              ] }, f.id);
            }),
            !forms.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 6, className: "px-3 py-8 text-center text-sm text-muted-foreground italic", children: "No sponsor inquiries yet for this event." }) })
          ] })
        ] }) })
      ]
    }
  );
}
function SponsorDashboard() {
  const [activeTab, setActiveTab] = reactExports.useState("commitments");
  const fetch = useServerFn(getSponsorDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["sponsor-dash"], queryFn: () => fetch() });
  const commitmentsCount = data?.forms?.length ?? 0;
  const savedEventsCount = data?.saves?.length ?? 0;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        title: "Sponsor workspace",
        subtitle: "Discover vetted B2B events, track sponsorship commitments, and save opportunities for your brand.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Link,
          {
            to: "/marketplace",
            className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all",
            children: "Explore marketplace"
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Inbox, label: "Submitted commitments", value: commitmentsCount, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Saved events", value: savedEventsCount, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarDays, label: "New listings", value: data?.freshEvents?.length ?? 0, loading: isLoading })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardTabs,
      {
        active: activeTab,
        onChange: (id) => setActiveTab(id),
        tabs: [
          { id: "commitments", label: "My commitments", count: commitmentsCount },
          { id: "saved", label: "Saved events", count: savedEventsCount },
          { id: "fresh", label: "Discover", count: data?.freshEvents?.length ?? 0 }
        ]
      }
    ),
    activeTab === "commitments" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[600px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Proposed Budget" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Submitted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
        (data?.forms ?? []).map((f) => {
          const ev = data.eventMap[f.event_id];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground", children: ev?.name ?? "-" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: [ev?.city, ev?.country].filter(Boolean).join(", ") })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs font-semibold", children: f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs text-muted-foreground", children: f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-right", children: ev?.slug && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/$slug", params: { slug: ev.slug }, className: "text-xs text-primary font-bold hover:underline", children: "View event →" }) })
          ] }, f.id);
        }),
        !isLoading && !data?.forms?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { colSpan: 4, className: "px-5 py-12 text-center text-muted-foreground", children: [
          "No commitments submitted yet.",
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "text-primary hover:underline font-semibold", children: "Browse marketplace" })
        ] }) })
      ] })
    ] }) }) }) : activeTab === "saved" ? isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : !data?.saves?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardEmpty,
      {
        icon: Bookmark,
        title: "No saved events",
        description: "Browse the marketplace and save events that match your sponsorship criteria.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "text-sm font-semibold text-primary hover:underline", children: "Explore marketplace →" })
      }
    ) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: (data?.saves ?? []).map((s) => {
      const ev = data.eventMap[s.event_id];
      if (!ev?.slug) return null;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: ev.slug }, className: "group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft hover:border-primary", children: [
        ev.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ev.banner_image_url, alt: ev.name, className: "h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 bg-muted flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground group-hover:text-primary-deep transition-colors truncate", children: ev.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: [ev.city, ev.country].filter(Boolean).join(", ") })
        ] })
      ] }, s.event_id);
    }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: (data?.freshEvents ?? []).map(
      (e) => e.slug ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: e.slug }, className: "group overflow-hidden rounded-xl border border-border bg-card hover:shadow-soft hover:border-primary transition-all duration-300", children: [
        e.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: e.banner_image_url, alt: e.name, className: "h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 bg-muted flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground truncate group-hover:text-primary-deep transition-colors", children: e.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground truncate", children: [
            e.primary_sector,
            " · ",
            [e.city, e.country].filter(Boolean).join(", ")
          ] })
        ] })
      ] }, e.id) : null
    ) })
  ] }) });
}
function ReferralDashboard() {
  const [activeTab, setActiveTab] = reactExports.useState("links");
  const [pickerOpen, setPickerOpen] = reactExports.useState(false);
  const fetch = useServerFn(getReferralDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["referral-dash"], queryFn: () => fetch() });
  const activeLinks = data?.stats.linkCount ?? 0;
  const totalClicks = data?.stats.clickCount ?? 0;
  const conversions = data?.stats.conversionCount ?? 0;
  const earnedCommission = `$${(data?.totals.earned ?? 0).toFixed(0)}`;
  const handleCopy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        title: "Referral partner workspace",
        subtitle: "Generate trackable Vouch Links, refer sponsors to vetted events, and monitor commission as deals close.",
        action: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            type: "button",
            onClick: () => setPickerOpen(true),
            className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
              " Generate link"
            ]
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Link2, label: "Active links", value: activeLinks, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MousePointerClick, label: "Total clicks", value: totalClicks, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: TrendingUp, label: "Conversions", value: conversions, loading: isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Wallet, label: "Earned (USD)", value: earnedCommission, loading: isLoading })
    ] }),
    data?.profile?.igb_partner_badge && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary-deep", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "h-4 w-4" }),
      " IGB Partner — premium commission tier"
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardTabs,
      {
        active: activeTab,
        onChange: (id) => setActiveTab(id),
        tabs: [
          { id: "links", label: "My referrals", count: activeLinks },
          { id: "deals", label: "Commission pipeline", count: data?.deals?.length ?? 0 }
        ]
      }
    ),
    activeTab === "links" ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Referral Link" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Clicks" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Commission Rate" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
        (data?.links ?? []).map((l) => {
          const ev = data.events[l.event_id];
          const url = typeof window !== "undefined" ? `${window.location.origin}/r/${l.short_code}` : `/r/${l.short_code}`;
          const shareText = `Sponsor ${ev?.name ?? "this event"} via IGE: ${url}`;
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-medium text-foreground", children: ev?.name ?? "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => handleCopy(url), className: "inline-flex items-center gap-1.5 rounded-md bg-muted/80 hover:bg-muted px-2.5 py-1.5 font-mono text-xs text-primary transition-all cursor-pointer border border-border", children: [
                "/r/",
                l.short_code,
                " ",
                /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "h-3 w-3" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://wa.me/?text=${encodeURIComponent(shareText)}`, target: "_blank", rel: "noreferrer", title: "Share on WhatsApp", className: "rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-emerald-600 transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MessageCircle, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, target: "_blank", rel: "noreferrer", title: "Share on LinkedIn", className: "rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "h-3.5 w-3.5" }) }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:?subject=${encodeURIComponent("Sponsorship opportunity on IGE")}&body=${encodeURIComponent(shareText)}`, title: "Share via email", className: "rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Mail, { className: "h-3.5 w-3.5" }) })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-semibold text-foreground", children: l.click_count }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3.5 font-medium", children: [
              (Number(l.commission_rate) * 100).toFixed(1),
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary-deep capitalize", children: l.status }) })
          ] }, l.id);
        }),
        !isLoading && !data?.links?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-5 py-12 text-center text-muted-foreground", children: "No referral links yet. Generate one to start sharing." }) })
      ] })
    ] }) }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Status" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Deal Value" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Your Commission" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Payout" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
        (data?.deals ?? []).map((d) => {
          const ev = data.events[d.event_id];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-medium text-foreground", children: ev?.name ?? "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 capitalize text-muted-foreground", children: d.status.replace(/_/g, " ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs font-semibold", children: d.deal_value_native ? `${d.deal_currency} ${Number(d.deal_value_native).toLocaleString()}` : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs font-semibold text-primary-deep", children: d.referral_commission_usd ? `$${Number(d.referral_commission_usd).toFixed(0)}` : "-" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: d.referral_commission_paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800", children: "Paid" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800", children: "Pending" }) })
          ] }, d.id);
        }),
        !isLoading && !data?.deals?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-5 py-12 text-center text-muted-foreground italic", children: "No referred deals in pipeline yet." }) })
      ] })
    ] }) }) }),
    pickerOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(EventPicker, { onClose: () => setPickerOpen(false) })
  ] }) });
}
function EventPicker({ onClose }) {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const gen = useServerFn(generateReferralLink);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["picker-events"],
    queryFn: () => fetchEvents({ data: { vetted_only: true, per_page: 24 } })
  });
  const mutation = useMutation({
    mutationFn: (event_id) => gen({ data: { event_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-dash"] });
      onClose();
      toast.success("Link generated successfully!");
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold text-foreground", children: "Generate Referral Link" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Choose a vetted IGE event to generate a trackable link." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-2", children: [
      (data?.events ?? []).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
        "button",
        {
          onClick: () => mutation.mutate(e.id),
          disabled: mutation.isPending,
          className: "flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left hover:bg-muted/30 disabled:opacity-50 transition-colors cursor-pointer",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground text-sm", children: e.name }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: [e.city, e.country].filter(Boolean).join(", ") }),
              e.starting && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-[11px] text-secondary-deep", children: [
                "Est. commission ",
                fmtMoney(e.starting.currency, Number(e.starting.price) * 0.07),
                " – ",
                fmtMoney(e.starting.currency, Number(e.starting.price) * 0.12),
                " on the entry tier"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-primary font-bold hover:underline whitespace-nowrap", children: "Generate →" })
          ]
        },
        e.id
      )),
      data?.events?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-center py-6 text-muted-foreground text-sm italic", children: "No vetted events available." })
    ] }),
    mutation.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-3 text-sm text-destructive", children: mutation.error.message })
  ] }) });
}
const RequestInput = objectType({
  event_id: stringType().uuid(),
  request_type: enumType(["coverage", "press_credentials", "content"]).default("coverage"),
  message: stringType().trim().max(1e3).optional().nullable()
});
const submitMediaRequest = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => RequestInput.parse(d)).handler(createSsrRpc("d7e3322052c4f2176d1f92a1b65923ca2734ef6bfe940caceabc1619a74eb9d6"));
const getMyMediaRequests = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("66d75df2d65bae0d952fc0cf9448a4184830d67f412b5d9d3ccecf2b04ef184c"));
function MediaPartnerDashboard() {
  const [activeTab, setActiveTab] = reactExports.useState("explore");
  const [requestEvent, setRequestEvent] = reactExports.useState(null);
  const fetchMarketplace = useServerFn(listMarketplaceEvents);
  const fetchSaves = useServerFn(getSponsorDashboard);
  const fetchRequests = useServerFn(getMyMediaRequests);
  const { data: marketplaceData, isLoading: exploreLoading } = useQuery({
    queryKey: ["media-partner-marketplace"],
    queryFn: () => fetchMarketplace({ data: { vetted_only: true, per_page: 12 } })
  });
  const { data: savesData, isLoading: savesLoading } = useQuery({
    queryKey: ["sponsor-dash"],
    queryFn: () => fetchSaves()
  });
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["media-requests"],
    queryFn: () => fetchRequests()
  });
  const events = marketplaceData?.events ?? [];
  const savedEvents = (savesData?.saves ?? []).map((s) => savesData?.eventMap[s.event_id]).filter(Boolean);
  const requests = requestsData?.requests ?? [];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashboardHeader,
        {
          title: "Media partner workspace",
          subtitle: "Discover vetted events to cover and request press credentials or coverage access."
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarDays, label: "Events to cover", value: events.length, loading: exploreLoading }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Saved opportunities", value: savedEvents.length, loading: savesLoading }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Newspaper, label: "My requests", value: requests.length, loading: requestsLoading })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        DashboardTabs,
        {
          active: activeTab,
          onChange: (id) => setActiveTab(id),
          tabs: [
            { id: "explore", label: "Explore", count: events.length },
            { id: "saved", label: "Saved", count: savedEvents.length },
            { id: "requests", label: "My requests", count: requests.length }
          ]
        }
      ),
      activeTab === "explore" ? exploreLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: events.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card hover:shadow-soft transition-all duration-300", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: e.slug }, className: "group block", children: [
          e.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: e.banner_image_url, alt: e.name, className: "h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 bg-muted flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4 pb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground truncate group-hover:text-primary-deep transition-colors", children: e.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs text-muted-foreground truncate", children: [
              e.primary_sector,
              " · ",
              [e.city, e.country].filter(Boolean).join(", ")
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setRequestEvent({ id: e.id, name: e.name }),
            className: "mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted",
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "h-3.5 w-3.5" }),
              " Request coverage"
            ]
          }
        ) })
      ] }, e.id)) }) : activeTab === "saved" ? savesLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : savedEvents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "No saved opportunities yet." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: savedEvents.map((ev) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: ev.slug }, className: "group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft hover:border-primary", children: [
        ev.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ev.banner_image_url, alt: ev.name, className: "h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 bg-muted flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground group-hover:text-primary-deep transition-colors truncate", children: ev.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: [ev.city, ev.country].filter(Boolean).join(", ") })
        ] })
      ] }, ev.id)) }) : requestsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : requests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "No coverage requests yet. Browse Explore and request coverage on an event." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Event" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Type" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Status" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-5 py-3", children: "Requested" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: requests.map((r) => {
          const ev = requestsData.events[r.event_id];
          return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 font-medium text-foreground", children: ev?.name ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 capitalize text-muted-foreground", children: r.request_type.replace(/_/g, " ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${r.status === "approved" ? "bg-emerald-100 text-emerald-800" : r.status === "declined" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`, children: r.status }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-5 py-3.5 text-xs text-muted-foreground", children: new Date(r.created_at).toLocaleDateString() })
          ] }, r.id);
        }) })
      ] }) })
    ] }),
    requestEvent && /* @__PURE__ */ jsxRuntimeExports.jsx(CoverageRequestModal, { event: requestEvent, onClose: () => setRequestEvent(null) })
  ] });
}
function CoverageRequestModal({ event, onClose }) {
  const qc = useQueryClient();
  const submit = useServerFn(submitMediaRequest);
  const [type, setType] = reactExports.useState("coverage");
  const [message, setMessage] = reactExports.useState("");
  const mut = useMutation({
    mutationFn: () => submit({ data: { event_id: event.id, request_type: type, message: message || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-requests"] });
      toast.success("Request sent to the IGE team");
      onClose();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold text-foreground", children: "Request coverage" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
      "For ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: event.name })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-5 block text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block font-medium", children: "Request type" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: type, onChange: (e) => setType(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "coverage", children: "Event coverage" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "press_credentials", children: "Press credentials" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "content", children: "Content / documentary" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "mt-4 block text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block font-medium", children: "Message (optional)" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: message, onChange: (e) => setMessage(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm", placeholder: "Tell the IGE team about your outlet and what you'd cover…" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex justify-end gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "rounded-md px-4 py-2 text-sm font-medium hover:bg-muted", children: "Cancel" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => mut.mutate(), disabled: mut.isPending, className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-3.5 w-3.5" }),
        " ",
        mut.isPending ? "Sending…" : "Send request"
      ] })
    ] })
  ] }) });
}
const DEAL_STATUSES = [
  "inquiry_received",
  "vetting",
  "intro_made",
  "in_negotiation",
  "verbal_commitment",
  "contract_sent",
  "contract_signed",
  "payment_received",
  "closed_lost",
  "cancelled"
];
function AdminDashboard() {
  const [activeTab, setActiveTab] = reactExports.useState("vetting");
  const [activeSubTab, setActiveSubTab] = reactExports.useState("waitlist");
  const [drawerOpen, setDrawerOpen] = reactExports.useState(null);
  const qc = useQueryClient();
  const fetchVetting = useServerFn(listEventsForVetting);
  const fetchRevenue = useServerFn(adminGetRevenue);
  const fetchFraud = useServerFn(adminListFraudFlags);
  const resolveFlag = useServerFn(adminResolveFraudFlag);
  const upsertConfig = useServerFn(adminUpsertCommissionConfig);
  const fraud = useQuery({ queryKey: ["admin", "fraud"], queryFn: () => fetchFraud() });
  const resolveMut = useMutation({
    mutationFn: (v) => resolveFlag({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "fraud"] });
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Flag updated");
    },
    onError: (e) => toast.error(e.message)
  });
  const configMut = useMutation({
    mutationFn: (v) => upsertConfig({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Rates saved");
    },
    onError: (e) => toast.error(e.message)
  });
  const createDeal = useServerFn(adminCreateDeal);
  const updateDeal = useServerFn(adminUpdateDealStatus);
  const markPaid = useServerFn(adminMarkCommissionPaid);
  const createDealMut = useMutation({
    mutationFn: (commitment_form_id) => createDeal({ data: { commitment_form_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Deal created from inquiry");
    },
    onError: (e) => toast.error(e.message)
  });
  const statusMut = useMutation({
    mutationFn: (v) => updateDeal({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "revenue"] }),
    onError: (e) => toast.error(e.message)
  });
  const paidMut = useMutation({
    mutationFn: (deal_id) => markPaid({ data: { deal_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "revenue"] });
      toast.success("Commission marked paid");
    },
    onError: (e) => toast.error(e.message)
  });
  const { data: vettingData, isLoading: vettingLoading } = useQuery({
    queryKey: ["admin", "vetting"],
    queryFn: () => fetchVetting()
  });
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["admin", "revenue"],
    queryFn: () => fetchRevenue()
  });
  const waitlist = useQuery({
    queryKey: ["admin-waitlist"],
    queryFn: async () => {
      const { data, error } = await supabase.from("waitlist_signups").select("id,created_at,audience,full_name,email,company,role_title,country,phone,notes,status").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    }
  });
  const contact = useQuery({
    queryKey: ["admin-contact"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_submissions").select("id,created_at,name,email,company,subject,message,status").order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data ?? [];
    }
  });
  const groupedVetting = {
    submitted: [],
    under_review: [],
    revision_requested: [],
    approved: [],
    rejected: []
  };
  (vettingData?.events ?? []).forEach((e) => {
    if (groupedVetting[e.status]) groupedVetting[e.status].push(e);
  });
  const vettingCount = vettingData?.events?.length ?? 0;
  const waitlistCount = waitlist.data?.length ?? 0;
  const adminGmv = `$${(revenueData?.totals.gmv ?? 0).toLocaleString(void 0, { maximumFractionDigits: 0 })}`;
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardHeader,
      {
        title: "Admin control center",
        subtitle: "Vet submitted events, manage inbound signups, and track platform revenue and referral commissions."
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "Vetting queue", value: vettingCount, loading: vettingLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Users, label: "Waitlist signups", value: waitlistCount, loading: waitlist.isLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: DollarSign, label: "Deal volume (GMV)", value: adminGmv, loading: revenueLoading })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      DashboardTabs,
      {
        active: activeTab,
        onChange: (id) => setActiveTab(id),
        tabs: [
          { id: "vetting", label: "Event queue", count: vettingCount },
          { id: "submissions", label: "Submissions", count: waitlistCount + (contact.data?.length ?? 0) },
          { id: "revenue", label: "Revenue & deals" },
          {
            id: "controls",
            label: "Fraud & rates",
            count: (fraud.data?.flags ?? []).filter((f) => f.status === "open").length || void 0
          }
        ]
      }
    ),
    activeTab === "vetting" ? vettingLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 xl:grid-cols-5 md:grid-cols-3 sm:grid-cols-2 grid-cols-1", children: [
      { key: "submitted", label: "New submissions" },
      { key: "under_review", label: "Under review" },
      { key: "revision_requested", label: "Revision requested" },
      { key: "approved", label: "Approved" },
      { key: "rejected", label: "Rejected" }
    ].map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-muted/20 p-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: c.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-card px-2 py-0.5 border border-border text-[10px] font-bold", children: groupedVetting[c.key]?.length ?? 0 })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        (groupedVetting[c.key] ?? []).map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => setDrawerOpen(e.id), className: "block w-full rounded-lg border border-border bg-card p-3 text-left text-sm hover:border-primary hover:shadow-soft transition-all cursor-pointer", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground truncate", children: e.name || "Untitled" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground truncate", children: [e.event_type, e.city, e.country].filter(Boolean).join(" · ") || "-" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1.5 text-[10px] font-mono text-muted-foreground/80 truncate border-t border-border/50 pt-1", children: e.organiser_email })
        ] }, e.id)),
        groupedVetting[c.key]?.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "rounded-md border border-dashed border-border p-3 text-center text-xs text-muted-foreground italic", children: "Empty" })
      ] })
    ] }, c.key)) }) : activeTab === "submissions" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-4 border-b border-border/60 pb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveSubTab("waitlist"), className: `px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeSubTab === "waitlist" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`, children: [
          "Waitlist (",
          waitlistCount,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setActiveSubTab("contact"), className: `px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${activeSubTab === "contact" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted"}`, children: [
          "Contact Messages (",
          contact.data?.length ?? 0,
          ")"
        ] })
      ] }),
      activeSubTab === "waitlist" ? waitlist.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "Loading…" }) : !waitlist.data?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "No waitlist signups." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[800px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "When" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Audience" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Name" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Company" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Role" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Country" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: waitlist.data.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-muted px-2 py-0.5 text-xs font-medium border border-border", children: r.audience }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-foreground", children: r.full_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${r.email}`, className: "text-primary hover:underline font-medium", children: r.email }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.company ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.role_title ?? "—" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground", children: r.country ?? "—" })
        ] }, r.id)) })
      ] }) }) }) : contact.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "Loading…" }) : !contact.data?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground", children: "No contact messages." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[800px]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "When" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "From" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Subject" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Message" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: contact.data.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground whitespace-nowrap", children: new Date(r.created_at).toLocaleString() }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: r.name }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: `mailto:${r.email}`, className: "text-xs text-primary hover:underline", children: r.email }),
            r.company && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground", children: r.company })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-foreground max-w-[150px] truncate", title: r.subject, children: r.subject }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-muted-foreground text-xs whitespace-pre-wrap max-w-[400px]", children: r.message }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded bg-muted px-2 py-0.5 text-xs font-semibold", children: r.status }) })
        ] }, r.id)) })
      ] }) }) })
    ] }) : activeTab === "controls" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display text-base font-bold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-4 w-4 text-destructive" }),
          " Fraud flags"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Self-referral and suspicious-attribution flags raised by the system." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-xl border border-border bg-card overflow-hidden", children: fraud.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-8 text-center text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "inline h-4 w-4 animate-spin" }),
          " Loading…"
        ] }) : !(fraud.data?.flags ?? []).length ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-8 text-center text-muted-foreground text-sm", children: "No fraud flags. Clean slate." }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Type" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Description" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Status" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Action" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-border", children: (fraud.data?.flags ?? []).map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-foreground capitalize", children: (f.flag_type || "").replace(/_/g, " ") }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs text-muted-foreground max-w-[360px]", children: f.description ?? "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${f.status === "open" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`, children: f.status }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: f.status === "open" ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => resolveMut.mutate({ id: f.id, status: "actioned" }), disabled: resolveMut.isPending, className: "inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }),
                " Action"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => resolveMut.mutate({ id: f.id, status: "dismissed" }), disabled: resolveMut.isPending, className: "inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-semibold hover:bg-muted disabled:opacity-50", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" }),
                " Dismiss"
              ] })
            ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground italic", children: "reviewed" }) })
          ] }, f.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display text-base font-bold text-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4 text-primary" }),
          " Commission rates"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground", children: "Per event-type category. Standard/premium = referral partner share; platform = IGE take." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 rounded-xl border border-border bg-card overflow-hidden overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[640px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Category" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Standard %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Premium %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Platform %" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
            (revenueData?.commissionConfig ?? []).map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(CommissionRow, { config: c, onSave: (v) => configMut.mutate(v), saving: configMut.isPending }, c.event_type_category)),
            !(revenueData?.commissionConfig ?? []).length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 5, className: "px-4 py-8 text-center text-muted-foreground text-sm", children: "No commission config rows." }) })
          ] })
        ] }) })
      ] })
    ] }) : revenueLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: DollarSign, label: "Deal GMV (Total)", value: `$${Number(revenueData?.totals.gmv ?? 0).toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Award, label: "IGE Commission (Total)", value: `$${Number(revenueData?.totals.abw ?? 0).toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Wallet, label: "Partner Owed", value: `$${Number(revenueData?.totals.refOwed ?? 0).toLocaleString()}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Inbox, label: "Open Deals", value: revenueData?.totals.open ?? 0 })
      ] }),
      (revenueData?.inquiries ?? []).length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-amber-300/60 bg-amber-50/50 overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-5 py-4 border-b border-amber-200/60 flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Inbox, { className: "h-4 w-4 text-amber-700" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-display font-semibold text-base text-foreground", children: [
            "Pending inquiries (",
            (revenueData?.inquiries ?? []).length,
            ")"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[700px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-amber-100/40 text-left text-xs uppercase tracking-wide border-b border-amber-200/60 text-amber-800", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Event" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Company" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Budget" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Referral" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Action" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("tbody", { className: "divide-y divide-amber-200/40", children: (revenueData?.inquiries ?? []).map((f) => {
            const ev = revenueData.events[f.event_id];
            return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-amber-100/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-semibold text-foreground", children: ev?.name ?? "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium text-foreground", children: f.company_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: f.contact_name })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 text-xs font-semibold", children: f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "—" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                f.referral_partner_id ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary-deep", children: "Attributed" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Direct" }),
                Array.isArray(f.fraud_flags) && f.fraud_flags.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-1 inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "h-2.5 w-2.5" }),
                  " flag"
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "button",
                {
                  onClick: () => createDealMut.mutate(f.id),
                  disabled: createDealMut.isPending,
                  className: "inline-flex items-center gap-1 rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-3 w-3" }),
                    " Create deal"
                  ]
                }
              ) })
            ] }, f.id);
          }) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-muted/20 px-5 py-4 border-b border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display font-semibold text-base text-foreground", children: "Deal pipeline" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: "Set the deal value, advance the stage; commission auto-calculates at “payment received.”" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[920px]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("thead", { className: "bg-muted/30 text-left text-xs uppercase tracking-wide border-b border-border text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Event" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Value" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "USD" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "IGE" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Partner" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Stage" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-4 py-3", children: "Payout" })
          ] }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("tbody", { className: "divide-y divide-border", children: [
            (revenueData?.deals ?? []).map((d) => {
              const ev = revenueData.events[d.event_id];
              return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10 transition-colors align-top", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: ev?.name ?? "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: [ev?.city, ev?.country].filter(Boolean).join(", ") })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-4 py-3", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "input",
                    {
                      type: "number",
                      defaultValue: d.deal_value_native ?? "",
                      onBlur: (e) => {
                        const v = Number(e.target.value);
                        if (v && v !== Number(d.deal_value_native)) statusMut.mutate({ id: d.id, status: d.status, deal_value_native: v });
                      },
                      className: "w-28 rounded border border-border bg-transparent px-2 py-1 text-xs"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-0.5 text-[10px] text-muted-foreground", children: d.deal_currency })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs", children: d.deal_value_usd ? fmtMoney("USD", Number(d.deal_value_usd)) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-mono text-xs", children: d.abw_commission_usd ? fmtMoney("USD", Number(d.abw_commission_usd)) : "—" }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: d.referral_partner_id ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs", children: d.referral_commission_usd ? fmtMoney("USD", Number(d.referral_commission_usd)) : "—" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: d.referral_commission_paid ? "Paid" : "Owed" })
                ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "—" }) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  "select",
                  {
                    value: d.status,
                    onChange: (e) => statusMut.mutate({ id: d.id, status: e.target.value }),
                    className: "rounded border border-border bg-transparent px-2 py-1 text-xs capitalize",
                    children: DEAL_STATUSES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: s, children: s.replace(/_/g, " ") }, s))
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: d.referral_partner_id && d.status === "payment_received" && !d.referral_commission_paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => paidMut.mutate(d.id), disabled: paidMut.isPending, className: "rounded bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground hover:opacity-90 disabled:opacity-50", children: "Mark paid" }) : d.referral_commission_paid ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "inline-flex rounded bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800", children: "Paid" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground italic", children: "—" }) })
              ] }, d.id);
            }),
            !(revenueData?.deals ?? []).length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "px-4 py-10 text-center text-muted-foreground", children: "No deals yet. Convert a pending inquiry above to start the pipeline." }) })
          ] })
        ] }) })
      ] })
    ] }),
    drawerOpen && /* @__PURE__ */ jsxRuntimeExports.jsx(VettingDrawer, { id: drawerOpen, onClose: () => setDrawerOpen(null) })
  ] }) });
}
function VettingDrawer({ id, onClose }) {
  const qc = useQueryClient();
  const fetchOne = useServerFn(getEventForAdmin);
  const setStatus = useServerFn(setEventVettingStatus);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "event", id],
    queryFn: () => fetchOne({ data: { id } })
  });
  const [note, setNote] = reactExports.useState("");
  const transition = useMutation({
    mutationFn: (to) => setStatus({ data: { id, to_status: to, note: note || null } }),
    onSuccess: (_res, to) => {
      toast.success(`Moved to ${to.replace(/_/g, " ")}`);
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      qc.invalidateQueries({ queryKey: ["admin", "event", id] });
      setNote("");
      if (to === "approved" || to === "rejected" || to === "listed") onClose();
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 flex justify-end bg-black/50", onClick: onClose, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full w-full max-w-xl overflow-y-auto bg-background p-6 shadow-2xl border-l border-border flex flex-col justify-between", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between border-b border-border pb-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "text-sm font-semibold text-muted-foreground hover:text-foreground cursor-pointer", children: "✕ Close" }),
      data && /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: data.event.status })
    ] }),
    isLoading || !data ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex justify-center text-muted-foreground text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin text-primary" }),
      " Loading event details…"
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 space-y-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-bold text-foreground leading-tight", children: data.event.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-xs text-muted-foreground font-mono", children: data.organiser?.email })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("dl", { className: "grid grid-cols-2 gap-4 text-sm border-t border-b border-border/60 py-4 bg-muted/10 px-4 rounded-xl", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Type", value: data.event.event_type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Format", value: data.event.format }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Start", value: data.event.start_date ? new Date(data.event.start_date).toLocaleDateString() : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "End", value: data.event.end_date ? new Date(data.event.end_date).toLocaleDateString() : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Location", value: [data.event.city, data.event.country].filter(Boolean).join(", ") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Attendance", value: data.event.attendance_size ? Number(data.event.attendance_size).toLocaleString() : "-" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Primary sector", value: data.event.primary_sector }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(InfoItem, { label: "Min spend", value: data.event.min_sponsorship_spend ? `${data.event.currency} ${Number(data.event.min_sponsorship_spend).toLocaleString()}` : "-" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-semibold text-xs uppercase tracking-wide text-muted-foreground", children: "Event Resources" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Sponsorship deck", url: data.event.sponsorship_deck_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Banner image", url: data.event.banner_image_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Floor plan", url: data.event.floor_plan_url }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(AssetLinkItem, { label: "Event website", url: data.event.website })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h4", { className: "font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2", children: [
          "Tiers (",
          data.tiers.length,
          ")"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-1.5", children: data.tiers.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border bg-card p-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: t.tier_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground", children: [
            t.currency,
            " ",
            Number(t.price).toLocaleString(),
            " · ",
            t.slots_total,
            " slots"
          ] })
        ] }, t.id)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "border-t border-border pt-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground", children: "Action notes (Required for revision/rejection)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: note, onChange: (e) => setNote(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary", placeholder: "Enter review comments here..." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-2", children: [
          data.event.status === "submitted" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("under_review"), variant: "primary", icon: ArrowRight, label: "Start review", pending: transition.isPending }),
          data.event.status === "under_review" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("approved"), variant: "success", icon: CircleCheck, label: "Approve", pending: transition.isPending }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("revision_requested"), variant: "warning", icon: Pencil, label: "Request revision", pending: transition.isPending }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("rejected"), variant: "danger", icon: CircleX, label: "Reject", pending: transition.isPending })
          ] }),
          data.event.status === "approved" && /* @__PURE__ */ jsxRuntimeExports.jsx(ActionBtn, { onClick: () => transition.mutate("listed"), variant: "primary", icon: ArrowRight, label: "List publicly", pending: transition.isPending })
        ] })
      ] })
    ] })
  ] }) }) });
}
function CommissionRow({ config, onSave, saving }) {
  const [std, setStd] = reactExports.useState(String((Number(config.standard_rate) * 100).toFixed(1)));
  const [prem, setPrem] = reactExports.useState(String((Number(config.premium_rate) * 100).toFixed(1)));
  const [plat, setPlat] = reactExports.useState(String((Number(config.abw_platform_rate) * 100).toFixed(1)));
  const dirty = Number(std) !== Number((config.standard_rate * 100).toFixed(1)) || Number(prem) !== Number((config.premium_rate * 100).toFixed(1)) || Number(plat) !== Number((config.abw_platform_rate * 100).toFixed(1));
  const cell = "w-20 rounded border border-border bg-transparent px-2 py-1 text-xs";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("tr", { className: "hover:bg-muted/10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3 font-medium text-foreground", children: config.event_type_category }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", min: 0, max: 100, value: std, onChange: (e) => setStd(e.target.value), className: cell }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", min: 0, max: 100, value: prem, onChange: (e) => setPrem(e.target.value), className: cell }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", min: 0, max: 100, value: plat, onChange: (e) => setPlat(e.target.value), className: cell }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        disabled: !dirty || saving,
        onClick: () => onSave({
          event_type_category: config.event_type_category,
          standard_rate: Number(std) / 100,
          premium_rate: Number(prem) / 100,
          abw_platform_rate: Number(plat) / 100
        }),
        className: "rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-40 hover:bg-primary/90",
        children: "Save"
      }
    ) })
  ] });
}
function InfoItem({ label, value }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("dt", { className: "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("dd", { className: "mt-0.5 text-foreground font-medium", children: value ?? "-" })
  ] });
}
function AssetLinkItem({ label, url }) {
  if (!url) return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
    label,
    ": ",
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "italic", children: "not provided" })
  ] });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: url, target: "_blank", rel: "noreferrer", className: "block truncate text-sm text-primary font-bold hover:underline", children: [
    label,
    " ↗"
  ] });
}
function ActionBtn({ onClick, variant, icon: Icon, label, pending }) {
  const cls = variant === "primary" ? "bg-brand-gradient text-white" : variant === "success" ? "bg-emerald-600 text-white hover:bg-emerald-700" : variant === "warning" ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-destructive text-destructive-foreground hover:bg-destructive/90";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { disabled: pending, onClick, className: `inline-flex items-center gap-1.5 rounded-md px-3 py-2.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer ${cls}`, children: [
    pending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "h-3.5 w-3.5" }),
    " ",
    label
  ] });
}
function DashboardPage() {
  const {
    roles,
    loading
  } = useAuth();
  if (loading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex h-[60vh] items-center justify-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-8 w-8 animate-spin text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-3 font-medium text-sm", children: "Loading workspace…" })
    ] }) });
  }
  if (roles.includes("abw_admin") || roles.includes("super_admin")) return /* @__PURE__ */ jsxRuntimeExports.jsx(AdminDashboard, {});
  if (roles.includes("organiser")) return /* @__PURE__ */ jsxRuntimeExports.jsx(OrganiserDashboard, {});
  if (roles.includes("sponsor")) return /* @__PURE__ */ jsxRuntimeExports.jsx(SponsorDashboard, {});
  if (roles.includes("referral_partner")) return /* @__PURE__ */ jsxRuntimeExports.jsx(ReferralDashboard, {});
  if (roles.includes("media_partner")) return /* @__PURE__ */ jsxRuntimeExports.jsx(MediaPartnerDashboard, {});
  return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-8 text-center max-w-xl mx-auto mt-10", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "mx-auto h-12 w-12 text-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold", children: "Welcome to IGE" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground text-sm", children: "Your account is verified, but has no role assigned. Please contact the administrator or complete onboarding." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/onboarding", className: "btn-primary mt-6 inline-block", children: "Complete Onboarding" })
  ] }) });
}
export {
  DashboardPage as component
};
