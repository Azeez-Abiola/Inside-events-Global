import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Inbox, Bookmark, CalendarDays, Loader2, Calendar, Compass, TrendingUp, Wallet, BarChart3, ArrowRight,
} from "lucide-react";
import { KpiTile, DonutBreakdown, FeaturedHeroCard, AgendaList } from "@/components/dashboards/voom-primitives";
import { QuickLinkCard } from "@/components/dashboards/shared";
import { DashboardEmpty } from "@/components/dashboards/dashboard-shell";
import { SponsorAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { SponsorBudgetPanel } from "@/components/dashboards/sponsor-budget-panel";
import { SponsorPipelinePanel } from "@/components/dashboards/sponsor-pipeline-panel";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { getSponsorDashboard } from "@/lib/deals.functions";
import { fmtMoney } from "@/lib/currency";

export function SponsorPipelinePage() {
  return (
    <WorkspacePage title="My deals" subtitle="Every event you're watching, negotiating, or sponsoring — from first look to signed deal.">
      <SponsorPipelinePanel />
    </WorkspacePage>
  );
}

export function SponsorBudgetPage() {
  return (
    <WorkspacePage title="Sponsorship budget" subtitle="Plan by market; committed and paid update from your live deals. Portfolio shown in USD.">
      <SponsorBudgetPanel />
    </WorkspacePage>
  );
}

function useSponsorData() {
  const fetch = useServerFn(getSponsorDashboard);
  return useQuery({ queryKey: ["sponsor-dash"], queryFn: () => fetch() });
}

export function SponsorOverviewPage() {
  const { data, isLoading } = useSponsorData();
  const featuredList = data?.recommendedEvents?.length ? data.recommendedEvents : data?.freshEvents ?? [];
  const hero = featuredList[0];
  const sectorData = (data?.profileSectors ?? []).map((s: string) => ({
    sector: s,
    count: (data?.recommendedEvents ?? []).filter((e: any) => e.primary_sector === s).length || 1,
  }));

  const agendaItems = (data?.forms ?? []).slice(0, 4).map((f: any) => {
    const ev = data?.eventMap?.[f.event_id];
    return {
      id: f.id,
      date: f.submitted_at ?? new Date().toISOString(),
      title: ev?.name ?? "Commitment",
      subtitle: f.budget_range_max
        ? `Budget up to ${fmtMoney(f.currency, Number(f.budget_range_max))}`
        : "Sponsorship inquiry",
      badge: "Submitted",
    };
  });

  return (
    <WorkspacePage
      title="Dashboard"
      subtitle="Discover vetted B2B events, track sponsorship commitments, and save opportunities for your brand."
      showGreeting
      breadcrumbs={[{ label: "Dashboard" }]}
    >
      {/* Voom KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={Inbox} label="Submitted commitments" value={data?.forms?.length ?? 0} loading={isLoading} />
        <KpiTile icon={Bookmark} label="Saved events" value={data?.saves?.length ?? 0} loading={isLoading} />
        <KpiTile icon={CalendarDays} label="New listings" value={data?.freshEvents?.length ?? 0} loading={isLoading} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* Voom "All Events" grid */}
          <div className="rounded-2xl bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">
                  {data?.recommendedEvents?.length ? "Recommended for you" : "All events"}
                </h3>
                <p className="text-xs text-muted-foreground">Vetted listings on the marketplace</p>
              </div>
              <Link to="/dashboard/discover" className="text-xs font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            {isLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : featuredList.length ? (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {featuredList.slice(0, 6).map((e: any) => (
                  <EventPreviewCard key={e.id} event={e} />
                ))}
              </div>
            ) : (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No events yet — explore the marketplace.</p>
            )}
          </div>

          {sectorData.length > 0 && (
            <DonutBreakdown
              title="Your sectors"
              description="Profile-matched interest areas"
              data={sectorData}
              nameKey="sector"
              valueKey="count"
              centerLabel="Sectors"
              centerValue={sectorData.length}
            />
          )}
        </div>

        {/* Voom right rail */}
        <div className="space-y-5">
          {hero?.slug ? (
            <FeaturedHeroCard
              imageUrl={hero.banner_image_url}
              badge={hero.primary_sector ?? "Event"}
              title={hero.name}
              meta={[hero.city, hero.country].filter(Boolean).join(", ")}
              description="A vetted IGE listing matched to your sponsorship profile."
              ctaLabel="View details"
              ctaTo="/events/$slug"
              ctaParams={{ slug: hero.slug }}
            />
          ) : (
            <FeaturedHeroCard
              badge="Sponsor"
              title="Find your next sponsorship"
              meta="IGE Marketplace"
              description="Browse vetted B2B events across the Africa–Europe corridor and globally."
              ctaLabel="Explore marketplace"
              ctaTo="/marketplace"
            />
          )}

          <AgendaList title="Your commitments" items={agendaItems} empty="No commitments submitted yet." />

          <div className="space-y-2">
            {[
              { to: "/dashboard/pipeline", label: "My deals", desc: "Pipeline at a glance", icon: TrendingUp },
              { to: "/dashboard/budget", label: "Budget", desc: "Committed & remaining", icon: Wallet },
              { to: "/dashboard/analytics", label: "Analytics", desc: "Charts & insights", icon: BarChart3 },
            ].map((item) => (
              <QuickLinkCard key={item.to} {...item} />
            ))}
          </div>
        </div>
      </div>
    </WorkspacePage>
  );
}

