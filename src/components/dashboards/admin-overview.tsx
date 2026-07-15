import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ShieldCheck, Users, DollarSign, BarChart3, UserCheck,
  AlertTriangle, ArrowRight,
} from "lucide-react";
import { KpiTile, DonutBreakdown, FeaturedHeroCard, AgendaList } from "@/components/dashboards/voom-primitives";
import { QuickLinkCard } from "@/components/dashboards/shared";
import { DashboardLoading } from "@/components/dashboards/dashboard-shell";
import { DateRangePicker, defaultSalesRange, type DateRangeValue } from "@/components/date-range-picker";
import { getAdminAnalytics } from "@/lib/analytics.functions";
import { StatusBadge } from "@/components/app-shell";
import { useDisplayCurrency } from "@/lib/display-currency-context";
import { cn } from "@/lib/utils";

const CHART_COLORS = ["hsl(271 45% 44%)", "hsl(160 100% 25%)", "hsl(271 45% 60%)"];

function fmtMonth(m: string) {
  const [y, mo] = m.split("-");
  return new Date(Number(y), Number(mo) - 1).toLocaleString("en", { month: "short" });
}

type ChartMode = "bar" | "line";

type AdminOverviewProps = {
  vettingCount: number;
  waitlistCount: number;
  adminGmvUsd: number;
  openDeals: number;
  fraudFlags: number;
  pendingInquiries: number;
  recentVetting: any[];
  onVettingClick: (id: string) => void;
  vettingLoading: boolean;
  revenueLoading: boolean;
};

