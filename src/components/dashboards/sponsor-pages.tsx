import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Inbox, Bookmark, CalendarDays, Loader2, Calendar } from "lucide-react";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardEmpty } from "@/components/dashboards/dashboard-shell";
import { SponsorAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { getSponsorDashboard } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

function useSponsorData() {
  const fetch = useServerFn(getSponsorDashboard);
  return useQuery({ queryKey: ["sponsor-dash"], queryFn: () => fetch() });
}

export function SponsorOverviewPage() {
  const { data, isLoading } = useSponsorData();
  return (
    <WorkspacePage
      title="Sponsor workspace"
      subtitle="Discover vetted B2B events, track sponsorship commitments, and save opportunities for your brand."
      action={
        <Link to="/marketplace" className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all">
          Explore marketplace
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard icon={Inbox} label="Submitted commitments" value={data?.forms?.length ?? 0} loading={isLoading} />
        <StatCard icon={Bookmark} label="Saved events" value={data?.saves?.length ?? 0} loading={isLoading} />
        <StatCard icon={CalendarDays} label="New listings" value={data?.freshEvents?.length ?? 0} loading={isLoading} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/dashboard/commitments", label: "My commitments", desc: "Track submitted forms" },
          { to: "/dashboard/saved", label: "Saved events", desc: "Your shortlist" },
          { to: "/dashboard/discover", label: "Discover", desc: "Fresh marketplace listings" },
          { to: "/dashboard/analytics", label: "Analytics", desc: "Charts & insights" },
        ].map((item) => (
          <Link key={item.to} to={item.to} className="rounded-xl border border-border bg-card p-5 transition-all hover:border-primary hover:shadow-soft">
            <div className="font-semibold text-foreground">{item.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
          </Link>
        ))}
      </div>
    </WorkspacePage>
  );
}

export function SponsorCommitmentsPage() {
  const { data, isLoading } = useSponsorData();
  return (
    <WorkspacePage title="My commitments" subtitle="Sponsorship commitment forms you've submitted to IGE.">
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
                    <td className="px-5 py-3.5 text-right space-x-3">
                      {ev?.slug && (
                        <Link to="/events/$slug" params={{ slug: ev.slug }} className="text-xs text-primary font-bold hover:underline">View event →</Link>
                      )}
                      {ev?.organiser_id && (
                        <Link to="/messages" search={{ to: ev.organiser_id, event_id: ev.id }} className="text-xs text-primary font-bold hover:underline">Message organiser →</Link>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !data?.forms?.length && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-muted-foreground">
                    No commitments yet. <Link to="/marketplace" className="text-primary hover:underline font-semibold">Browse marketplace</Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </WorkspacePage>
  );
}

export function SponsorSavedPage() {
  const { data, isLoading } = useSponsorData();
  return (
    <WorkspacePage title="Saved events" subtitle="Events you've bookmarked for sponsorship consideration.">
      {isLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : !data?.saves?.length ? (
        <DashboardEmpty icon={Bookmark} title="No saved events" description="Browse the marketplace and save events that match your criteria." action={<Link to="/marketplace" className="text-sm font-semibold text-primary hover:underline">Explore marketplace →</Link>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data?.saves ?? []).map((s: any) => {
            const ev = data!.eventMap[s.event_id];
            if (!ev?.slug) return null;
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
      )}
    </WorkspacePage>
  );
}

export function SponsorDiscoverPage() {
  const { data, isLoading } = useSponsorData();
  return (
    <WorkspacePage title="Discover" subtitle="Fresh vetted listings on the marketplace.">
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(data?.freshEvents ?? []).map((e: any) =>
            e.slug ? (
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
            ) : null
          )}
        </div>
      )}
    </WorkspacePage>
  );
}

export function SponsorAnalyticsPage() {
  return (
    <WorkspacePage title="Analytics" subtitle="Sponsorship activity, sector interest, and commitment trends.">
      <SponsorAnalyticsPanel />
    </WorkspacePage>
  );
}
