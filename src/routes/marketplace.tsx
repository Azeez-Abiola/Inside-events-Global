import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { EVENT_TYPES, SECTORS, COUNTRIES } from "@/lib/event-taxonomy";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Search, SlidersHorizontal, MapPin, Calendar, Users, ShieldCheck, X } from "lucide-react";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace · IGE — Inside Global Events" },
      { name: "description", content: "Discover IGE-vetted sponsorship opportunities across Africa and the diaspora." },
    ],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState({
    event_types: [] as string[],
    sectors: [] as string[],
    countries: [] as string[],
    format: "all" as "all" | "in_person" | "virtual" | "hybrid",
    vetted_only: true,
    decision_makers: false,
    sort: "newest" as "newest" | "soonest" | "audience",
    page: 1,
  });
  const [open, setOpen] = useState(false);

  const params = useMemo(
    () => ({ q: q || undefined, ...filters, per_page: 12 }),
    [q, filters],
  );
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace", params],
    queryFn: () => fetchEvents({ data: params }),
  });

  const events = data?.events ?? [];
  const total = data?.total ?? 0;

  const toggle = <K extends keyof typeof filters>(key: K, value: any) =>
    setFilters((f) => ({ ...f, [key]: value, page: 1 }));

  const activeChips: { key: string; label: string; onRemove: () => void }[] = [];
  filters.event_types.forEach((t) => activeChips.push({ key: `et-${t}`, label: t, onRemove: () => toggle("event_types", filters.event_types.filter((x) => x !== t)) }));
  filters.sectors.forEach((s) => activeChips.push({ key: `s-${s}`, label: s, onRemove: () => toggle("sectors", filters.sectors.filter((x) => x !== s)) }));
  filters.countries.forEach((c) => activeChips.push({ key: `c-${c}`, label: c, onRemove: () => toggle("countries", filters.countries.filter((x) => x !== c)) }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Marketplace</h1>
            <p className="mt-1 text-sm text-muted-foreground">{total.toLocaleString()} vetted events seeking sponsors</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filters.sort}
              onChange={(e) => toggle("sort", e.target.value)}
              className="rounded-md border border-border bg-card px-3 py-2 text-sm"
            >
              <option value="newest">Newest</option>
              <option value="soonest">Event date (soonest)</option>
              <option value="audience">Audience (largest)</option>
            </select>
            <button onClick={() => setOpen(true)} className="md:hidden inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm">
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>
          </div>
        </div>

        <div className="mb-4 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, theme, city, sector…"
            className="w-full rounded-lg border border-border bg-card py-3 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        {activeChips.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {activeChips.map((c) => (
              <button key={c.key} onClick={c.onRemove} className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-primary-deep hover:bg-primary/20">
                {c.label} <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 md:grid-cols-[260px_1fr]">
          <aside className={`${open ? "fixed inset-0 z-50 overflow-auto bg-background p-6 md:relative md:p-0" : "hidden"} md:block`}>
            <div className="flex items-center justify-between md:hidden">
              <h2 className="font-display text-lg font-bold">Filters</h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <FilterGroup label="Event type">
              <MultiSelect options={EVENT_TYPES} value={filters.event_types} onChange={(v) => toggle("event_types", v)} />
            </FilterGroup>
            <FilterGroup label="Sector">
              <MultiSelect options={SECTORS} value={filters.sectors} onChange={(v) => toggle("sectors", v)} />
            </FilterGroup>
            <FilterGroup label="Country">
              <MultiSelect options={COUNTRIES} value={filters.countries} onChange={(v) => toggle("countries", v)} />
            </FilterGroup>
            <FilterGroup label="Format">
              {(["all", "in_person", "virtual", "hybrid"] as const).map((f) => (
                <label key={f} className="flex items-center gap-2 py-1 text-sm">
                  <input type="radio" checked={filters.format === f} onChange={() => toggle("format", f)} />
                  <span className="capitalize">{f.replace("_", " ")}</span>
                </label>
              ))}
            </FilterGroup>
            <FilterGroup label="Quality">
              <label className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" checked={filters.vetted_only} onChange={(e) => toggle("vetted_only", e.target.checked)} />
                IGE vetted only
              </label>
              <label className="flex items-center gap-2 py-1 text-sm">
                <input type="checkbox" checked={filters.decision_makers} onChange={(e) => toggle("decision_makers", e.target.checked)} />
                Decision-makers present
              </label>
            </FilterGroup>
          </aside>

          <div>
            {isLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <h3 className="font-display text-xl font-bold">No events match your filters</h3>
                <p className="mt-1 text-sm text-muted-foreground">Try broadening your search.</p>
                <button onClick={() => setFilters({ event_types: [], sectors: [], countries: [], format: "all", vetted_only: false, decision_makers: false, sort: "newest", page: 1 })} className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {events.map((e: any) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 border-b border-border pb-4">
      <div className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function MultiSelect({ options, value, onChange }: { options: readonly string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="max-h-44 overflow-auto pr-1">
      {options.map((o) => {
        const checked = value.includes(o);
        return (
          <label key={o} className="flex items-center gap-2 py-0.5 text-xs">
            <input
              type="checkbox"
              checked={checked}
              onChange={() => onChange(checked ? value.filter((x) => x !== o) : [...value, o])}
            />
            <span className="truncate">{o}</span>
          </label>
        );
      })}
    </div>
  );
}

function EventCard({ event }: { event: any }) {
  return (
    <Link
      to="/events/$slug"
      params={{ slug: event.slug }}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ borderLeft: "4px solid hsl(var(--primary))" }}
    >
      <div className="relative aspect-video bg-muted">
        {event.banner_image_url ? (
          <img loading="lazy" src={event.banner_image_url} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-muted text-muted-foreground">
            <Calendar className="h-10 w-10" />
          </div>
        )}
        {event.ige_vetted && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white shadow">
            <ShieldCheck className="h-3 w-3" /> Vetted
          </div>
        )}
      </div>
      <div className="p-4">
        <div className="mb-2 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-primary-deep">
          {event.event_type ?? "Event"}
        </div>
        <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{event.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{event.city ?? "—"}, {event.country ?? "—"}</span>
          {event.start_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(event.start_date).toLocaleDateString()}</span>}
        </div>
        <div className="mt-2 flex items-center gap-3 text-xs">
          {event.primary_sector && <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground">{event.primary_sector}</span>}
          {event.attendance_size && <span className="inline-flex items-center gap-1 text-muted-foreground"><Users className="h-3 w-3" />{Number(event.attendance_size).toLocaleString()}+</span>}
        </div>
        {event.starting && (
          <div className="mt-3 border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">From </span>
            <span className="font-display font-bold">{event.starting.currency} {Number(event.starting.price).toLocaleString()}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
