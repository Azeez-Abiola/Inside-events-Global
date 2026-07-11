import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus, Loader2, Trash2, CalendarDays, MapPin, Eye, Bookmark, MessageSquare,
  ShieldCheck, FolderOpen, ExternalLink, BarChart3, TrendingUp,
} from "lucide-react";
import { StatusBadge } from "@/components/app-shell";
import { QuickLinkCard, fmtDateRange } from "@/components/dashboards/shared";
import { KpiTile, DonutBreakdown, FeaturedHeroCard, AgendaList } from "@/components/dashboards/voom-primitives";
import {
  DashboardEmpty, DashboardLoading, DashboardPanel, DashboardTabs, VettingTimeline,
} from "@/components/dashboards/dashboard-shell";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { OrganiserAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { createEventDraft, getMyEvents, deleteDraftEvent } from "@/lib/events.functions";
import { getOrganiserPipeline } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";
import {
  EVENT_STATUS_GROUPS, type EventStatusGroup, filterEventsByGroup, groupEventsByStatus,
} from "@/lib/event-dashboard";

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
  const { events, counts, buckets, eventsLoading, createBtn, del } = useOrganiserEvents();
  const filteredEvents = useMemo(() => filterEventsByGroup(events, statusFilter), [events, statusFilter]);
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

  return (
    <WorkspacePage
      title="Organiser workspace"
      subtitle="Manage listings, track vetting, and monitor sponsor inquiries."
      action={createBtn}
      showGreeting
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={CalendarDays} label="Active listings" value={activeEventsCount} loading={eventsLoading} trend={`${counts.live} live`} />
        <KpiTile icon={ShieldCheck} label="Pending vetting" value={counts.pending} loading={eventsLoading} />
        <KpiTile icon={MessageSquare} label="Sponsor inquiries" value={events.reduce((a: number, e: any) => a + (e.inquiry_count ?? 0), 0)} loading={eventsLoading} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {statusDonut.length > 0 && (
            <DonutBreakdown
              title="Portfolio by status"
              description="How your events are distributed"
              data={statusDonut}
              nameKey="status"
              valueKey="count"
              centerLabel="Events"
              centerValue={events.length}
            />
          )}

          <div className="rounded-2xl bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">My events</h3>
                <p className="text-xs text-muted-foreground">All listings in your workspace</p>
              </div>
            </div>
            <div className="p-5">
              <DashboardTabs active={statusFilter} onChange={(id) => setStatusFilter(id as EventStatusGroup)} tabs={EVENT_TABS.map((t) => ({ id: t.id, label: t.label, count: counts[t.id] }))} />
              {statusFilter !== "all" && (
                <p className="mt-3 text-sm text-muted-foreground">{EVENT_STATUS_GROUPS[statusFilter as Exclude<EventStatusGroup, "all">]?.description}</p>
              )}
              {eventsLoading ? (
                <DashboardLoading label="Loading your events…" />
              ) : filteredEvents.length === 0 ? (
                <DashboardEmpty icon={FolderOpen} title="No events yet" description="Create your first event draft to start the IGE vetting flow." action={createBtn} />
              ) : (
                <div className="mt-4 grid gap-4">
                  {filteredEvents.map((e: any) => (
                    <EventCard
                      key={e.id}
                      event={e}
                      onDelete={() => { if (confirm("Delete this draft?")) del.mutate(e.id); }}
                      showVettingTimeline={["submitted", "under_review", "approved", "revision_requested", "rejected"].includes(e.status)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
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

          <AgendaList title="Upcoming start dates" items={agendaItems} empty="No scheduled events yet." />

          <div className="space-y-2">
            {[
              { to: "/dashboard/pipeline", label: "Sponsorship pipeline", desc: "Inquiries & deal stages", icon: TrendingUp },
              { to: "/dashboard/documents", label: "Documents", desc: "Decks & assets", icon: FolderOpen },
              { to: "/dashboard/analytics", label: "Analytics", desc: "Views & conversions", icon: BarChart3 },
            ].map((item) => (
              <QuickLinkCard key={item.to} {...item} />
            ))}
          </div>
        </div>
      </div>

      {counts.revision > 0 && statusFilter !== "revision" && (
        <DashboardPanel title="Action needed" description="Events sent back for revision">
          <div className="space-y-3">
            {buckets.revision.map((e: any) => (
              <Link key={e.id} to="/events/edit/$id" params={{ id: e.id }} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:border-amber-300">
                <span className="font-semibold text-amber-950">{e.name || "Untitled event"}</span>
                <span className="text-xs font-medium text-amber-800">Continue editing →</span>
              </Link>
            ))}
          </div>
        </DashboardPanel>
      )}
    </WorkspacePage>
  );
}

export function OrganiserPipelinePage() {
  const { createBtn } = useOrganiserEvents();
  const fetchPipeline = useServerFn(getOrganiserPipeline);
  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({ queryKey: ["org-pipeline"], queryFn: () => fetchPipeline() });

  return (
    <WorkspacePage title="Sponsorship pipeline" subtitle="Sponsor commitment forms and deal stages across your events.">
      {pipelineLoading ? <DashboardLoading label="Loading pipeline…" /> : !pipelineData?.events?.length ? (
        <DashboardEmpty icon={MessageSquare} title="No live pipeline yet" description="Once an event is listed, sponsor inquiries will appear here." action={createBtn} />
      ) : (
        <div className="space-y-6">
          {pipelineData.events.map((ev: any) => (
            <PipelineEventTable key={ev.id} event={ev}
              partnerMap={pipelineData.partnerMap ?? {}}
              forms={(pipelineData.forms ?? []).filter((f: any) => f.event_id === ev.id)}
              deals={(pipelineData.deals ?? []).filter((d: any) => d.event_id === ev.id)} />
          ))}
        </div>
      )}
    </WorkspacePage>
  );
}

export function OrganiserDocumentsPage() {
  const { events, eventsLoading } = useOrganiserEvents();
  const docs = events.filter((e: any) => e.sponsorship_deck_url || e.banner_image_url || e.floor_plan_url);

  return (
    <WorkspacePage title="Documents" subtitle="Sponsorship decks, banners, and floor plans across your events.">
      {eventsLoading ? <DashboardLoading label="Loading documents…" /> : docs.length === 0 ? (
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

function EventCard({ event: e, onDelete, showVettingTimeline }: { event: any; onDelete: () => void; showVettingTimeline: boolean }) {
  const isLive = e.status === "listed" || e.status === "approved";
  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/events/edit/$id" params={{ id: e.id }} className="font-display text-base font-bold text-foreground hover:text-primary-deep">{e.name || "Untitled event"}</Link>
            <StatusBadge status={e.status} />
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {e.start_date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {fmtDateRange(e.start_date, e.end_date)}</span>}
            {(e.city || e.country) && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {[e.city, e.country].filter(Boolean).join(", ")}</span>}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>{e.view_count ?? 0} views</span><span>{e.save_count ?? 0} saves</span><span>{e.inquiry_count ?? 0} inquiries</span>
          </div>
          {showVettingTimeline && <VettingTimeline status={e.status} />}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isLive && e.slug && (
            <Link to="/events/$slug" params={{ slug: e.slug }} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View listing <ExternalLink className="h-3 w-3" /></Link>
          )}
          {e.status === "draft" && (
            <button type="button" onClick={onDelete} className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
          )}
        </div>
      </div>
    </div>
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
