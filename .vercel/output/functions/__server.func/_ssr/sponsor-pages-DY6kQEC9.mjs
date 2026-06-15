import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { o as useServerFn } from "./router-BT27-cf7.mjs";
import { e as StatCard, D as DashboardEmpty, S as SponsorAnalyticsPanel } from "./dashboard-analytics-l4Z-ZUzR.mjs";
import { W as WorkspacePage } from "./workspace-page-B1R_k9IJ.mjs";
import { i as getSponsorDashboard } from "./deals.functions-D7eAf24L.mjs";
import { a as fmtMoney } from "./currency-Cm9QA4xQ.mjs";
import { I as Inbox, c as Bookmark, e as CalendarDays, M as LoaderCircle, C as Calendar } from "../_libs/lucide-react.mjs";
function useSponsorData() {
  const fetch = useServerFn(getSponsorDashboard);
  return useQuery({ queryKey: ["sponsor-dash"], queryFn: () => fetch() });
}
function SponsorOverviewPage() {
  const { data, isLoading } = useSponsorData();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    WorkspacePage,
    {
      title: "Sponsor workspace",
      subtitle: "Discover vetted B2B events, track sponsorship commitments, and save opportunities for your brand.",
      action: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all", children: "Explore marketplace" }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-4 md:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Inbox, label: "Submitted commitments", value: data?.forms?.length ?? 0, loading: isLoading }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: Bookmark, label: "Saved events", value: data?.saves?.length ?? 0, loading: isLoading }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(StatCard, { icon: CalendarDays, label: "New listings", value: data?.freshEvents?.length ?? 0, loading: isLoading })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
          { to: "/dashboard/commitments", label: "My commitments", desc: "Track submitted forms" },
          { to: "/dashboard/saved", label: "Saved events", desc: "Your shortlist" },
          { to: "/dashboard/discover", label: "Discover", desc: "Fresh marketplace listings" },
          { to: "/dashboard/analytics", label: "Analytics", desc: "Charts & insights" }
        ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.to, className: "rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-soft", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-foreground", children: item.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: item.desc })
        ] }, item.to)) })
      ]
    }
  );
}
function SponsorCommitmentsPage() {
  const { data, isLoading } = useSponsorData();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspacePage, { title: "My commitments", subtitle: "Sponsorship commitment forms you've submitted to IGE.", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm min-w-[600px]", children: [
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
          /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { className: "px-5 py-3.5 text-right space-x-3", children: [
            ev?.slug && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/events/$slug", params: { slug: ev.slug }, className: "text-xs text-primary font-bold hover:underline", children: "View event →" }),
            ev?.organiser_id && /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/messages", search: { to: ev.organiser_id, event_id: ev.id }, className: "text-xs text-primary font-bold hover:underline", children: "Message organiser →" })
          ] })
        ] }, f.id);
      }),
      !isLoading && !data?.forms?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("tr", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("td", { colSpan: 4, className: "px-5 py-12 text-center text-muted-foreground", children: [
        "No commitments yet. ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "text-primary hover:underline font-semibold", children: "Browse marketplace" })
      ] }) })
    ] })
  ] }) }) }) });
}
function SponsorSavedPage() {
  const { data, isLoading } = useSponsorData();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspacePage, { title: "Saved events", subtitle: "Events you've bookmarked for sponsorship consideration.", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12 text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : !data?.saves?.length ? /* @__PURE__ */ jsxRuntimeExports.jsx(DashboardEmpty, { icon: Bookmark, title: "No saved events", description: "Browse the marketplace and save events that match your criteria.", action: /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "text-sm font-semibold text-primary hover:underline", children: "Explore marketplace →" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: (data?.saves ?? []).map((s) => {
    const ev = data.eventMap[s.event_id];
    if (!ev?.slug) return null;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: ev.slug }, className: "group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft hover:border-primary", children: [
      ev.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ev.banner_image_url, alt: ev.name, className: "h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 bg-muted flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground group-hover:text-primary-deep transition-colors truncate", children: ev.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: [ev.city, ev.country].filter(Boolean).join(", ") })
      ] })
    ] }, s.event_id);
  }) }) });
}
function SponsorDiscoverPage() {
  const { data, isLoading } = useSponsorData();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspacePage, { title: "Discover", subtitle: "Fresh vetted listings on the marketplace.", children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: (data?.freshEvents ?? []).map(
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
  ) }) });
}
function SponsorAnalyticsPage() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(WorkspacePage, { title: "Analytics", subtitle: "Sponsorship activity, sector interest, and commitment trends.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SponsorAnalyticsPanel, {}) });
}
export {
  SponsorAnalyticsPage as S,
  SponsorCommitmentsPage as a,
  SponsorDiscoverPage as b,
  SponsorOverviewPage as c,
  SponsorSavedPage as d
};
