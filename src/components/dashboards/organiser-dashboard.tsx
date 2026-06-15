import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus, Loader2, Trash2, CalendarDays, MapPin, Eye, Bookmark, MessageSquare,
  ShieldCheck, FolderOpen, BarChart3, ExternalLink,
} from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { StatCard, fmtDateRange } from "@/components/dashboards/shared";
import {
  DashboardEmpty,
  DashboardHeader,
  DashboardLoading,
  DashboardPanel,
  DashboardTabs,
  VettingTimeline,
} from "@/components/dashboards/dashboard-shell";
import { createEventDraft, getMyEvents, deleteDraftEvent } from "@/lib/events.functions";
import { getOrganiserPipeline } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";
import { OrganiserAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import {
  EVENT_STATUS_GROUPS,
  type EventStatusGroup,
  filterEventsByGroup,
  groupEventsByStatus,
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

export function OrganiserDashboard() {
  const [mainTab, setMainTab] = useState<"events" | "pipeline" | "analytics">("events");
  const [statusFilter, setStatusFilter] = useState<EventStatusGroup>("all");
  const navigate = useNavigate();
  const qc = useQueryClient();

  const fetchEvents = useServerFn(getMyEvents);
  const fetchPipeline = useServerFn(getOrganiserPipeline);
  const createDraft = useServerFn(createEventDraft);
  const removeDraft = useServerFn(deleteDraftEvent);

  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ["events", "mine"],
    queryFn: () => fetchEvents(),
  });

  const { data: pipelineData, isLoading: pipelineLoading } = useQuery({
    queryKey: ["org-pipeline"],
    queryFn: () => fetchPipeline(),
  });

  const create = useMutation({
    mutationFn: () => createDraft(),
    onSuccess: ({ id }) => {
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      navigate({ to: "/events/edit/$id", params: { id } });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const del = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events", "mine"] });
      toast.success("Draft deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const events = eventsData?.events ?? [];
  const { counts, buckets } = useMemo(() => groupEventsByStatus(events), [events]);
  const filteredEvents = useMemo(
    () => filterEventsByGroup(events, statusFilter),
    [events, statusFilter],
  );

  const activeEventsCount = counts.approved + counts.live;
  const pendingVettingCount = counts.pending;
  const totalViews = events.reduce((acc: number, e: any) => acc + (e.view_count ?? 0), 0);
  const totalInquiries = events.reduce((acc: number, e: any) => acc + (e.inquiry_count ?? 0), 0);
  const totalSaves = events.reduce((acc: number, e: any) => acc + (e.save_count ?? 0), 0);
  const closedDeals = (pipelineData?.deals ?? []).filter((d: any) => d.status === "payment_received").length;

  const createBtn = (
    <button
      type="button"
      onClick={() => create.mutate()}
      disabled={create.isPending}
      className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-60"
    >
      {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
      Create event
    </button>
  );

  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHeader
          title="Organiser workspace"
          subtitle="Manage your event listings, track IGE vetting status, and monitor sponsor inquiries across your portfolio."
          action={createBtn}
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={CalendarDays} label="Active listings" value={activeEventsCount} loading={eventsLoading} />
          <StatCard icon={ShieldCheck} label="Pending vetting" value={pendingVettingCount} loading={eventsLoading} />
          <StatCard icon={Eye} label="Profile views" value={totalViews} loading={eventsLoading} />
          <StatCard icon={MessageSquare} label="Sponsor inquiries" value={totalInquiries} loading={eventsLoading} />
        </div>

        <DashboardTabs
          active={mainTab}
          onChange={(id) => setMainTab(id as typeof mainTab)}
          tabs={[
            { id: "events", label: "My events", count: events.length },
            { id: "pipeline", label: "Sponsorship pipeline", count: pipelineData?.forms?.length ?? 0 },
            { id: "analytics", label: "Analytics" },
          ]}
        />

        {mainTab === "events" && (
          <div className="space-y-5">
            <DashboardTabs
              active={statusFilter}
              onChange={(id) => setStatusFilter(id as EventStatusGroup)}
              tabs={EVENT_TABS.map((t) => ({
                id: t.id,
                label: t.label,
                count: counts[t.id],
              }))}
            />

            {statusFilter !== "all" && (
              <p className="text-sm text-muted-foreground">
                {EVENT_STATUS_GROUPS[statusFilter as Exclude<EventStatusGroup, "all">]?.description}
              </p>
            )}

            {eventsLoading ? (
              <DashboardLoading label="Loading your events…" />
            ) : filteredEvents.length === 0 ? (
              <DashboardEmpty
                icon={FolderOpen}
                title={statusFilter === "all" ? "No events yet" : `No ${EVENT_TABS.find((t) => t.id === statusFilter)?.label.toLowerCase()}`}
                description={
                  statusFilter === "all"
                    ? "Create your first event draft to start the IGE vetting flow. Your progress auto-saves at every step."
                    : "Events in this status will appear here once created or submitted."
                }
                action={statusFilter === "all" ? createBtn : undefined}
              />
            ) : (
              <div className="grid gap-4">
                {filteredEvents.map((e: any) => (
                  <EventCard
                    key={e.id}
                    event={e}
                    onDelete={() => {
                      if (confirm("Delete this draft?")) del.mutate(e.id);
                    }}
                    showVettingTimeline={["submitted", "under_review", "approved", "revision_requested", "rejected"].includes(e.status)}
                  />
                ))}
              </div>
            )}

            {counts.revision > 0 && statusFilter !== "revision" && (
              <DashboardPanel title="Action needed" description="Events sent back for revision">
                <div className="space-y-3">
                  {buckets.revision.map((e: any) => (
                    <Link
                      key={e.id}
                      to="/events/edit/$id"
                      params={{ id: e.id }}
                      className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm hover:border-amber-300"
                    >
                      <span className="font-semibold text-amber-950">{e.name || "Untitled event"}</span>
                      <span className="text-xs font-medium text-amber-800">Continue editing →</span>
                    </Link>
                  ))}
                </div>
              </DashboardPanel>
            )}
          </div>
        )}

        {mainTab === "pipeline" && (
          pipelineLoading ? (
            <DashboardLoading label="Loading sponsorship pipeline…" />
          ) : !pipelineData?.events?.length ? (
            <DashboardEmpty
              icon={MessageSquare}
              title="No live pipeline yet"
              description="Once an event is listed on the marketplace, sponsor commitment forms and deal stages will appear here."
              action={createBtn}
            />
          ) : (
            <div className="space-y-6">
              {pipelineData.events.map((ev: any) => (
                <PipelineEventTable
                  key={ev.id}
                  event={ev}
                  forms={(pipelineData.forms ?? []).filter((f: any) => f.event_id === ev.id)}
                  deals={(pipelineData.deals ?? []).filter((d: any) => d.event_id === ev.id)}
                />
              ))}
            </div>
          )
        )}

        {mainTab === "analytics" && <OrganiserAnalyticsPanel />}
      </div>
    </AppShell>
  );
}

function EventCard({
  event: e,
  onDelete,
  showVettingTimeline,
}: {
  event: any;
  onDelete: () => void;
  showVettingTimeline: boolean;
}) {
  const isLive = e.status === "listed" || e.status === "approved";

  return (
    <div className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/events/edit/$id"
              params={{ id: e.id }}
              className="font-display text-base font-bold text-foreground hover:text-primary-deep"
            >
              {e.name || "Untitled event"}
            </Link>
            <StatusBadge status={e.status} />
            {e.ige_vetted && (
              <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-secondary-deep">
                IGE Vetted
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {e.start_date && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> {fmtDateRange(e.start_date, e.end_date)}
              </span>
            )}
            {(e.city || e.country) && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {[e.city, e.country].filter(Boolean).join(", ")}
              </span>
            )}
            {e.event_type && <span>· {e.event_type}</span>}
          </div>
          <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
            <span>{e.view_count ?? 0} views</span>
            <span>{e.save_count ?? 0} saves</span>
            <span>{e.inquiry_count ?? 0} inquiries</span>
          </div>
          {showVettingTimeline && <VettingTimeline status={e.status} />}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {isLive && e.slug && (
            <Link
              to="/events/$slug"
              params={{ slug: e.slug }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              View listing <ExternalLink className="h-3 w-3" />
            </Link>
          )}
          {e.status === "draft" && (
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineEventTable({
  event: ev,
  forms,
  deals,
}: {
  event: any;
  forms: any[];
  deals: any[];
}) {
  const dealByForm: Record<string, any> = {};
  for (const d of deals) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;

  return (
    <DashboardPanel
      title={ev.name}
      description={[ev.city, ev.country].filter(Boolean).join(", ")}
    >
      <div className="mb-4 flex gap-4 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {ev.view_count ?? 0} views</span>
        <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> {ev.save_count ?? 0} saves</span>
        <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {ev.inquiry_count ?? 0} inquiries</span>
      </div>
      <div className="overflow-x-auto -mx-5 px-5">
        <table className="w-full min-w-[700px] text-sm">
          <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
            <tr>
              <th className="px-3 py-3">Company</th>
              <th className="px-3 py-3">Contact</th>
              <th className="px-3 py-3">Budget</th>
              <th className="px-3 py-3">Referral</th>
              <th className="px-3 py-3">Deal stage</th>
              <th className="px-3 py-3">Submitted</th>
              <th className="px-3 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {forms.map((f: any) => {
              const deal = dealByForm[f.id];
              return (
                <tr key={f.id} className="hover:bg-muted/10">
                  <td className="px-3 py-3 font-medium">{f.company_name}</td>
                  <td className="px-3 py-3 text-muted-foreground">{f.contact_name}</td>
                  <td className="px-3 py-3 text-xs font-semibold">
                    {f.budget_range_min || f.budget_range_max
                      ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}`
                      : "—"}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {f.referral_partner_id ? "Partner referred" : "Direct"}
                  </td>
                  <td className="px-3 py-3 capitalize">
                    {deal ? (
                      <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-deep">
                        {deal.status.replace(/_/g, " ")}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                        Awaiting deal
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground">
                    {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-3 py-3 text-right">
                    {f.sponsor_user_id && (
                      <Link
                        to="/messages"
                        search={{ to: f.sponsor_user_id, event_id: ev.id }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Message →
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
            {!forms.length && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-muted-foreground italic">
                  No sponsor inquiries yet for this event.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </DashboardPanel>
  );
}
