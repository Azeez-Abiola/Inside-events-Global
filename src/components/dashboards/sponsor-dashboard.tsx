import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Bookmark, CalendarDays, Loader2, Calendar } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/dashboards/shared";
import { getSponsorDashboard } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

export function SponsorDashboard() {
  const [activeTab, setActiveTab] = useState<"commitments" | "saved" | "fresh">("commitments");
  const fetch = useServerFn(getSponsorDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["sponsor-dash"], queryFn: () => fetch() });

  const commitmentsCount = data?.forms?.length ?? 0;
  const savedEventsCount = data?.saves?.length ?? 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight bg-gradient-to-r from-primary-deep to-primary bg-clip-text text-transparent">
              Brand Workspace
            </h1>
            <p className="mt-1.5 text-muted-foreground text-sm">
              Discover global vetted B2B events, track your sponsorship commitments, and save opportunities.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all self-start sm:self-auto"
          >
            Explore Marketplace
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Inbox} label="Submitted Commitments" value={commitmentsCount} loading={isLoading} />
          <StatCard icon={Bookmark} label="Saved Events" value={savedEventsCount} loading={isLoading} />
          <StatCard icon={CalendarDays} label="Fresh Event Listings" value={data?.freshEvents?.length ?? 0} loading={isLoading} />
        </div>

        <div className="border-b border-border">
          <div className="flex gap-6">
            <button onClick={() => setActiveTab("commitments")} className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "commitments" ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              My Commitments ({commitmentsCount})
            </button>
            <button onClick={() => setActiveTab("saved")} className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "saved" ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Saved Events ({savedEventsCount})
            </button>
            <button onClick={() => setActiveTab("fresh")} className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "fresh" ? "border-primary text-primary-deep" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              Fresh Listings
            </button>
          </div>
        </div>

        {activeTab === "commitments" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Proposed Budget</th>
                    <th className="px-5 py-3">Submitted</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data?.forms ?? []).map((f: any) => {
                    const ev = data!.eventMap[f.event_id];
                    return (
                      <tr key={f.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-foreground">{ev?.name ?? "-"}</div>
                          <div className="text-xs text-muted-foreground">{[ev?.city, ev?.country].filter(Boolean).join(", ")}</div>
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold">
                          {f.budget_range_min || f.budget_range_max
                            ? `${fmtMoney(f.currency, Number(f.budget_range_min ?? 0))} – ${fmtMoney(f.currency, Number(f.budget_range_max ?? 0))}`
                            : "-"}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {f.submitted_at ? new Date(f.submitted_at).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {ev && (
                            <Link to="/events/$slug" params={{ slug: ev.slug }} className="text-xs text-primary font-bold hover:underline">
                              View event →
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && !data?.forms?.length && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                        No commitments submitted yet.{" "}
                        <Link to="/marketplace" className="text-primary hover:underline font-semibold">Browse marketplace</Link>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "saved" ? (
          isLoading ? (
            <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : !data?.saves?.length ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground text-sm">No saved events yet. Browse the marketplace and bookmark opportunities.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(data?.saves ?? []).map((s: any) => {
                const ev = data!.eventMap[s.event_id];
                if (!ev) return null;
                return (
                  <Link key={s.event_id} to="/events/$slug" params={{ slug: ev.slug }} className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-soft hover:border-primary">
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
                );
              })}
            </div>
          )
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(data?.freshEvents ?? []).map((e: any) => (
              <Link key={e.id} to="/events/$slug" params={{ slug: e.slug }} className="group overflow-hidden rounded-xl border border-border bg-card hover:shadow-soft hover:border-primary transition-all duration-300">
                {e.banner_image_url ? (
                  <img src={e.banner_image_url} alt={e.name} className="h-32 w-full object-cover group-hover:scale-[1.02] transition-transform duration-300" />
                ) : (
                  <div className="h-32 bg-muted flex items-center justify-center text-muted-foreground"><Calendar className="h-8 w-8" /></div>
                )}
                <div className="p-4">
                  <div className="font-bold text-foreground truncate group-hover:text-primary-deep transition-colors">{e.name}</div>
                  <div className="mt-1 text-xs text-muted-foreground truncate">{e.primary_sector} · {[e.city, e.country].filter(Boolean).join(", ")}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
