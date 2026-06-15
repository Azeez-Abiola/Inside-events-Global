import { Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus, Loader2, Trash2, CalendarDays, MapPin, Eye, Bookmark, MessageSquare,
  ShieldCheck, FolderOpen,
} from "lucide-react";
import { AppShell, StatusBadge } from "@/components/app-shell";
import { StatCard, fmtDateRange } from "@/components/dashboards/shared";
import { createEventDraft, getMyEvents, deleteDraftEvent } from "@/lib/events.functions";
import { getOrganiserPipeline } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

export function OrganiserDashboard() {
  const [activeTab, setActiveTab] = useState<"events" | "pipeline">("events");
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
      navigate({ to: "/events/$id", params: { id } });
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
  const activeEventsCount = events.filter((e: any) => e.status === "listed" || e.status === "approved").length;
  const pendingVettingCount = events.filter((e: any) => e.status === "submitted" || e.status === "under_review").length;
  const totalViews = events.reduce((acc: number, e: any) => acc + (e.view_count ?? 0), 0);
  const totalInquiries = events.reduce((acc: number, e: any) => acc + (e.inquiry_count ?? 0), 0);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight bg-gradient-to-r from-primary-deep to-primary bg-clip-text text-transparent">
              Organiser Dashboard
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              Create event sponsorship packages, track inquiries and watch vetting status.
            </p>
          </div>
          <button
            onClick={() => create.mutate()}
            disabled={create.isPending}
            className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all disabled:opacity-60 cursor-pointer self-start sm:self-auto"
          >
            {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create event
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={CalendarDays} label="Active Events" value={activeEventsCount} loading={eventsLoading} />
          <StatCard icon={ShieldCheck} label="Pending Vetting" value={pendingVettingCount} loading={eventsLoading} />
          <StatCard icon={Eye} label="Total Views" value={totalViews} loading={eventsLoading} />
          <StatCard icon={MessageSquare} label="Total Inquiries" value={totalInquiries} loading={eventsLoading} />
        </div>

        <div className="border-b border-border">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("events")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "events" ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              My Events ({events.length})
            </button>
            <button
              onClick={() => setActiveTab("pipeline")}
              className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "pipeline" ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            >
              Sponsorship Pipeline
            </button>
          </div>
        </div>

        {activeTab === "events" ? (
          eventsLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading events…
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
              <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
              <h3 className="mt-4 font-display text-xl font-bold">No events listed</h3>
              <p className="mt-2 text-sm text-muted-foreground">Create your first event draft to start finding sponsors.</p>
              <button
                onClick={() => create.mutate()}
                className="mt-5 inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create event
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {events.map((e: any) => (
                <Link
                  to="/events/$id"
                  params={{ id: e.id }}
                  key={e.id}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-5 hover:border-primary transition-all hover:shadow-soft"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary-deep transition-colors">
                        {e.name || "Untitled event"}
                      </h3>
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
                  </div>
                  {e.status === "draft" && (
                    <button
                      onClick={(ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        if (confirm("Delete this draft?")) del.mutate(e.id);
                      }}
                      className="rounded-md p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </Link>
              ))}
            </div>
          )
        ) : pipelineLoading ? (
          <div className="flex justify-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" /> Loading pipeline…
          </div>
        ) : !pipelineData?.events?.length ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground text-sm">No events listed. Create events first to view their pipeline.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {pipelineData.events.map((ev: any) => {
              const evForms = (pipelineData.forms ?? []).filter((f: any) => f.event_id === ev.id);
              const evDeals = (pipelineData.deals ?? []).filter((d: any) => d.event_id === ev.id);
              const dealByForm: Record<string, any> = {};
              for (const d of evDeals) if (d.commitment_form_id) dealByForm[d.commitment_form_id] = d;

              return (
                <div key={ev.id} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-muted/20 p-5">
                    <div>
                      <Link to="/events/$id" params={{ id: ev.id }} className="font-display text-base font-bold hover:underline hover:text-primary-deep">
                        {ev.name}
                      </Link>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {[ev.city, ev.country].filter(Boolean).join(", ")} ·{" "}
                        {ev.start_date ? new Date(ev.start_date).toLocaleDateString() : "TBD"}
                      </div>
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {ev.view_count ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><Bookmark className="h-3 w-3" /> {ev.save_count ?? 0}</span>
                      <span className="inline-flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {ev.inquiry_count ?? 0}</span>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[700px]">
                      <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                        <tr>
                          <th className="px-5 py-3">Company</th>
                          <th className="px-5 py-3">Contact</th>
                          <th className="px-5 py-3">Budget Request</th>
                          <th className="px-5 py-3">Deal stage</th>
                          <th className="px-5 py-3">Submitted</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {evForms.map((f: any) => {
                          const deal = dealByForm[f.id];
                          return (
                            <tr key={f.id} className="hover:bg-muted/10 transition-colors">
                              <td className="px-5 py-3.5 font-medium text-foreground">{f.company_name}</td>
                              <td className="px-5 py-3.5 text-muted-foreground">{f.contact_name}</td>
                              <td className="px-5 py-3.5 text-xs font-semibold">
                                {f.budget_range_min || f.budget_range_max
                                  ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}`
                                  : "-"}
                              </td>
                              <td className="px-5 py-3.5 capitalize">
                                {deal ? (
                                  <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary-deep">
                                    {deal.status.replace(/_/g, " ")}
                                  </span>
                                ) : (
                                  <span className="inline-flex rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                                    Pending vetting
                                  </span>
                                )}
                              </td>
                              <td className="px-5 py-3.5 text-xs text-muted-foreground">
                                {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "-"}
                              </td>
                            </tr>
                          );
                        })}
                        {!evForms.length && (
                          <tr>
                            <td colSpan={5} className="px-5 py-8 text-center text-sm text-muted-foreground italic">
                              No sponsor inquiries yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
