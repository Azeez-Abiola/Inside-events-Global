import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link, e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery, b as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { o as useServerFn } from "./router-BT27-cf7.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { S as StatusBadge } from "./app-shell-ByWYJGa2.mjs";
import { e as StatCard, d as DashboardTabs, b as DashboardLoading, D as DashboardEmpty, c as DashboardPanel, O as OrganiserAnalyticsPanel, f as fmtDateRange, V as VettingTimeline } from "./dashboard-analytics-l4Z-ZUzR.mjs";
import { W as WorkspacePage } from "./workspace-page-B1R_k9IJ.mjs";
import { e as getMyEvents, c as createEventDraft, d as deleteDraftEvent } from "./events.functions-CRSk2WwU.mjs";
import { h as getOrganiserPipeline } from "./deals.functions-D7eAf24L.mjs";
import { a as fmtMoney } from "./currency-Cm9QA4xQ.mjs";
import { e as CalendarDays, a2 as ShieldCheck, v as Eye, S as MessageSquare, y as FolderOpen, M as LoaderCircle, Y as Plus, P as MapPin, u as ExternalLink, a7 as Trash2, c as Bookmark } from "../_libs/lucide-react.mjs";
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
function useOrganiserEvents() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEvents = useServerFn(getMyEvents);
  const createDraft = useServerFn(createEventDraft);
  const removeDraft = useServerFn(deleteDraftEvent);
  const { data: eventsData, isLoading: eventsLoading } = useQuery({ queryKey: ["events", "mine"], queryFn: () => fetchEvents() });
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
  const createBtn = /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => create.mutate(),
      disabled: create.isPending,
      className: "inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-60",
      children: [
        create.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-4 w-4" }),
        " Create event"
      ]
    }
  );
  return { events, counts, buckets, eventsLoading, createBtn, create, del };
}
function OrganiserEventsPage() {
  const [statusFilter, setStatusFilter] = reactExports.useState("all");
  const { events, counts, buckets, eventsLoading, createBtn, del } = useOrganiserEvents();
  const filteredEvents = reactExports.useMemo(() => filterEventsByGroup(events, statusFilter), [events, statusFilter]);
  const activeEventsCount = counts.approved + counts.live;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(WorkspacePage, { title: "Organiser workspace", subtitle: "Manage listings, track vetting, and monitor sponsor inquiries.", action: createBtn, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4 lg:grid-cols-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarDays, label: "Active listings", value: activeEventsCount, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: ShieldCheck, label: "Pending vetting", value: counts.pending, loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Eye, label: "Profile views", value: events.reduce((a, e) => a + (e.view_count ?? 0), 0), loading: eventsLoading }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: MessageSquare, label: "Sponsor inquiries", value: events.reduce((a, e) => a + (e.inquiry_count ?? 0), 0), loading: eventsLoading })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardTabs, { active: statusFilter, onChange: (id) => setStatusFilter(id), tabs: EVENT_TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] })) }),
    statusFilter !== "all" && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: EVENT_STATUS_GROUPS[statusFilter]?.description }),
    eventsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading your events…" }) : filteredEvents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardEmpty, { icon: FolderOpen, title: "No events yet", description: "Create your first event draft to start the IGE vetting flow.", action: createBtn }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4", children: filteredEvents.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsx(
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
    counts.revision > 0 && statusFilter !== "revision" && /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardPanel, { title: "Action needed", description: "Events sent back for revision", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: buckets.revision.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/edit/$id", params: { id: e.id }, className: "flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:border-amber-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-amber-950", children: e.name || "Untitled event" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-amber-800", children: "Continue editing →" })
    ] }, e.id)) }) })
  ] });
}
function OrganiserPipelinePage() {
  const { createBtn } = useOrganiserEvents();
  const fetchPipeline = useServerFn(getOrganiserPipeline);
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({ queryKey: ["org-pipeline"], queryFn: () => fetchPipeline() });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspacePage, { title: "Sponsorship pipeline", subtitle: "Sponsor commitment forms and deal stages across your events.", children: pipelineLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardLoading, { label: "Loading pipeline…" }) : !pipelineData?.events?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardEmpty, { icon: MessageSquare, title: "No live pipeline yet", description: "Once an event is listed, sponsor inquiries will appear here.", action: createBtn }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-6", children: pipelineData.events.map((ev) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    PipelineEventTable,
    {
      event: ev,
      forms: (pipelineData.forms ?? []).filter((f) => f.event_id === ev.id),
      deals: (pipelineData.deals ?? []).filter((d) => d.event_id === ev.id)
    },
    ev.id
  )) }) });
}
function OrganiserAnalyticsPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspacePage, { title: "Analytics", subtitle: "Views, saves, inquiries, and deal performance across your portfolio.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(OrganiserAnalyticsPanel, {}) });
}
function EventCard({ event: e, onDelete, showVettingTimeline }) {
  const isLive = e.status === "listed" || e.status === "approved";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-soft", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0 flex-1", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/edit/$id", params: { id: e.id }, className: "font-display text-base font-bold text-foreground hover:text-primary-deep", children: e.name || "Untitled event" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: e.status })
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
      isLive && e.slug && /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: e.slug }, className: "inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline", children: [
        "View listing ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "h-3 w-3" })
      ] }),
      e.status === "draft" && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onDelete, className: "rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
    ] })
  ] }) });
}
function PipelineEventTable({ event: ev, forms, deals }) {
  const dealByForm = {};
  for (const d of deals) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(DashboardPanel, { title: ev.name, description: [ev.city, ev.country].filter(Boolean).join(", "), children: [
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
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3", children: "Submitted" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("th", { className: "px-3 py-3" })
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
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-xs text-muted-foreground", children: f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "—" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("td", { className: "px-3 py-3 text-right", children: f.sponsor_user_id && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/messages", search: { to: f.sponsor_user_id, event_id: ev.id }, className: "text-xs font-semibold text-primary hover:underline", children: "Message →" }) })
          ] }, f.id);
        }),
        !forms.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsx("td", { colSpan: 7, className: "px-3 py-8 text-center text-sm text-muted-foreground italic", children: "No sponsor inquiries yet." }) })
      ] })
    ] }) })
  ] });
}
export {
  OrganiserAnalyticsPage as O,
  OrganiserEventsPage as a,
  OrganiserPipelinePage as b
};
