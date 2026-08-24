import { Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarDays, Bookmark, Newspaper, Calendar, Send, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ensureAccessToken, isAuthError } from "@/lib/auth-session";
import { demoLoginSearch } from "@/lib/demo-accounts";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardHeader, DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar, DashboardFilterSelect } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardCardGridSkeleton, DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { MediaAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { listMarketplaceEvents, toggleSaveEvent } from "@/lib/marketplace.functions";
import { submitMediaRequest, getMyMediaRequests, getMediaPartnerSaves } from "@/lib/media.functions";
import { useTableFilters } from "@/hooks/use-table-filters";

export function MediaPartnerDashboard({ section = "explore" }: { section?: "overview" | "explore" | "saved" | "requests" | "analytics" }) {
  const [requestEvent, setRequestEvent] = useState<{ id: string; name: string } | null>(null);
  const [requestSearch, setRequestSearch] = useState("");
  const [requestStatus, setRequestStatus] = useState("all");

  const fetchMarketplace = useServerFn(listMarketplaceEvents);
  const fetchSaves = useServerFn(getMediaPartnerSaves);
  const fetchRequests = useServerFn(getMyMediaRequests);

  const { data: marketplaceData, isLoading: exploreLoading } = useQuery({
    queryKey: ["media-partner-marketplace"],
    queryFn: () => fetchMarketplace({ data: { vetted_only: true, per_page: 12 } as any }),
  });
  const { data: savesData, isLoading: savesLoading } = useQuery({
    queryKey: ["media-saves"],
    queryFn: () => fetchSaves(),
  });
  const { data: requestsData, isLoading: requestsLoading } = useQuery({
    queryKey: ["media-requests"],
    queryFn: () => fetchRequests(),
  });

  const events = marketplaceData?.events ?? [];
  const savedEvents = (savesData?.saves ?? []).map((s: any) => savesData?.eventMap[s.event_id]).filter(Boolean);
  const requests = (requestsData?.requests ?? []) as unknown as Array<{
    id: string;
    event_id: string;
    request_type: string;
    status: string;
    created_at: string;
  }>;

  const requestStatusCounts = useMemo(() => {
    const base = { all: requests.length, pending: 0, approved: 0, declined: 0, completed: 0 };
    for (const r of requests) {
      const s = r.status as keyof typeof base;
      if (s in base && s !== "all") base[s]++;
    }
    return base;
  }, [requests]);

  const filteredRequests = useTableFilters({
    rows: requests,
    searchText: requestSearch,
    statusFilter: requestStatus,
    search: (r) => {
      const ev = requestsData?.events?.[r.event_id];
      return [ev?.name, r.request_type, r.status].filter(Boolean).join(" ");
    },
    matchStatus: (r, filter) => r.status === filter,
  });

  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHeader
          title="Media Command Center"
          subtitle="Coverage requests, saved opportunities, and reach signals across vetted events."
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard icon={CalendarDays} label="Events to cover" value={events.length} loading={exploreLoading} />
          <StatCard icon={Bookmark} label="Saved opportunities" value={savedEvents.length} loading={savesLoading} />
          <StatCard icon={Newspaper} label="My requests" value={requests.length} loading={requestsLoading} />
        </div>

        {section === "overview" && (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {[
                { to: "/dashboard/explore", label: "Explore", desc: "Events to cover" },
                { to: "/dashboard/saved", label: "Saved", desc: "Bookmarked opportunities" },
                { to: "/dashboard/requests", label: "My requests", desc: "Coverage requests" },
                { to: "/dashboard/analytics", label: "Analytics", desc: "Sector & request trends" },
              ].map((item) => (
                <Link key={item.to} to={item.to} className="rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-all">
                  <div className="font-semibold">{item.label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
                </Link>
              ))}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                  <div>
                    <h3 className="font-display text-sm font-bold">Coverage requests</h3>
                    <p className="text-xs text-muted-foreground">Latest submissions and status</p>
                  </div>
                  <Link to="/dashboard/requests" className="text-xs font-semibold text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-border/50">
                  {requestsLoading ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
                  ) : requests.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground italic">No coverage requests yet.</p>
                  ) : (
                    requests.slice(0, 5).map((r: any) => {
                      const ev = requestsData?.events?.[r.event_id];
                      return (
                        <div key={r.id} className="flex items-start justify-between gap-3 px-5 py-3.5">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold">{ev?.name ?? "Event"}</div>
                            <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                              {(r.request_type ?? "coverage").replace(/_/g, " ")}
                              {r.created_at ? ` · ${new Date(r.created_at).toLocaleDateString()}` : ""}
                            </div>
                          </div>
                          <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                            {(r.status ?? "pending").replace(/_/g, " ")}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card shadow-soft">
                <div className="flex items-center justify-between border-b border-border/60 px-5 py-4">
                  <div>
                    <h3 className="font-display text-sm font-bold">Saved events</h3>
                    <p className="text-xs text-muted-foreground">Bookmarks for coverage planning</p>
                  </div>
                  <Link to="/dashboard/saved" className="text-xs font-semibold text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-border/50">
                  {savesLoading ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground">Loading…</p>
                  ) : savedEvents.length === 0 ? (
                    <p className="px-5 py-8 text-sm text-muted-foreground italic">No saved opportunities yet.</p>
                  ) : (
                    savedEvents.slice(0, 5).map((ev: any) => (
                      <Link
                        key={ev.id}
                        to="/events/$slug"
                        params={{ slug: ev.slug }}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30"
                      >
                        {ev.banner_image_url ? (
                          <img src={ev.banner_image_url} alt="" className="h-10 w-14 shrink-0 rounded object-cover" />
                        ) : (
                          <div className="flex h-10 w-14 shrink-0 items-center justify-center rounded bg-muted">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold">{ev.name}</div>
                          <div className="truncate text-xs text-muted-foreground">
                            {[ev.city, ev.country].filter(Boolean).join(", ") || "—"}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5">
              <h3 className="font-display text-sm font-bold">Reach signals</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Audience reach metrics will appear here as coverage outcomes are logged. For now, use request volume and saves as leading indicators.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-card px-3 py-3 text-center shadow-soft">
                  <div className="font-display text-xl font-bold">{requests.length}</div>
                  <div className="text-[11px] text-muted-foreground">Requests filed</div>
                </div>
                <div className="rounded-xl bg-card px-3 py-3 text-center shadow-soft">
                  <div className="font-display text-xl font-bold">{savedEvents.length}</div>
                  <div className="text-[11px] text-muted-foreground">Events tracked</div>
                </div>
                <div className="rounded-xl bg-card px-3 py-3 text-center shadow-soft">
                  <div className="font-display text-xl font-bold text-muted-foreground">—</div>
                  <div className="text-[11px] text-muted-foreground">Est. reach</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {section === "analytics" ? (
          <MediaAnalyticsPanel />
        ) : section === "explore" ? (
          exploreLoading ? (
            <DashboardCardGridSkeleton count={6} />
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
                  <div className="px-4 pb-4 flex gap-2">
                    <EventSaveButton eventId={e.id} compact />
                    <button
                      type="button"
                      onClick={() => setRequestEvent({ id: e.id, name: e.name })}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-muted"
                    >
                      <Newspaper className="h-3.5 w-3.5" /> Request coverage
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : section === "saved" ? (
          savesLoading ? (
            <DashboardCardGridSkeleton count={6} />
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
        ) : section === "requests" ? (
          requestsLoading ? (
            <DashboardTableSkeleton rows={5} cols={4} />
          ) : requests.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground text-sm">No coverage requests yet. Browse Explore and request coverage on an event.</p>
            </div>
          ) : (
            <DashboardPanel title="My coverage requests" bodyClassName="p-0">
              <DashboardDataToolbar
                search={requestSearch}
                onSearchChange={setRequestSearch}
                searchPlaceholder="Search event, type, status…"
                filters={
                  <DashboardFilterSelect
                    label="Status"
                    value={requestStatus}
                    onChange={setRequestStatus}
                    options={[
                      { id: "all", label: "All", count: requestStatusCounts.all },
                      { id: "pending", label: "Pending", count: requestStatusCounts.pending },
                      { id: "approved", label: "Approved", count: requestStatusCounts.approved },
                      { id: "declined", label: "Declined", count: requestStatusCounts.declined },
                      { id: "completed", label: "Completed", count: requestStatusCounts.completed },
                    ]}
                  />
                }
              />
              <DashboardTable>
                <DashboardTableHead>
                  <tr>
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Requested</th>
                  </tr>
                </DashboardTableHead>
                <tbody className="divide-y divide-border">
                  {filteredRequests.map((r: any) => {
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
                  {!filteredRequests.length && (
                    <tr>
                      <td colSpan={4} className="px-5 py-10 text-center text-muted-foreground">No requests match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </DashboardTable>
            </DashboardPanel>
          )
        ) : null}
      </div>

      {requestEvent && <CoverageRequestModal event={requestEvent} onClose={() => setRequestEvent(null)} />}
    </AppShell>
  );
}
function EventSaveButton({ eventId, compact }: { eventId: string; compact?: boolean }) {
  const { user } = useAuth();
  const toggle = useServerFn(toggleSaveEvent);
  const qc = useQueryClient();

  const { data: isSaved } = useQuery({
    queryKey: ["event-saved", eventId, user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("event_saves").select("id").eq("event_id", eventId).maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const mut = useMutation({
    mutationFn: () => toggle({ data: { event_id: eventId } }),
    onSuccess: (res: { saved: boolean }) => {
      qc.invalidateQueries({ queryKey: ["media-saves"] });
      qc.invalidateQueries({ queryKey: ["event-saved", eventId] });
      qc.invalidateQueries({ queryKey: ["sponsor-dash"] });
      toast.success(res.saved ? "Event saved" : "Removed from saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <button
      type="button"
      onClick={() => mut.mutate()}
      disabled={mut.isPending || !user}
      className={`inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${
        compact ? "shrink-0" : "w-full"
      } ${isSaved ? "border-secondary/40 bg-secondary/10 text-secondary-deep" : "border-border hover:bg-muted"}`}
    >
      <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
      {compact ? (isSaved ? "Saved" : "Save") : isSaved ? "Saved" : "Save event"}
    </button>
  );
}

export function CoverageRequestModal({ event, onClose }: { event: { id: string; name: string }; onClose: () => void }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isDevImpersonating } = useAuth();
  const submit = useServerFn(submitMediaRequest);
  const [type, setType] = useState<"coverage" | "press_credentials" | "content">("coverage");
  const [message, setMessage] = useState("");

  const mut = useMutation({
    mutationFn: async () => {
      if (isDevImpersonating) {
        throw new Error("Sign in with media@ige.test — the DEV role switcher cannot submit requests.");
      }
      await ensureAccessToken();
      return submit({ data: { event_id: event.id, request_type: type, message: message || null } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-requests"] });
      toast.success("Request sent successfully");
      onClose();
    },
    onError: (e: Error) => {
      const msg = e.message || "Could not send request";
      toast.error(msg);
      if (isAuthError(msg)) {
        navigate({ to: "/login", search: demoLoginSearch("media@ige.test") });
      }
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl bg-card p-6 shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold text-foreground">Request coverage</h3>
        <p className="mt-1 text-sm text-muted-foreground">For <span className="font-semibold text-foreground">{event.name}</span></p>

        {isDevImpersonating && (
          <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100">
            DEV role switcher is active. Sign in with <strong>media@ige.test</strong> to submit real requests.
          </p>
        )}

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