export function AdminOverviewPanel({
  vettingCount,
  waitlistCount,
  adminGmvUsd,
  openDeals,
  fraudFlags,
  pendingInquiries,
  recentVetting,
  onVettingClick,
  vettingLoading,
  revenueLoading,
}: AdminOverviewProps) {
  const { fmtUsd, convertUsd, displayCurrency, labelSuffix } = useDisplayCurrency();
  const [dateRange, setDateRange] = useState<DateRangeValue>(defaultSalesRange);
  const [chartMode, setChartMode] = useState<ChartMode>("bar");

  const fetch = useServerFn(getAdminAnalytics);
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ["analytics", "admin", "overview", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () =>
      fetch({
        data: {
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString(),
        },
      }),
  });

  const gmvChartData = useMemo(
    () =>
      (analytics?.gmvOverTime ?? []).map((d) => ({
        ...d,
        label: fmtMonth(d.month),
        gmv: convertUsd(Number(d.gmv ?? 0)),
      })),
    [analytics?.gmvOverTime, convertUsd],
  );

  const rangeTotal = convertUsd(Number(analytics?.summary.rangeGmv ?? 0));
  const maxGmv = Math.max(...gmvChartData.map((d) => d.gmv), 0);

  if (analyticsLoading && !analytics) return <DashboardLoading showCharts kpis={4} />;

  const vettingData = analytics?.vettingPipeline?.filter((d) => d.count > 0) ?? [];
  const featured = recentVetting[0];
  const agendaItems = recentVetting.slice(0, 4).map((e: any) => ({
    id: e.id,
    date: e.created_at ?? e.updated_at ?? new Date().toISOString(),
    title: e.name || "Untitled event",
    subtitle: [e.city, e.country].filter(Boolean).join(", ") || e.organiser_email,
    badge: e.status?.replace(/_/g, " "),
  }));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={ShieldCheck} label="Vetting queue" value={vettingCount} loading={vettingLoading} trend={`${analytics?.summary.liveEvents ?? 0} live`} />
        <KpiTile icon={Users} label="Waitlist signups" value={waitlistCount} />
        <KpiTile icon={DollarSign} label={`Deal volume (GMV)${labelSuffix}`} value={fmtUsd(adminGmvUsd)} loading={revenueLoading} />
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-2xl bg-card shadow-card">
            <div className="flex flex-col gap-3 border-b border-border/50 px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-display text-sm font-bold text-foreground">Sales revenue</h3>
                <p className="text-xs text-muted-foreground">
                  Closed deal GMV ({displayCurrency})
                  {analytics?.summary.rangeGmv != null ? ` · period total ${fmtUsd(analytics.summary.rangeGmv)}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex rounded-full border border-border/60 bg-muted/40 p-0.5">
                  {(["bar", "line"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setChartMode(mode)}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-bold capitalize transition-colors",
                        chartMode === mode
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <DateRangePicker value={dateRange} onChange={setDateRange} />
              </div>
            </div>
            <div className="p-5">
              {gmvChartData.length === 0 ? (
                <p className="py-16 text-center text-sm text-muted-foreground italic">No closed deals in this date range.</p>
              ) : (
                <div className="h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartMode === "bar" ? (
                      <BarChart data={gmvChartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={56}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                          domain={[0, maxGmv > 0 ? "auto" : 4]}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                            fontSize: 12,
                          }}
                          labelFormatter={(label) => String(label)}
                          formatter={(value) => [
                            typeof value === "number"
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: displayCurrency,
                                  maximumFractionDigits: 0,
                                }).format(value)
                              : value,
                            "GMV",
                          ]}
                        />
                        <Bar dataKey="gmv" radius={[6, 6, 0, 0]} maxBarSize={48}>
                          {gmvChartData.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    ) : (
                      <LineChart data={gmvChartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
                        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          width={56}
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
                          domain={[0, maxGmv > 0 ? "auto" : 4]}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: 12,
                            border: "1px solid hsl(var(--border))",
                            background: "hsl(var(--card))",
                            fontSize: 12,
                          }}
                          formatter={(value) => [
                            typeof value === "number"
                              ? new Intl.NumberFormat("en-US", {
                                  style: "currency",
                                  currency: displayCurrency,
                                  maximumFractionDigits: 0,
                                }).format(value)
                              : value,
                            "GMV",
                          ]}
                        />
                        <Line
                          type="monotone"
                          dataKey="gmv"
                          stroke={CHART_COLORS[0]}
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: CHART_COLORS[0] }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}
              {gmvChartData.every((d) => d.gmv === 0) && gmvChartData.length > 0 && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  No paid deals in this period yet — bars stay at zero until payments land.
                </p>
              )}
            </div>
          </div>

          <DonutBreakdown
            title="Vetting pipeline"
            description="Events by review status"
            data={vettingData}
            nameKey="status"
            valueKey="count"
            centerLabel="In queue"
            centerValue={vettingCount}
          />

          <div className="rounded-2xl bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <h3 className="font-display text-sm font-bold text-foreground">Recent submissions</h3>
              <Link to="/dashboard/vetting" className="text-xs font-semibold text-primary hover:underline">
                View all →
              </Link>
            </div>
            <div className="divide-y divide-border/40">
              {(recentVetting ?? []).slice(0, 5).map((e: any) => (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => onVettingClick(e.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/30"
                >
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-foreground">{e.name || "Untitled"}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {[e.event_type, e.city, e.country].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <StatusBadge status={e.status} />
                </button>
              ))}
              {!recentVetting?.length && (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground italic">No events in the vetting queue.</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {featured ? (
            <FeaturedHeroCard
              badge="Needs review"
              title={featured.name || "Untitled submission"}
              meta={[featured.city, featured.country].filter(Boolean).join(", ")}
              description={`Submitted by ${featured.organiser_email ?? "organiser"} — ${featured.event_type ?? "event"}`}
              ctaLabel="Review event"
              ctaTo="/dashboard/vetting"
            />
          ) : (
            <FeaturedHeroCard
              badge="IGE Admin"
              title="Platform is live"
              meta="Inside Global Events"
              description="No pending submissions right now. Check revenue and partner activity below."
              ctaLabel="View revenue"
              ctaTo="/dashboard/revenue"
            />
          )}

          <AgendaList
            title="Review schedule"
            items={agendaItems}
            empty="No submissions queued."
          />

          <div className="rounded-2xl bg-card p-4 shadow-card space-y-2">
            <p className="text-xs font-semibold text-muted-foreground">At a glance</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Open deals</span>
              <span className="font-display text-lg font-bold text-foreground">{openDeals}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Period GMV</span>
              <span className="font-display text-lg font-bold text-foreground">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: displayCurrency, maximumFractionDigits: 0 }).format(rangeTotal)}
              </span>
            </div>
            {fraudFlags > 0 && (
              <Link
                to="/dashboard/controls"
                className="mb-3 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2.5 text-xs"
              >
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-semibold">{fraudFlags} fraud flags need review</span>
              </Link>
            )}
            {pendingInquiries > 0 && (
              <Link to="/dashboard/revenue" className="flex items-center justify-between rounded-xl bg-brand-soft px-3 py-2.5 text-xs font-semibold text-primary-deep">
                {pendingInquiries} pending inquiries <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>

          <div className="space-y-2">
            {[
              { to: "/dashboard/partners", label: "Referral partners", desc: "Links & owed", icon: UserCheck },
              { to: "/dashboard/analytics", label: "Analytics", desc: "Full metrics", icon: BarChart3 },
            ].map((item) => (
              <QuickLinkCard key={item.to} {...item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
