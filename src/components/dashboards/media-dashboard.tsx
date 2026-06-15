import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Bookmark, Newspaper, Loader2, Calendar, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardHeader, DashboardTabs } from "@/components/dashboards/dashboard-shell";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { getSponsorDashboard } from "@/lib/deals.functions";
import { submitMediaRequest, getMyMediaRequests } from "@/lib/media.functions";

export function MediaPartnerDashboard() {
  const [activeTab, setActiveTab] = useState<"explore" | "saved" | "requests">("explore");
  const [requestEvent, setRequestEvent] = useState<{ id: string; name: string } | null>(null);

  const fetchMarketplace = useServerFn(listMarketplaceEvents);
  const fetchSaves = useServerFn(getSponsorDashboard);
  const fetchRequests = useServerFn(getMyMediaRequests);

  const { data: marketplaceData, isLoading: exploreLoading } = useQuery({
    queryKey: ["media-partner-marketplace"],
    queryFn: () => fetchMarketplace({ data: { vetted_only: true, per_page: 12 } as any }),
  });
  const { data: savesData, isLoading: savesLoading } = useQuery({
    queryKey: ["sponsor-dash"],
    queryFn: () => fetchSaves(),
  });
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["media-requests"],
    queryFn: () => fetchRequests(),
  });

  const events = marketplaceData?.events ?? [];
  const savedEvents = (savesData?.saves ?? []).map((s: any) => savesData?.eventMap[s.event_id]).filter(Boolean);
  const requests = requestsData?.requests ?? [];

  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHeader
          title="Media partner workspace"
          subtitle="Discover vetted events to cover and request press credentials or coverage access."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={CalendarDays} label="Events to cover" value={events.length} loading={exploreLoading} />
          <StatCard icon={Bookmark} label="Saved opportunities" value={savedEvents.length} loading={savesLoading} />
          <StatCard icon={Newspaper} label="My requests" value={requests.length} loading={requestsLoading} />
        </div>

        <DashboardTabs
          active={activeTab}
          onChange={(id) => setActiveTab(id as typeof activeTab)}
          tabs={[
            { id: "explore", label: "Explore", count: events.length },
            { id: "saved", label: "Saved", count: savedEvents.length },
            { id: "requests", label: "My requests", count: requests.length },
          ]}
        />

        {activeTab === "explore" ? (
          exploreLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {events.map((e: any) => (
                <div key={e.id} className="overflow-hidden rounded-xl border border-border bg-card hover:shadow-soft transition-all duration-300">
                  <Link to="/events/$slug" params={{ slug: e.slug }} className="group block">
                    {e.banner_image_url ? (
                      <img src={e.banner_image_url} alt={e.name} className="h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                    ) : (
                      <div className="h-32 bg-muted flex items-center justify-center text-muted-foreground"><Calendar className="h-8 w-8" /></div>
                    )}
                    <div className="p-4 pb-2">
                      <div className="font-bold text-foreground truncate group-hover:text-primary-deep transition-colors">{e.name}</div>
                      <div className="mt-1 text-xs text-muted-foreground truncate">{e.primary_sector} · {[e.city, e.country].filter(Boolean).join(", ")}</div>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setRequestEvent({ id: e.id, name: e.name })}
                      className="mt-1 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      <Newspaper className="h-3.5 w-3.5" /> Request coverage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === "saved" ? (
          savesLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : savedEvents.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center"><p className="text-muted-foreground text-sm">No saved opportunities yet.</p></div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedEvents.map((ev: any) => (
                <Link key={ev.id} to="/events/$slug" params={{ slug: ev.slug }} className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft hover:border-primary">
                  {ev.banner_image_url ? (
                    <img src={ev.banner_image_url} alt={ev.name} className="h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                  ) : (
                    <div className="h-32 bg-muted flex items-center justify-center text-muted-foreground"><Calendar className="h-8 w-8" /></div>
                  )}
                  <div className="p-4">
                    <div className="font-bold text-foreground group-hover:text-primary-deep transition-colors truncate">{ev.name}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{[ev.city, ev.country].filter(Boolean).join(", ")}</div>
                  </div>
                </Link>
              ))}
            </div>
          )
        ) : requestsLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : requests.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground text-sm">No coverage requests yet. Browse Explore and request coverage on an event.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr><th className="px-5 py-3">Event</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Requested</th></tr>
              </thead>
              <tbody className="divide-y divide-border">
                {requests.map((r: any) => {
                  const ev = requestsData!.events[r.event_id];
                  return (
                    <tr key={r.id} className="hover:bg-muted/10">
                      <td className="px-5 py-3.5 font-medium text-foreground">{ev?.name ?? "—"}</td>
                      <td className="px-5 py-3.5 capitalize text-muted-foreground">{r.request_type.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${r.status === "approved" ? "bg-emerald-100 text-emerald-800" : r.status === "declined" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{r.status}</span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {requestEvent && <CoverageRequestModal event={requestEvent} onClose={() => setRequestEvent(null)} />}
    </AppShell>
  );
}
function CoverageRequestModal({ event, onClose }: { event: { id: string; name: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const submit = useServerFn(submitMediaRequest);
  const [type, setType] = useState<"coverage" | "press_credentials" | "content">("coverage");
  const [message, setMessage] = useState("");

  const mut = useMutation({
    mutationFn: () => submit({ data: { event_id: event.id, request_type: type, message: message || null } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-requests"] });
      toast.success("Request sent to the IGE team");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold text-foreground">Request coverage</h3>
        <p className="mt-1 text-sm text-muted-foreground">For <span className="font-semibold text-foreground">{event.name}</span></p>

        <label className="mt-5 block text-sm">
          <span className="mb-1.5 block font-medium">Request type</span>
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm">
            <option value="coverage">Event coverage</option>
            <option value="press_credentials">Press credentials</option>
            <option value="content">Content / documentary</option>
          </select>
        </label>

        <label className="mt-4 block text-sm">
          <span className="mb-1.5 block font-medium">Message (optional)</span>
          <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" placeholder="Tell the IGE team about your outlet and what you'd cover…" />
        </label>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button onClick={() => mut.mutate()} disabled={mut.isPending} className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {mut.isPending ? "Sending…" : "Send request"}
          </button>
        </div>
      </div>
    </div>
  );
}
