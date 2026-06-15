import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQuery, b as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { n as useServerFn, l as listMarketplaceEvents, e as createSsrRpc, u as useAuth, t as toggleSaveEvent } from "./router-CyTgVp-T.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { A as AppShell } from "./app-shell-B3fq3Cpm.mjs";
import { supabase } from "./client-DBr2rXmP.mjs";
import { a as DashboardHeader, e as StatCard, M as MediaAnalyticsPanel } from "./dashboard-analytics-D8pPgueL.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { e as CalendarDays, c as Bookmark, V as Newspaper, M as LoaderCircle, C as Calendar, a0 as Send } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
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
const getMediaPartnerSaves = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("fdd3969ac97481c49af9c5eb1ce7251dda9d4b5e11e3b514a2838518d4bfdaee"));
function MediaPartnerDashboard({ section = "explore" }) {
  const [requestEvent, setRequestEvent] = reactExports.useState(null);
  const fetchMarketplace = useServerFn(listMarketplaceEvents);
  const fetchSaves = useServerFn(getMediaPartnerSaves);
  const fetchRequests = useServerFn(getMyMediaRequests);
  const { data: marketplaceData, isLoading: exploreLoading } = useQuery({
    queryKey: ["media-partner-marketplace"],
    queryFn: () => fetchMarketplace({ data: { vetted_only: true, per_page: 12 } })
  });
  const { data: savesData, isLoading: savesLoading } = useQuery({
    queryKey: ["media-saves"],
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
      section === "overview" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4", children: [
        { to: "/dashboard/explore", label: "Explore", desc: "Events to cover" },
        { to: "/dashboard/saved", label: "Saved", desc: "Bookmarked opportunities" },
        { to: "/dashboard/requests", label: "My requests", desc: "Coverage requests" },
        { to: "/dashboard/analytics", label: "Analytics", desc: "Sector & request trends" }
      ].map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: item.to, className: "rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: item.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-sm text-muted-foreground", children: item.desc })
      ] }, item.to)) }),
      section === "analytics" ? /* @__PURE__ */ jsxRuntimeExports.jsx(MediaAnalyticsPanel, {}) : section === "explore" ? exploreLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: events.map((e) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card hover:shadow-soft transition-all duration-300", children: [
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
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "px-4 pb-4 flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(EventSaveButton, { eventId: e.id, compact: true }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "button",
            {
              type: "button",
              onClick: () => setRequestEvent({ id: e.id, name: e.name }),
              className: "inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "h-3.5 w-3.5" }),
                " Request coverage"
              ]
            }
          )
        ] })
      ] }, e.id)) }) : section === "saved" ? savesLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : savedEvents.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "No saved opportunities yet." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3", children: savedEvents.map((ev) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: { slug: ev.slug }, className: "group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft hover:border-primary", children: [
        ev.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: ev.banner_image_url, alt: ev.name, className: "h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-32 bg-muted flex items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-8 w-8" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-foreground group-hover:text-primary-deep transition-colors truncate", children: ev.name }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-xs text-muted-foreground", children: [ev.city, ev.country].filter(Boolean).join(", ") })
        ] })
      ] }, ev.id)) }) : section === "requests" ? requestsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex justify-center py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }) }) : requests.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-dashed border-border p-12 text-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm", children: "No coverage requests yet. Browse Explore and request coverage on an event." }) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-xl border border-border bg-card overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("table", { className: "w-full text-sm", children: [
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
      ] }) }) : null
    ] }),
    requestEvent && /* @__PURE__ */ jsxRuntimeExports.jsx(CoverageRequestModal, { event: requestEvent, onClose: () => setRequestEvent(null) })
  ] });
}
function EventSaveButton({ eventId, compact }) {
  const { user } = useAuth();
  const toggle = useServerFn(toggleSaveEvent);
  const qc = useQueryClient();
  const { data: isSaved } = useQuery({
    queryKey: ["event-saved", eventId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("event_saves").select("id").eq("event_id", eventId).maybeSingle();
      return !!data;
    },
    enabled: !!user
  });
  const mut = useMutation({
    mutationFn: () => toggle({ data: { event_id: eventId } }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["media-saves"] });
      qc.invalidateQueries({ queryKey: ["event-saved", eventId] });
      qc.invalidateQueries({ queryKey: ["sponsor-dash"] });
      toast.success(res.saved ? "Event saved" : "Removed from saved");
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "button",
    {
      type: "button",
      onClick: () => mut.mutate(),
      disabled: mut.isPending || !user,
      className: `inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${compact ? "shrink-0" : "w-full"} ${isSaved ? "border-secondary/40 bg-secondary/10 text-secondary-deep" : "border-border hover:bg-muted"}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: `h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}` }),
        compact ? isSaved ? "Saved" : "Save" : isSaved ? "Saved" : "Save event"
      ]
    }
  );
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
      toast.success("Request sent successfully");
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
export {
  CoverageRequestModal as C,
  MediaPartnerDashboard as M
};
