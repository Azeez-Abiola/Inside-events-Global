import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus, Link2, MousePointerClick, TrendingUp, Wallet, Award, Copy, MessageCircle, Share2, Mail,
  BarChart3,
} from "lucide-react";
import { KpiTile, DonutBreakdown, FeaturedHeroCard, AgendaList } from "@/components/dashboards/voom-primitives";
import { QuickLinkCard } from "@/components/dashboards/shared";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTabs } from "@/components/dashboards/dashboard-shell";
import { DashboardListSkeleton, DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useDisplayCurrency } from "@/lib/display-currency-context";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import { ReferralAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { getReferralDashboard, generateReferralLink } from "@/lib/referrals.functions";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { fmtMoney } from "@/lib/currency";

type ReferralSection = "overview" | "links" | "deals" | "analytics" | "commissions";

function exportPayoutCsv(deals: any[], events: Record<string, any>) {
  downloadCsv(
    datedCsvFilename("ige-payout-history"),
    ["Event", "Status", "Deal value", "Commission USD", "Payout status", "Paid at"],
    deals.map((d) => {
      const ev = events[d.event_id];
      return [
        ev?.name ?? d.event_id,
        d.status,
        d.deal_value_native ? `${d.deal_currency} ${d.deal_value_native}` : "",
        d.referral_commission_usd ?? "",
        d.referral_commission_paid ? "Paid" : "Pending",
        d.referral_commission_paid_at ?? "",
      ];
    }),
  );
}

const SECTION_META: Record<ReferralSection, { title: string; subtitle: string }> = {
  overview: {
    title: "Referral partner workspace",
    subtitle: "Generate trackable Vouch Links, refer sponsors to vetted events, and monitor commission as deals close.",
  },
  links: {
    title: "My referrals",
    subtitle: "Vouch links, click tracking, and sharing tools.",
  },
  deals: {
    title: "Deal pipeline",
    subtitle: "Attributed deals and commission status.",
  },
  commissions: {
    title: "Commission tracker",
    subtitle: "Earned, pending, and paid commissions with payout export.",
  },
  analytics: {
    title: "Analytics",
    subtitle: "Clicks, conversions, and earnings over time.",
  },
};

export function ReferralDashboard({ section = "links" }: { section?: ReferralSection }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [linksSearch, setLinksSearch] = useState("");
  const [dealsSearch, setDealsSearch] = useState("");
  const [commissionsSearch, setCommissionsSearch] = useState("");
  const [payoutFilter, setPayoutFilter] = useState("all");
  const meta = SECTION_META[section];

  const { fmtUsd, labelSuffix } = useDisplayCurrency();
  const fetch = useServerFn(getReferralDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["referral-dash"], queryFn: () => fetch() });

  const activeLinks = data?.stats.linkCount ?? 0;
  const totalClicks = data?.stats.clickCount ?? 0;
  const conversions = data?.stats.conversionCount ?? 0;
  const earnedCommission = fmtUsd(data?.totals.earned ?? 0);

  const filteredLinks = useTableFilters({
    rows: data?.links ?? [],
    searchText: linksSearch,
    search: (l: { event_id: string; short_code: string; status: string }) => {
      const ev = data?.events?.[l.event_id];
      return [ev?.name, l.short_code, l.status].filter(Boolean).join(" ");
    },
  });

  const filteredDeals = useTableFilters({
    rows: data?.deals ?? [],
    searchText: dealsSearch,
    search: (d: { event_id: string; status: string }) => {
      const ev = data?.events?.[d.event_id];
      return [ev?.name, d.status].filter(Boolean).join(" ");
    },
  });

  const filteredCommissions = useTableFilters({
    rows: data?.deals ?? [],
    searchText: commissionsSearch,
    statusFilter: payoutFilter,
    search: (d: { event_id: string; status: string }) => {
      const ev = data?.events?.[d.event_id];
      return [ev?.name, d.status].filter(Boolean).join(" ");
    },
    matchStatus: (d: { referral_commission_paid?: boolean }, filter) =>
      filter === "paid" ? !!d.referral_commission_paid : filter === "pending" ? !d.referral_commission_paid : true,
  });

  const payoutCounts = useMemo(() => ({
    all: data?.deals?.length ?? 0,
    paid: (data?.deals ?? []).filter((d: { referral_commission_paid?: boolean }) => d.referral_commission_paid).length,
    pending: (data?.deals ?? []).filter((d: { referral_commission_paid?: boolean }) => !d.referral_commission_paid).length,
  }), [data?.deals]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };

  const generateAction = section === "links" || section === "overview" ? (
    <button
      type="button"
      onClick={() => setPickerOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all"
    >
      <Plus className="h-4 w-4" /> Generate link
    </button>
  ) : undefined;

  return (
    <WorkspacePage title={meta.title} subtitle={meta.subtitle} action={generateAction} showGreeting={section === "overview"}>
      {section === "links" && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiTile icon={Link2} label="Active links" value={activeLinks} loading={isLoading} />
          <KpiTile icon={MousePointerClick} label="Total clicks" value={totalClicks} loading={isLoading} />
          <KpiTile icon={TrendingUp} label="Conversions" value={conversions} loading={isLoading} />
          <KpiTile icon={Wallet} label={`Earned${labelSuffix}`} value={earnedCommission} loading={isLoading} />
        </div>
      )}

      {data?.profile?.igb_partner_badge && section === "links" && (
        <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary-deep">
          <Award className="h-4 w-4" /> IGE Partner — premium commission tier
        </div>
      )}

      {section === "overview" && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile icon={Link2} label="Active links" value={activeLinks} loading={isLoading} />
            <KpiTile icon={MousePointerClick} label="Total clicks" value={totalClicks} loading={isLoading} trend={conversions ? `${conversions} conversions` : undefined} />
            <KpiTile icon={Wallet} label={`Earned${labelSuffix}`} value={earnedCommission} loading={isLoading} />
          </div>

          {data?.profile?.igb_partner_badge && (
            <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary-deep">
              <Award className="h-4 w-4" /> IGE Partner — premium commission tier
            </div>
          )}

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="space-y-5 xl:col-span-2">
              {(() => {
                const statusData = [
                  { status: "Active", count: (data?.links ?? []).filter((l: any) => l.status === "active").length },
                  { status: "Paused", count: (data?.links ?? []).filter((l: any) => l.status !== "active").length },
                ].filter((d) => d.count > 0);
                return statusData.length ? (
                  <DonutBreakdown
                    title="Link activity"
                    description="Active vs paused referral links"
                    data={statusData}
                    nameKey="status"
                    valueKey="count"
                    centerLabel="Links"
                    centerValue={activeLinks}
                  />
                ) : null;
              })()}

              <div className="rounded-2xl bg-card shadow-card">
                <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
                  <h3 className="font-display text-sm font-bold text-foreground">Recent referral links</h3>
                  <Link to="/dashboard/referrals" className="text-xs font-semibold text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                <div className="divide-y divide-border/40">
                  {isLoading ? (
                    <DashboardListSkeleton rows={5} />
                  ) : (
                    <>
                  {(data?.links ?? []).slice(0, 5).map((l: any) => {
                    const ev = data?.events?.[l.event_id];
                    return (
                      <div key={l.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <Link2 className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-foreground">{ev?.name ?? "Event"}</div>
                          <div className="truncate font-mono text-xs text-muted-foreground">/r/{l.short_code}</div>
                        </div>
                        <div className="text-right text-xs">
                          <div className="font-bold text-foreground">{l.click_count}</div>
                          <div className="text-muted-foreground">clicks</div>
                        </div>
                      </div>
                    );
                  })}
                  {!isLoading && !data?.links?.length && (
                    <p className="px-5 py-10 text-center text-sm text-muted-foreground italic">No referral links yet. Generate one to start sharing.</p>
                  )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-5">
              {(() => {
                const topLink = [...(data?.links ?? [])].sort((a: any, b: any) => b.click_count - a.click_count)[0];
                const topEv = topLink ? data?.events?.[topLink.event_id] : null;
                return topLink && topEv ? (
                  <FeaturedHeroCard
                    imageUrl={topEv.banner_image_url}
                    badge="Top performer"
                    title={topEv.name}
                    meta={`${topLink.click_count} clicks · ${(Number(topLink.commission_rate) * 100).toFixed(1)}% commission`}
                    description="Your highest-traffic Vouch Link — share again to drive more sponsor introductions."
                    ctaLabel="Manage links"
                    ctaTo="/dashboard/referrals"
                  />
                ) : (
                  <FeaturedHeroCard
                    badge="Referral partner"
                    title="Generate your first Vouch Link"
                    meta="IGE referral engine"
                    description="Pick a vetted event, share your trackable link, and earn commission when deals close."
                    ctaLabel="Browse events"
                    ctaTo="/marketplace"
                  />
                );
              })()}

              <AgendaList
                title="Recent deal activity"
                items={(data?.deals ?? []).slice(0, 4).map((d: any) => ({
                  id: d.id,
                  date: d.updated_at ?? d.created_at ?? new Date().toISOString(),
                  title: data?.events?.[d.event_id]?.name ?? "Deal",
                  subtitle: d.status?.replace(/_/g, " "),
                  badge: d.referral_commission_paid ? "Paid" : "Pending",
                }))}
                empty="No attributed deals yet."
              />

              <div className="space-y-2">
                {[
                  { to: "/dashboard/referrals", label: "My referrals", desc: "Vouch links & sharing", icon: Link2 },
                  { to: "/dashboard/commissions", label: "Commission tracker", desc: "Earned, pending & paid", icon: Wallet },
                  { to: "/dashboard/analytics", label: "Analytics", desc: "Clicks & earnings", icon: BarChart3 },
                ].map((item) => (
                  <QuickLinkCard key={item.to} {...item} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {section === "commissions" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiTile icon={Wallet} label={`Earned${labelSuffix}`} value={fmtUsd(data?.totals.earned ?? 0)} loading={isLoading} />
            <KpiTile icon={TrendingUp} label={`Pending${labelSuffix}`} value={fmtUsd(data?.totals.pending ?? 0)} loading={isLoading} />
            <KpiTile icon={Award} label={`Paid${labelSuffix}`} value={fmtUsd(data?.totals.paid ?? 0)} loading={isLoading} />
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <DashboardTabs
              tabs={[
                { id: "all", label: "All", count: payoutCounts.all },
                { id: "pending", label: "Pending", count: payoutCounts.pending },
                { id: "paid", label: "Paid", count: payoutCounts.paid },
              ]}
              active={payoutFilter}
              onChange={setPayoutFilter}
            />
            <DashboardDataToolbar
              search={commissionsSearch}
              onSearchChange={setCommissionsSearch}
              searchPlaceholder="Search event or deal status…"
              onExport={() => exportPayoutCsv(filteredCommissions, data?.events ?? {})}
              exportDisabled={!filteredCommissions.length}
              exportCount={filteredCommissions.length}
            />
            <div className="overflow-x-auto">
              {isLoading ? (
                <DashboardTableSkeleton rows={6} cols={5} />
              ) : (
              <table className="w-full text-sm min-w-[700px]">
                <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-5 py-3">Event</th>
                    <th className="px-5 py-3">Deal status</th>
                    <th className="px-5 py-3">Commission</th>
                    <th className="px-5 py-3">Payout</th>
                    <th className="px-5 py-3">Paid at</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredCommissions.map((d: any) => {
                    const ev = data!.events[d.event_id];
                    return (
                      <tr key={d.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-foreground">{ev?.name ?? "-"}</td>
                        <td className="px-5 py-3.5 capitalize text-muted-foreground">{d.status.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-primary-deep">
                          {d.referral_commission_usd ? fmtUsd(Number(d.referral_commission_usd)) : "-"}
                        </td>
                        <td className="px-5 py-3.5">
                          {d.referral_commission_paid ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Paid</span>
                          ) : (
                            <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-muted-foreground">
                          {d.referral_commission_paid_at ? new Date(d.referral_commission_paid_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    );
                  })}
                  {!isLoading && !data?.deals?.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground italic">No commission history yet.</td>
                    </tr>
                  )}
                  {!isLoading && data?.deals?.length > 0 && !filteredCommissions.length && (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground italic">No commissions match your filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
              )}
            </div>
          </div>
        </div>
      )}

      {section === "analytics" ? (
        <ReferralAnalyticsPanel />
      ) : section === "links" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <DashboardDataToolbar
            search={linksSearch}
            onSearchChange={setLinksSearch}
            searchPlaceholder="Search event or link code…"
            onExport={() =>
              downloadCsv(
                datedCsvFilename("ige-referral-links"),
                ["event", "short_code", "clicks", "commission_rate", "status"],
                filteredLinks.map((l: any) => {
                  const ev = data?.events?.[l.event_id];
                  return [ev?.name ?? "", l.short_code, l.click_count, `${(Number(l.commission_rate) * 100).toFixed(1)}%`, l.status];
                }),
              )
            }
            exportDisabled={!filteredLinks.length}
            exportCount={filteredLinks.length}
          />
          <div className="overflow-x-auto">
            {isLoading ? (
              <DashboardTableSkeleton rows={6} cols={5} />
            ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Referral Link</th>
                  <th className="px-5 py-3">Clicks</th>
                  <th className="px-5 py-3">Commission Rate</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLinks.map((l: any) => {
                  const ev = data!.events[l.event_id];
                  const url = typeof window !== "undefined" ? `${window.location.origin}/r/${l.short_code}` : `/r/${l.short_code}`;
                  const shareText = `Sponsor ${ev?.name ?? "this event"} via IGE: ${url}`;
                  return (
                    <tr key={l.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{ev?.name ?? "-"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => handleCopy(url)} className="inline-flex items-center gap-1.5 rounded-md bg-muted/80 hover:bg-muted px-2.5 py-1.5 font-mono text-xs text-primary transition-all cursor-pointer border border-border">
                            /r/{l.short_code} <Copy className="h-3 w-3" />
                          </button>
                          <a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" title="Share on WhatsApp" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-emerald-600 transition-colors">
                            <MessageCircle className="h-3.5 w-3.5" />
                          </a>
                          <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" title="Share on LinkedIn" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                            <Share2 className="h-3.5 w-3.5" />
                          </a>
                          <a href={`mailto:?subject=${encodeURIComponent("Sponsorship opportunity on IGE")}&body=${encodeURIComponent(shareText)}`} title="Share via email" className="rounded-md border border-border p-1.5 text-muted-foreground hover:bg-muted hover:text-primary transition-colors">
                            <Mail className="h-3.5 w-3.5" />
                          </a>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-foreground">{l.click_count}</td>
                      <td className="px-5 py-3.5 font-medium">{(Number(l.commission_rate) * 100).toFixed(1)}%</td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex rounded-full bg-secondary/10 px-2 py-0.5 text-xs font-semibold text-secondary-deep capitalize">{l.status}</span>
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !data?.links?.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No referral links yet. Generate one to start sharing.</td>
                  </tr>
                )}
                {!isLoading && data?.links?.length > 0 && !filteredLinks.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No links match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>
      ) : section === "deals" ? (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <DashboardDataToolbar
            search={dealsSearch}
            onSearchChange={setDealsSearch}
            searchPlaceholder="Search event or deal status…"
            onExport={() => exportPayoutCsv(filteredDeals, data?.events ?? {})}
            exportDisabled={!filteredDeals.length}
            exportCount={filteredDeals.length}
          />
          <div className="overflow-x-auto">
            {isLoading ? (
              <DashboardTableSkeleton rows={6} cols={5} />
            ) : (
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/30 text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                <tr>
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Deal Value</th>
                  <th className="px-5 py-3">Your Commission</th>
                  <th className="px-5 py-3">Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredDeals.map((d: any) => {
                  const ev = data!.events[d.event_id];
                  return (
                    <tr key={d.id} className="hover:bg-muted/10 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-foreground">{ev?.name ?? "-"}</td>
                      <td className="px-5 py-3.5 capitalize text-muted-foreground">{d.status.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3.5 text-xs font-semibold">
                        {d.deal_value_native ? `${d.deal_currency} ${Number(d.deal_value_native).toLocaleString()}` : "-"}
                      </td>
                      <td className="px-5 py-3.5 text-xs font-semibold text-primary-deep">
                        {d.referral_commission_usd ? fmtUsd(Number(d.referral_commission_usd)) : "-"}
                      </td>
                      <td className="px-5 py-3.5">
                        {d.referral_commission_paid ? (
                          <span className="inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Paid</span>
                        ) : (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {!isLoading && !data?.deals?.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground italic">No referred deals in pipeline yet.</td>
                  </tr>
                )}
                {!isLoading && data?.deals?.length > 0 && !filteredDeals.length && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground italic">No deals match your search.</td>
                  </tr>
                )}
              </tbody>
            </table>
            )}
          </div>
        </div>
      ) : null}

      {pickerOpen && <EventPicker onClose={() => setPickerOpen(false)} />}
    </WorkspacePage>
  );
}

function EventPicker({ onClose }: { onClose: () => void }) {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const gen = useServerFn(generateReferralLink);
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["picker-events"],
    queryFn: () => fetchEvents({ data: { vetted_only: true, per_page: 24 } as any }),
  });

  const mutation = useMutation({
    mutationFn: (event_id: string) => gen({ data: { event_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["referral-dash"] });
      onClose();
      toast.success("Link generated successfully!");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl border border-border" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold text-foreground">Generate Referral Link</h3>
        <p className="mt-1 text-sm text-muted-foreground">Choose a vetted IGE event to generate a trackable link.</p>
        <div className="mt-6 space-y-2">
          {(data?.events ?? []).map((e: any) => (
            <button
              key={e.id}
              onClick={() => mutation.mutate(e.id)}
              disabled={mutation.isPending}
              className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-left hover:bg-muted/30 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <div>
                <div className="font-semibold text-foreground text-sm">{e.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{[e.city, e.country].filter(Boolean).join(", ")}</div>
                {e.starting && (
                  <div className="mt-1 text-[11px] text-secondary-deep">
                    Est. commission {fmtMoney(e.starting.currency, Number(e.starting.price) * 0.07)} – {fmtMoney(e.starting.currency, Number(e.starting.price) * 0.12)} on the entry tier
                  </div>
                )}
              </div>
              <span className="text-xs text-primary font-bold hover:underline whitespace-nowrap">Generate →</span>
            </button>
          ))}
          {data?.events?.length === 0 && (
            <div className="text-center py-6 text-muted-foreground text-sm italic">No vetted events available.</div>
          )}
        </div>
        {mutation.error && <p className="mt-3 text-sm text-destructive">{(mutation.error as Error).message}</p>}
      </div>
    </div>
  );
}
