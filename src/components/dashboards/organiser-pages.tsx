import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus, Loader2, Trash2, CalendarDays, Eye, Bookmark, MessageSquare,
  ShieldCheck, FolderOpen, ExternalLink, BarChart3, TrendingUp,
} from "lucide-react";
import { StatusBadge } from "@/components/app-shell";
import { QuickLinkCard, fmtDateRange } from "@/components/dashboards/shared";
import { KpiTile, DonutBreakdown, FeaturedHeroCard, AgendaList } from "@/components/dashboards/voom-primitives";
import { DashboardCardGridSkeleton, DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import {
  DashboardEmpty, DashboardPanel, DashboardTable, DashboardTableHead, VettingTimeline,
} from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar, DashboardFilterSelect } from "@/components/dashboards/dashboard-data-toolbar";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { OrganiserAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import {
  createEventDraft, getMyEvents, deleteDraftEvent, getEventForEdit, autosaveEvent, pickAutosavePatch,
} from "@/lib/events.functions";
import { getOrganiserPipeline } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";
import {
  EVENT_STATUS_GROUPS, type EventStatusGroup, filterEventsByGroup, groupEventsByStatus,
} from "@/lib/event-dashboard";
import { COUNTRIES, PRIMARY_SECTORS } from "@/lib/event-taxonomy";
import { useTableFilters } from "@/hooks/use-table-filters";
import { Button } from "@/components/ui/button";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

const EVENT_TABS: { id: EventStatusGroup; label: string }[] = [
  { id: "all", label: "All events" },
  { id: "draft", label: "Drafts" },
  { id: "pending", label: "Pending vetting" },
  { id: "approved", label: "Approved" },
  { id: "live", label: "Live" },
  { id: "revision", label: "Revisions" },
  { id: "rejected", label: "Rejected" },
  { id: "past", label: "Closed" },
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
    onSuccess: ({ id }) => { qc.invalidateQueries({ queryKey: ["events", "mine"] }); navigate({ to: "/events/edit/$id", params: { id } }); },
    onError: (e: any) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["events", "mine"] }); toast.success("Draft deleted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const events = eventsData?.events ?? [];
  const { counts, buckets } = useMemo(() => groupEventsByStatus(events), [events]);
  const createBtn = (
    <button type="button" onClick={() => create.mutate()} disabled={create.isPending}
      className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-60">
      {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create event
    </button>
  );
  return { events, counts, buckets, eventsLoading, createBtn, create, del };
}

export function OrganiserEventsPage() {
  const [statusFilter, setStatusFilter] = useState<EventStatusGroup>("all");
  const [search, setSearch] = useState("");
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const { events, counts, buckets, eventsLoading, createBtn, del } = useOrganiserEvents();
  const fetchPipeline = useServerFn(getOrganiserPipeline);
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ["org-pipeline"],
    queryFn: () => fetchPipeline(),
  });
  const statusFiltered = useMemo(() => filterEventsByGroup(events, statusFilter), [events, statusFilter]);
  const filteredEvents = useTableFilters({
    rows: statusFiltered,
    searchText: search,
    search: (e: any) =>
      [e.name, e.primary_sector, e.city, e.country, e.status].filter(Boolean).join(" "),
  });
  const activeEventsCount = counts.approved + counts.live;
  const featured =
    buckets.revision[0] ??
    buckets.pending[0] ??
    buckets.live[0] ??
    buckets.approved[0] ??
    events[0];
  const statusDonut = [
    { status: "Live", count: counts.live },
    { status: "Pending", count: counts.pending },
    { status: "Approved", count: counts.approved },
    { status: "Draft", count: counts.draft },
    { status: "Revision", count: counts.revision },
  ].filter((d) => d.count > 0);
  const agendaItems = [...events]
    .filter((e: any) => e.start_date)
    .sort((a: any, b: any) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
    .slice(0, 4)
    .map((e: any) => ({
      id: e.id,
      date: e.start_date,
      title: e.name || "Untitled event",
      subtitle: [e.city, e.country].filter(Boolean).join(", "),
      badge: e.status?.replace(/_/g, " "),
    }));

  const commandStats = useMemo(() => {
    const forms = pipelineData?.forms ?? [];
    const deals = pipelineData?.deals ?? [];
    const interestUsd = forms.reduce((sum: number, f: any) => {
      const max = Number(f.budget_range_max ?? f.budget_range_min ?? 0);
      return sum + (Number.isFinite(max) ? max : 0);
    }, 0);
    const closedUsd = deals
      .filter((d: any) => ["payment_received", "contract_signed", "contract_sent"].includes(d.status))
      .reduce((sum: number, d: any) => sum + Number(d.deal_value_usd ?? 0), 0);
    const fundingGap = Math.max(0, interestUsd - closedUsd);
    const openInquiries = forms.filter((f: any) => !deals.some((d: any) => d.commitment_form_id === f.id)).length;
    const stages = [
      { label: "Inquiries", count: forms.length },
      {
        label: "In negotiation",
        count: deals.filter((d: any) =>
          ["inquiry_received", "qualification_call_scheduled", "proposal_sent", "negotiation"].includes(d.status),
        ).length,
      },
      { label: "Committed", count: deals.filter((d: any) => ["contract_sent", "contract_signed"].includes(d.status)).length },
      { label: "Paid", count: deals.filter((d: any) => d.status === "payment_received").length },
    ];
    const demandStrip = [...events]
      .filter((e: any) => ["listed", "approved", "live"].includes(e.status) || (e.inquiry_count ?? 0) > 0)
      .slice(0, 6)
      .map((e: any) => {
        const views = Math.max(1, Number(e.view_count ?? 0));
        const inquiries = Number(e.inquiry_count ?? 0);
        const fill = Math.min(100, Math.round((inquiries / Math.max(views * 0.05, 1)) * 100));
        return { id: e.id, name: e.name || "Untitled", fill, inquiries, views };
      });
    return { fundingGap, interestUsd, closedUsd, openInquiries, stages, demandStrip };
  }, [pipelineData, events]);

  return (
    <WorkspacePage
      title="Organiser Command Center"
      subtitle="Funding gap, pipeline pulse, and listing health — then manage events below."
      action={createBtn}
      showGreeting
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={CalendarDays} label="Active listings" value={activeEventsCount} loading={eventsLoading} trend={`${counts.live} live`} />
        <KpiTile icon={ShieldCheck} label="Pending vetting" value={counts.pending} loading={eventsLoading} />
        <KpiTile icon={MessageSquare} label="Sponsor inquiries" value={events.reduce((a: number, e: any) => a + (e.inquiry_count ?? 0), 0)} loading={eventsLoading} />
      </div>

      <div className="rounded-2xl bg-brand-gradient p-5 text-white shadow-soft sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/80">Estimated funding gap</p>
        <p className="mt-1 font-display text-3xl font-bold tracking-tight">
          {pipelineLoading ? "…" : fmtMoney("USD", commandStats.fundingGap)}
        </p>
        <p className="mt-2 max-w-xl text-sm text-white/85">
          Interest from open inquiries minus committed deal value
          {commandStats.openInquiries ? ` · ${commandStats.openInquiries} open inquiry${commandStats.openInquiries === 1 ? "" : "ies"}` : ""}.
          Refine tiers on each event editor for a slot-level inventory view.
        </p>
        <Link to="/dashboard/pipeline" className="mt-4 inline-flex text-sm font-semibold text-white underline-offset-2 hover:underline">
          Open sponsorship pipeline →
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-bold text-foreground">Pipeline snapshot</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Inquiries through paid deals</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {commandStats.stages.map((s) => (
              <div key={s.label} className="rounded-xl bg-muted/40 px-3 py-3 text-center">
                <div className="font-display text-xl font-bold text-foreground">{pipelineLoading ? "—" : s.count}</div>
                <div className="mt-0.5 text-[11px] font-medium text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-card">
          <h3 className="font-display text-sm font-bold text-foreground">Demand fill</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Inquiry heat vs listing views (proxy until tier slots roll up)</p>
          <div className="mt-4 space-y-3">
            {eventsLoading || !commandStats.demandStrip.length ? (
              <p className="text-sm text-muted-foreground italic">List or promote an event to see demand fill.</p>
            ) : (
              commandStats.demandStrip.map((row) => (
                <div key={row.id}>
                  <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                    <span className="truncate font-medium text-foreground">{row.name}</span>
                    <span className="shrink-0 text-muted-foreground">{row.inquiries} inq · {row.fill}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${row.fill}%` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {statusDonut.length > 0 ? (
            <DonutBreakdown
              title="Portfolio by status"
              description="How your events are distributed"
              data={statusDonut}
              nameKey="status"
              valueKey="count"
              centerLabel="Events"
              centerValue={events.length}
            />
          ) : (
            <div className="rounded-2xl bg-card p-5 shadow-card">
              <h3 className="font-display text-sm font-bold text-foreground">Portfolio by status</h3>
              <p className="mt-2 text-sm text-muted-foreground italic">Create events to see status distribution.</p>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {featured ? (
            <FeaturedHeroCard
              imageUrl={featured.banner_image_url}
              badge={featured.status === "revision_requested" ? "Action needed" : featured.status?.replace(/_/g, " ")}
              title={featured.name || "Untitled event"}
              meta={[featured.city, featured.country].filter(Boolean).join(", ")}
              description={
                featured.status === "revision_requested"
                  ? "IGE requested updates — open the editor and resubmit when ready."
                  : `${featured.view_count ?? 0} views · ${featured.inquiry_count ?? 0} inquiries`
              }
              ctaLabel={featured.status === "revision_requested" ? "Continue editing" : "Open editor"}
              ctaTo="/events/edit/$id"
              ctaParams={{ id: featured.id }}
            />
          ) : (
            <FeaturedHeroCard
              badge="Organiser"
              title="Create your first event"
              meta="IGE vetting flow"
              description="List a B2B event, pass vetting, and reach verified sponsors on the marketplace."
              ctaLabel="Get started"
              ctaTo="/dashboard"
            />
          )}
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AgendaList title="Upcoming start dates" items={agendaItems} empty="No scheduled events yet." />
        </div>
        <div className="grid gap-2 sm:grid-cols-3 lg:col-span-2 lg:grid-cols-3">
          {[
            { to: "/dashboard/pipeline", label: "Sponsorship pipeline", desc: "Inquiries & deal stages", icon: TrendingUp },
            { to: "/dashboard/documents", label: "Documents", desc: "Decks & assets", icon: FolderOpen },
            { to: "/dashboard/analytics", label: "Analytics", desc: "Views & conversions", icon: BarChart3 },
          ].map((item) => (
            <QuickLinkCard key={item.to} {...item} />
          ))}
        </div>
      </div>

      {counts.revision > 0 && statusFilter !== "revision" && (
        <DashboardPanel title="Action needed" description="Events sent back for revision">
          <div className="space-y-3">
            {buckets.revision.map((e: any) => (
              <button
                key={e.id}
                type="button"
                onClick={() => setSelectedEventId(e.id)}
                className="flex w-full items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm hover:border-amber-300"
              >
                <span className="font-semibold text-amber-950">{e.name || "Untitled event"}</span>
                <span className="text-xs font-medium text-amber-800">Review & edit →</span>
              </button>
            ))}
          </div>
        </DashboardPanel>
      )}

      <div className="rounded-2xl bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
          <div>
            <h3 className="font-display text-sm font-bold text-foreground">My events</h3>
            <p className="text-xs text-muted-foreground">All listings in your workspace</p>
          </div>
        </div>
        <div className="p-0">
          <DashboardDataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search event, sector, location…"
            filters={
              <DashboardFilterSelect
                label="Status"
                value={statusFilter}
                onChange={(id) => setStatusFilter(id as EventStatusGroup)}
                options={EVENT_TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] }))}
              />
            }
          />
          <div className="px-5 pb-5">
            {statusFilter !== "all" && (
              <p className="mb-3 text-sm text-muted-foreground">
                {EVENT_STATUS_GROUPS[statusFilter as Exclude<EventStatusGroup, "all">]?.description}
              </p>
            )}
            {eventsLoading ? (
              <DashboardTableSkeleton rows={6} cols={6} />
            ) : filteredEvents.length === 0 ? (
              <DashboardEmpty
                icon={FolderOpen}
                title="No events yet"
                description="Create your first event draft to start the IGE vetting flow."
                action={createBtn}
              />
            ) : (
              <div className="overflow-hidden rounded-xl border border-border">
                <DashboardTable>
                  <DashboardTableHead>
                    <tr>
                      <th className="px-4 py-3">Event</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Dates</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Views</th>
                      <th className="px-4 py-3">Inquiries</th>
                    </tr>
                  </DashboardTableHead>
                  <tbody className="divide-y divide-border">
                    {filteredEvents.map((e: any) => (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedEventId(e.id)}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{e.name || "Untitled event"}</div>
                          {e.primary_sector && (
                            <div className="mt-0.5 text-xs text-muted-foreground">{e.primary_sector}</div>
                          )}
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={e.status} /></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {e.start_date ? fmtDateRange(e.start_date, e.end_date) : "—"}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {[e.city, e.country].filter(Boolean).join(", ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">{e.view_count ?? 0}</td>
                        <td className="px-4 py-3 text-xs tabular-nums text-muted-foreground">{e.inquiry_count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </DashboardTable>
              </div>
            )}
          </div>
        </div>
      </div>

      <OrganiserEventDetailSheet
        eventId={selectedEventId}
        onClose={() => setSelectedEventId(null)}
        onDeleteDraft={(id) => {
          if (confirm("Delete this draft?")) {
            del.mutate(id, { onSuccess: () => setSelectedEventId(null) });
          }
        }}
      />
    </WorkspacePage>
  );
}

export function OrganiserPipelinePage() {
  const { createBtn } = useOrganiserEvents();
  const fetchPipeline = useServerFn(getOrganiserPipeline);
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({ queryKey: ["org-pipeline"], queryFn: () => fetchPipeline() });
  const [tab, setTab] = useState<"ige" | "mine">("ige");

  const dealByForm: Record<string, any> = {};
  for (const d of pipelineData?.deals ?? []) {
    if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;
  }

  const filterForms = (forms: any[]) =>
    tab === "ige" ? forms.filter((f) => !dealByForm[f.id]) : forms.filter((f) => dealByForm[f.id]);

  return (
    <WorkspacePage title="Sponsorship pipeline" subtitle="Track IGE-verified sponsor leads and your active sponsor relationships.">
      <DashboardPanel title="Pipeline" description="Switch between IGE leads and your active sponsor deals." bodyClassName="p-0">
        <DashboardDataToolbar
          filters={
            <DashboardFilterSelect
              label="View"
              value={tab}
              onChange={(id) => setTab(id as "ige" | "mine")}
              options={[
                { id: "ige", label: "IGE sponsors" },
                { id: "mine", label: "My sponsors" },
              ]}
            />
          }
        />
        <div className="p-5">
      {pipelineLoading ? <DashboardTableSkeleton rows={5} cols={6} /> : !pipelineData?.events?.length ? (
        <DashboardEmpty icon={MessageSquare} title="No live pipeline yet" description="Once an event is listed, sponsor inquiries will appear here." action={createBtn} />
      ) : (
        <div className="space-y-6">
          {pipelineData.events.map((ev: any) => {
            const forms = filterForms((pipelineData.forms ?? []).filter((f: any) => f.event_id === ev.id));
            if (!forms.length) return null;
            return (
              <PipelineEventTable key={ev.id} event={ev}
                partnerMap={pipelineData.partnerMap ?? {}}
                forms={forms}
                deals={(pipelineData.deals ?? []).filter((d: any) => d.event_id === ev.id)} />
            );
          })}
          {!pipelineData.events.some((ev: any) =>
            filterForms((pipelineData.forms ?? []).filter((f: any) => f.event_id === ev.id)).length > 0,
          ) && (
            <DashboardEmpty
              icon={MessageSquare}
              title={tab === "ige" ? "No IGE sponsor leads yet" : "No active sponsor deals yet"}
              description={tab === "ige"
                ? "New commitment forms appear here while IGE verifies them before creating a deal."
                : "Once IGE converts an inquiry to a deal, your sponsor relationships show here."}
            />
          )}
        </div>
      )}
        </div>
      </DashboardPanel>
    </WorkspacePage>
  );
}

export function OrganiserDocumentsPage() {
  const { events, eventsLoading } = useOrganiserEvents();
  const docs = events.filter((e: any) => e.sponsorship_deck_url || e.banner_image_url || e.floor_plan_url);

  return (
    <WorkspacePage title="Documents" subtitle="Sponsorship decks, banners, and floor plans across your events.">
      {eventsLoading ? <DashboardCardGridSkeleton count={4} /> : docs.length === 0 ? (
        <DashboardEmpty icon={FolderOpen} title="No documents yet" description="Upload decks and assets in the event editor when creating or editing a listing." />
      ) : (
        <div className="space-y-4">
          {docs.map((e: any) => (
            <DashboardPanel key={e.id} title={e.name || "Untitled event"} description={[e.city, e.country].filter(Boolean).join(", ")}>
              <div className="grid gap-3 sm:grid-cols-3">
                <DocLink label="Sponsorship deck" url={e.sponsorship_deck_url} />
                <DocLink label="Banner image" url={e.banner_image_url} />
                <DocLink label="Floor plan" url={e.floor_plan_url} />
              </div>
              <Link to="/events/edit/$id" params={{ id: e.id }} className="mt-4 inline-flex text-xs font-semibold text-primary hover:underline">
                Manage in editor →
              </Link>
            </DashboardPanel>
          ))}
        </div>
      )}
    </WorkspacePage>
  );
}

function DocLink({ label, url }: { label: string; url?: string | null }) {
  if (!url) return <div className="rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">{label}: not uploaded</div>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-4 py-3 text-sm font-medium text-primary hover:bg-muted transition-colors">
      <ExternalLink className="h-4 w-4 shrink-0" /> {label}
    </a>
  );
}

export function OrganiserAnalyticsPage() {
  return (
    <WorkspacePage title="Analytics" subtitle="Views, saves, inquiries, and deal performance across your portfolio.">
      <OrganiserAnalyticsPanel />
    </WorkspacePage>
  );
}

function OrganiserEventDetailSheet({
  eventId,
  onClose,
  onDeleteDraft,
}: {
  eventId: string | null;
  onClose: () => void;
  onDeleteDraft: (id: string) => void;
}) {
  const qc = useQueryClient();
  const fetchEvent = useServerFn(getEventForEdit);
  const autosave = useServerFn(autosaveEvent);
  const { data, isLoading } = useQuery({
    queryKey: ["event", eventId],
    queryFn: () => fetchEvent({ data: { id: eventId! } }),
    enabled: !!eventId,
  });

  const event = data?.event;
  const editable = !!event && ["draft", "revision_requested"].includes(event.status);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const formRef = useRef<Record<string, any> | null>(null);
  const debouncer = useRef<number | null>(null);
  const hydratedId = useRef<string | null>(null);

  useEffect(() => {
    if (!event || !eventId) {
      setForm(null);
      formRef.current = null;
      hydratedId.current = null;
      return;
    }
    if (event.id !== eventId) return;
    if (hydratedId.current === eventId) return;
    const next = { ...event };
    setForm(next);
    formRef.current = next;
    setSavedAt(event.updated_at ?? null);
    hydratedId.current = eventId;
  }, [event, eventId]);

  useEffect(() => {
    if (!eventId) {
      hydratedId.current = null;
      setForm(null);
      formRef.current = null;
    } else if (hydratedId.current && hydratedId.current !== eventId) {
      hydratedId.current = null;
      setForm(null);
      formRef.current = null;
    }
  }, [eventId]);

  useEffect(() => {
    return () => {
      if (debouncer.current) window.clearTimeout(debouncer.current);
    };
  }, []);

  function update(patch: Record<string, any>) {
    if (!editable) return;
    setForm((f) => {
      const next = { ...(f ?? {}), ...patch };
      formRef.current = next;
      if (debouncer.current) window.clearTimeout(debouncer.current);
      debouncer.current = window.setTimeout(() => {
        void doSave(next);
      }, 700);
      return next;
    });
  }

  async function doSave(snapshot: Record<string, any>) {
    if (!eventId || !editable) return;
    setSaving(true);
    try {
      const res = await autosave({
        data: {
          id: eventId,
          step: snapshot.form_step_completed ?? 0,
          patch: pickAutosavePatch(snapshot),
        },
      });
      setSavedAt(res.savedAt);
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      qc.invalidateQueries({ queryKey: ["event", eventId] });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveNow() {
    if (!formRef.current || !editable) return;
    if (debouncer.current) {
      window.clearTimeout(debouncer.current);
      debouncer.current = null;
    }
    await doSave(formRef.current);
    toast.success("Changes saved");
  }

  const isLive = event?.status === "listed" || event?.status === "approved";
  const showTimeline = event && ["submitted", "under_review", "approved", "revision_requested", "rejected", "listed"].includes(event.status);

  return (
    <Sheet open={!!eventId} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        {isLoading || !form ? (
          <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading event…
          </div>
        ) : (
          <>
            <SheetHeader className="pr-8 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <SheetTitle className="font-display">{form.name || "Untitled event"}</SheetTitle>
                <StatusBadge status={form.status} />
              </div>
              <SheetDescription>
                {editable
                  ? "Edit key details here, or open the full editor for the complete listing."
                  : "This event is locked for editing. Open the listing or use the full editor for review."}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-5">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-muted/40 px-2 py-3">
                  <div className="font-display text-lg font-bold">{event?.view_count ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Views</div>
                </div>
                <div className="rounded-xl bg-muted/40 px-2 py-3">
                  <div className="font-display text-lg font-bold">{event?.save_count ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Saves</div>
                </div>
                <div className="rounded-xl bg-muted/40 px-2 py-3">
                  <div className="font-display text-lg font-bold">{event?.inquiry_count ?? 0}</div>
                  <div className="text-[11px] text-muted-foreground">Inquiries</div>
                </div>
              </div>

              {showTimeline && <VettingTimeline status={form.status} />}

              <div className="space-y-3">
                <SheetField label="Event name">
                  <input
                    value={form.name ?? ""}
                    disabled={!editable}
                    onChange={(e) => update({ name: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  />
                </SheetField>
                <div className="grid grid-cols-2 gap-3">
                  <SheetField label="City">
                    <input
                      value={form.city ?? ""}
                      disabled={!editable}
                      onChange={(e) => update({ city: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    />
                  </SheetField>
                  <SheetField label="Country">
                    <select
                      value={form.country ?? ""}
                      disabled={!editable}
                      onChange={(e) => update({ country: e.target.value })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    >
                      <option value="">Select…</option>
                      {COUNTRIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </SheetField>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <SheetField label="Start date">
                    <input
                      type="date"
                      value={form.start_date ? String(form.start_date).slice(0, 10) : ""}
                      disabled={!editable}
                      onChange={(e) => update({ start_date: e.target.value || null })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    />
                  </SheetField>
                  <SheetField label="End date">
                    <input
                      type="date"
                      value={form.end_date ? String(form.end_date).slice(0, 10) : ""}
                      disabled={!editable}
                      onChange={(e) => update({ end_date: e.target.value || null })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                    />
                  </SheetField>
                </div>
                <SheetField label="Primary sector">
                  <select
                    value={form.primary_sector ?? ""}
                    disabled={!editable}
                    onChange={(e) => update({ primary_sector: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  >
                    <option value="">Select…</option>
                    {PRIMARY_SECTORS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </SheetField>
                <SheetField label="Venue">
                  <input
                    value={form.venue ?? ""}
                    disabled={!editable}
                    onChange={(e) => update({ venue: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm disabled:opacity-60"
                  />
                </SheetField>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
                {editable && (
                  <Button type="button" onClick={() => void handleSaveNow()} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Save changes
                  </Button>
                )}
                <Button type="button" variant="outline" asChild>
                  <Link to="/events/edit/$id" params={{ id: eventId! }}>
                    Open full editor
                  </Link>
                </Button>
                {isLive && form.slug && (
                  <Button type="button" variant="ghost" asChild>
                    <Link to="/events/$slug" params={{ slug: form.slug }}>
                      View listing <ExternalLink className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
                {form.status === "draft" && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onDeleteDraft(eventId!)}
                  >
                    <Trash2 className="mr-1.5 h-4 w-4" /> Delete draft
                  </Button>
                )}
              </div>
              {(saving || savedAt) && editable && (
                <p className="text-xs text-muted-foreground">
                  {saving ? "Saving…" : savedAt ? `Last saved ${new Date(savedAt).toLocaleTimeString()}` : null}
                </p>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function SheetField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function PipelineEventTable({ event: ev, forms, deals, partnerMap }: { event: any; forms: any[]; deals: any[]; partnerMap: Record<string, string> }) {
  const dealByForm: Record<string, any> = {};
  for (const d of deals) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;
  return (
    <DashboardPanel title={ev.name} description={[ev.city, ev.country].filter(Boolean).join(", ")}>
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {ev.view_count ?? 0} views</span>
        <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> {ev.save_count ?? 0} saves</span>
        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {ev.inquiry_count ?? 0} inquiries</span>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <tr><th className="px-3 py-3">Company</th><th className="px-3 py-3">Contact</th><th className="px-3 py-3">Budget</th><th className="px-3 py-3">Referral</th><th className="px-3 py-3">Deal value</th><th className="px-3 py-3">Deal stage</th><th className="px-3 py-3">Submitted</th><th className="px-3 py-3"></th></tr>
          </thead>
          <tbody className="divide-y divide-border">
            {forms.map((f: any) => {
              const deal = dealByForm[f.id];
              const partnerName = f.referral_partner_id ? partnerMap[f.referral_partner_id] : null;
              return (
                <tr key={f.id} className="hover:bg-muted/10">
                  <td className="px-3 py-3 font-medium">{f.company_name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{f.contact_name}</td>
                  <td className="px-3 py-3 text-xs font-semibold">{f.budget_range_min || f.budget_range_max ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}` : "—"}</td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{partnerName ?? (f.referral_partner_id ? "Partner" : "Direct")}</td>
                  <td className="px-3 py-3 text-xs font-semibold">{deal?.deal_value_native ? fmtMoney(deal.deal_currency, Number(deal.deal_value_native)) : "—"}</td>
                  <td className="px-3 py-3 capitalize">
                    {deal ? (
                      <div className="space-y-1">
                        <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-deep">{deal.status.replace(/_/g, " ")}</span>
                        {deal.contract_url && (
                          <a href={deal.contract_url} target="_blank" rel="noreferrer" className="block text-[11px] font-semibold text-primary hover:underline">
                            View contract →
                          </a>
                        )}
                      </div>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">Awaiting deal</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">{f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "—"}</td>
                  <td className="px-3 py-3 text-right">{f.sponsor_user_id && <Link to="/messages" search={{ to: f.sponsor_user_id, event_id: ev.id }} className="text-xs font-semibold text-primary hover:underline">Message →</Link>}</td>
                </tr>
              );
            })}
            {!forms.length && <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-muted-foreground italic">No sponsor inquiries yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
