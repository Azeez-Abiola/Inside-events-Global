import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { o as useServerFn, l as listMarketplaceEvents, i as getMarketplaceFilterOptions, n as useScrollReveal, e as SiteHeader, d as SiteFooter, h as getCurrentRates } from "./router-BT27-cf7.mjs";
import { a as useQuery } from "../_libs/tanstack__react-query.mjs";
import { f as fmtDual } from "./currency-Cm9QA4xQ.mjs";
import "../_libs/ws.mjs";
import "../_libs/seroval.mjs";
import { a3 as SlidersHorizontal, $ as Search, af as X, C as Calendar, a2 as ShieldCheck, P as MapPin, ad as Users } from "../_libs/lucide-react.mjs";
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
import "./client-gmdRS3ZG.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server-CqdVJ_Eq.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DeHWLdHU.mjs";
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
import "../_libs/zod.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
const FORMAT_LABELS = {
  in_person: "In person",
  virtual: "Virtual",
  hybrid: "Hybrid"
};
function MarketplacePage() {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const fetchFacets = useServerFn(getMarketplaceFilterOptions);
  const [q, setQ] = reactExports.useState("");
  const [filters, setFilters] = reactExports.useState({
    event_types: [],
    sectors: [],
    countries: [],
    format: "all",
    vetted_only: true,
    decision_makers: false,
    sort: "newest",
    page: 1
  });
  const [open, setOpen] = reactExports.useState(false);
  const headerRef = useScrollReveal();
  const gridRef = useScrollReveal();
  const facetParams = reactExports.useMemo(() => ({
    vetted_only: filters.vetted_only,
    decision_makers: filters.decision_makers
  }), [filters.vetted_only, filters.decision_makers]);
  const {
    data: facets,
    isLoading: facetsLoading
  } = useQuery({
    queryKey: ["marketplace-facets", facetParams],
    queryFn: () => fetchFacets({
      data: facetParams
    })
  });
  const params = reactExports.useMemo(() => ({
    q: q || void 0,
    ...filters,
    per_page: 12
  }), [q, filters]);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["marketplace", params],
    queryFn: () => fetchEvents({
      data: params
    })
  });
  const events = data?.events ?? [];
  const total = data?.total ?? 0;
  const availableEventTypes = facets?.event_types ?? [];
  const availableSectors = facets?.sectors ?? [];
  const availableCountries = facets?.countries ?? [];
  const availableFormats = facets?.formats ?? [];
  reactExports.useEffect(() => {
    if (!facets) return;
    setFilters((f) => {
      const event_types = f.event_types.filter((v) => facets.event_types.includes(v));
      const sectors = f.sectors.filter((v) => facets.sectors.includes(v));
      const countries = f.countries.filter((v) => facets.countries.includes(v));
      const format = f.format !== "all" && !facets.formats.includes(f.format) ? "all" : f.format;
      if (event_types.join() === f.event_types.join() && sectors.join() === f.sectors.join() && countries.join() === f.countries.join() && format === f.format) {
        return f;
      }
      return {
        ...f,
        event_types,
        sectors,
        countries,
        format,
        page: 1
      };
    });
  }, [facets]);
  const toggle = (key, value) => setFilters((f) => ({
    ...f,
    [key]: value,
    page: 1
  }));
  const activeChips = [];
  filters.event_types.forEach((t) => activeChips.push({
    key: `et-${t}`,
    label: t,
    onRemove: () => toggle("event_types", filters.event_types.filter((x) => x !== t))
  }));
  filters.sectors.forEach((s) => activeChips.push({
    key: `s-${s}`,
    label: s,
    onRemove: () => toggle("sectors", filters.sectors.filter((x) => x !== s))
  }));
  filters.countries.forEach((c) => activeChips.push({
    key: `c-${c}`,
    label: c,
    onRemove: () => toggle("countries", filters.countries.filter((x) => x !== c))
  }));
  if (filters.format !== "all") {
    activeChips.push({
      key: `fmt-${filters.format}`,
      label: FORMAT_LABELS[filters.format] ?? filters.format,
      onRemove: () => toggle("format", "all")
    });
  }
  const showQualityFilters = facets?.has_vetted_events || facets?.has_non_vetted_events || facets?.has_decision_maker_events;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "mx-auto max-w-7xl px-6 py-10", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { ref: headerRef, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, className: "mb-6 flex items-end justify-between gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold tracking-tight", children: "Marketplace" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-1 text-sm text-muted-foreground", children: [
              total.toLocaleString(),
              " vetted events seeking sponsors"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: filters.sort, onChange: (e) => toggle("sort", e.target.value), className: "rounded-md border border-border bg-card px-3 py-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "newest", children: "Newest" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "soonest", children: "Event date (soonest)" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "audience", children: "Audience (largest)" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setOpen(true), className: "md:hidden inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(SlidersHorizontal, { className: "h-4 w-4" }),
              " Filters"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, "data-delay": "1", className: "mb-4 relative", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Search by name, theme, city, sector…", className: "w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none" })
        ] }),
        activeChips.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-reveal": true, "data-delay": "2", className: "mb-4 flex flex-wrap gap-2", children: activeChips.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: c.onRemove, className: "inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-primary-deep hover:bg-primary/20", children: [
          c.label,
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-3 w-3" })
        ] }, c.key)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: `${open ? "fixed inset-0 z-50 overflow-auto bg-background p-6 md:relative md:p-0" : "hidden"} md:block`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between md:hidden", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-bold", children: "Filters" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setOpen(false), children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-5 w-5" }) })
          ] }),
          facetsLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-4", children: Array.from({
            length: 4
          }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-16 animate-pulse rounded-lg bg-muted" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            availableEventTypes.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(FilterGroup, { label: "Event type", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiSelect, { options: availableEventTypes, value: filters.event_types, onChange: (v) => toggle("event_types", v) }) }),
            availableSectors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(FilterGroup, { label: "Sector", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiSelect, { options: availableSectors, value: filters.sectors, onChange: (v) => toggle("sectors", v) }) }),
            availableCountries.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(FilterGroup, { label: "Country", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiSelect, { options: availableCountries, value: filters.countries, onChange: (v) => toggle("countries", v) }) }),
            availableFormats.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(FilterGroup, { label: "Format", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 py-1 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", checked: filters.format === "all", onChange: () => toggle("format", "all") }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "All formats" })
              ] }),
              availableFormats.map((f) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 py-1 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", checked: filters.format === f, onChange: () => toggle("format", f) }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: FORMAT_LABELS[f] ?? f })
              ] }, f))
            ] }),
            showQualityFilters && /* @__PURE__ */ jsxRuntimeExports.jsxs(FilterGroup, { label: "Quality", children: [
              (facets?.has_vetted_events || facets?.has_non_vetted_events) && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 py-1 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: filters.vetted_only, onChange: (e) => toggle("vetted_only", e.target.checked) }),
                "IGE vetted only"
              ] }),
              facets?.has_decision_maker_events && /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 py-1 text-sm", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: filters.decision_makers, onChange: (e) => toggle("decision_makers", e.target.checked) }),
                "Decision-makers present"
              ] })
            ] }),
            !availableEventTypes.length && !availableSectors.length && !availableCountries.length && !availableFormats.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No filter options available yet." })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { ref: gridRef, children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3", children: Array.from({
          length: 6
        }).map((_, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-80 animate-pulse rounded-xl bg-muted" }, i)) }) : events.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "data-reveal": true, className: "rounded-xl border border-dashed border-border bg-card p-10 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold", children: "No events match your filters" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Try broadening your search." }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilters({
            event_types: [],
            sectors: [],
            countries: [],
            format: "all",
            vetted_only: false,
            decision_makers: false,
            sort: "newest",
            page: 1
          }), className: "mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground", children: "Clear all filters" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3", children: events.map((e, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "data-reveal": true, "data-delay": String(Math.min(i % 3 + 1, 3)), children: /* @__PURE__ */ jsxRuntimeExports.jsx(EventCard, { event: e }) }, e.id)) }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function FilterGroup({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-5 border-b border-border pb-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground", children: label }),
    children
  ] });
}
function MultiSelect({
  options,
  value,
  onChange
}) {
  if (!options.length) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "No options available" });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-44 overflow-auto pr-1", children: options.map((o) => {
    const checked = value.includes(o);
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 py-0.5 text-xs", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked, onChange: () => onChange(checked ? value.filter((x) => x !== o) : [...value, o]) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "truncate", children: o })
    ] }, o);
  }) });
}
function EventCard({
  event
}) {
  const fetchRates = useServerFn(getCurrentRates);
  const {
    data: ratesData
  } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => fetchRates()
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/events/$slug", params: {
    slug: event.slug
  }, className: "group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg h-full", style: {
    borderLeft: "4px solid hsl(var(--primary))"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative aspect-video bg-muted", children: [
      event.banner_image_url ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { loading: "lazy", src: event.banner_image_url, alt: event.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-muted text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-10 w-10" }) }),
      event.ige_vetted && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white shadow", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3 w-3" }),
        " Vetted"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-2 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-primary-deep", children: event.event_type ?? "Event" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "line-clamp-2 font-display text-base font-bold leading-tight", children: event.name }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3 text-xs text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-3 w-3" }),
          event.city ?? "-",
          ", ",
          event.country ?? "-"
        ] }),
        event.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-3 w-3" }),
          new Date(event.start_date).toLocaleDateString()
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-2 flex items-center gap-3 text-xs", children: [
        event.primary_sector && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2 py-0.5 text-muted-foreground", children: event.primary_sector }),
        event.attendance_size && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-3 w-3" }),
          Number(event.attendance_size).toLocaleString(),
          "+"
        ] })
      ] }),
      event.starting && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 border-t border-border pt-2 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "From " }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-bold", children: fmtDual(event.starting.currency, Number(event.starting.price), ratesData?.rates) })
      ] })
    ] })
  ] });
}
export {
  MarketplacePage as component
};