function EventPreviewCard({ event: e, compact }: { event: any; compact?: boolean }) {
  if (!e.slug) return null;
  if (compact) {
    return (
      <Link
        to="/events/$slug"
        params={{ slug: e.slug }}
        className="group flex overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all hover:border-primary/30 hover:shadow-brand"
      >
        {e.banner_image_url ? (
          <img src={e.banner_image_url} alt={e.name} className="h-16 w-20 shrink-0 object-cover" />
        ) : (
          <div className="flex h-16 w-20 shrink-0 items-center justify-center bg-muted">
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0 flex-1 p-3">
          <div className="truncate font-semibold text-foreground group-hover:text-primary-deep transition-colors">{e.name}</div>
          <div className="mt-0.5 truncate text-xs text-muted-foreground">
            {e.primary_sector} · {[e.city, e.country].filter(Boolean).join(", ")}
          </div>
        </div>
      </Link>
    );
  }
  return (
    <Link
      to="/events/$slug"
      params={{ slug: e.slug }}
      className="group overflow-hidden rounded-2xl bg-card shadow-card transition-all hover:shadow-soft"
    >
      {e.banner_image_url ? (
        <img src={e.banner_image_url} alt={e.name} className="h-32 w-full object-cover transition-transform group-hover:scale-[1.02]" />
      ) : (
        <div className="flex h-32 w-full items-center justify-center bg-muted">
          <Calendar className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <div className="p-4">
        <div className="truncate font-semibold text-foreground group-hover:text-primary-deep transition-colors">{e.name}</div>
        <div className="mt-1 truncate text-xs text-muted-foreground">
          {e.primary_sector} · {[e.city, e.country].filter(Boolean).join(", ")}
        </div>
      </div>
    </Link>
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

  function EventGrid({ events, empty }: { events: any[]; empty: string }) {
    if (!events.length) return <p className="text-sm text-muted-foreground italic py-4">{empty}</p>;
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e: any) =>
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
    );
  }

  return (
    <WorkspacePage title="Discover" subtitle="Recommended events, new listings, and referral-shared opportunities.">
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : (
        <div className="space-y-8">
          {(data?.recommendedEvents?.length ?? 0) > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold">Recommended for your sectors</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Matched to: {(data?.profileSectors ?? []).join(", ") || "your profile"}
              </p>
              <div className="mt-4"><EventGrid events={data?.recommendedEvents ?? []} empty="" /></div>
            </section>
          )}
          <section>
            <h2 className="font-display text-lg font-bold">New on marketplace</h2>
            <div className="mt-4"><EventGrid events={data?.freshEvents ?? []} empty="No new listings right now." /></div>
          </section>
          {(data?.referralSharedEvents?.length ?? 0) > 0 && (
            <section>
              <h2 className="font-display text-lg font-bold">Via referral partners</h2>
              <p className="mt-1 text-sm text-muted-foreground">Events you engaged with through a partner referral link.</p>
              <div className="mt-4"><EventGrid events={data?.referralSharedEvents ?? []} empty="" /></div>
            </section>
          )}
          <div className="text-center">
            <Link to="/marketplace" className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft">
              Browse full marketplace →
            </Link>
          </div>
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
