import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Link2, MousePointerClick, TrendingUp, Wallet, Award, Copy, MessageCircle, Share2, Mail, BarChart3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { ReferralAnalyticsPanel } from "@/components/dashboards/dashboard-analytics";
import { getReferralDashboard, generateReferralLink } from "@/lib/referrals.functions";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { fmtMoney } from "@/lib/currency";

export function ReferralDashboard({ section = "links" }: { section?: "overview" | "links" | "deals" | "analytics" }) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetch = useServerFn(getReferralDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["referral-dash"], queryFn: () => fetch() });

  const activeLinks = data?.stats.linkCount ?? 0;
  const totalClicks = data?.stats.clickCount ?? 0;
  const conversions = data?.stats.conversionCount ?? 0;
  const earnedCommission = `$${(data?.totals.earned ?? 0).toFixed(0)}`;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Referral link copied!");
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <DashboardHeader
          title="Referral partner workspace"
          subtitle="Generate trackable Vouch Links, refer sponsors to vetted events, and monitor commission as deals close."
          action={
            <button
              type="button"
              onClick={() => setPickerOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all"
            >
              <Plus className="h-4 w-4" /> Generate link
            </button>
          }
        />

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Link2} label="Active links" value={activeLinks} loading={isLoading} />
          <StatCard icon={MousePointerClick} label="Total clicks" value={totalClicks} loading={isLoading} />
          <StatCard icon={TrendingUp} label="Conversions" value={conversions} loading={isLoading} />
          <StatCard icon={Wallet} label="Earned (USD)" value={earnedCommission} loading={isLoading} />
        </div>

        {data?.profile?.igb_partner_badge && (
          <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3.5 py-1.5 text-xs font-semibold text-secondary-deep">
            <Award className="h-4 w-4" /> IGB Partner — premium commission tier
          </div>
        )}

        {section === "overview" && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { to: "/dashboard/referrals", label: "My referrals", desc: "Vouch links & sharing" },
              { to: "/dashboard/deals", label: "Commission pipeline", desc: "Attributed deals" },
              { to: "/dashboard/analytics", label: "Analytics", desc: "Clicks & earnings" },
            ].map((item) => (
              <Link key={item.to} to={item.to} className="rounded-xl border border-border bg-card p-5 hover:border-primary hover:shadow-soft transition-all">
                <div className="font-semibold">{item.label}</div>
                <div className="mt-1 text-sm text-muted-foreground">{item.desc}</div>
              </Link>
            ))}
          </div>
        )}

        {section === "analytics" ? (
          <ReferralAnalyticsPanel />
        ) : section === "links" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
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
                  {(data?.links ?? []).map((l: any) => {
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
                </tbody>
              </table>
            </div>
          </div>
        ) : section === "deals" ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
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
                  {(data?.deals ?? []).map((d: any) => {
                    const ev = data!.events[d.event_id];
                    return (
                      <tr key={d.id} className="hover:bg-muted/10 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-foreground">{ev?.name ?? "-"}</td>
                        <td className="px-5 py-3.5 capitalize text-muted-foreground">{d.status.replace(/_/g, " ")}</td>
                        <td className="px-5 py-3.5 text-xs font-semibold">
                          {d.deal_value_native ? `${d.deal_currency} ${Number(d.deal_value_native).toLocaleString()}` : "-"}
                        </td>
                        <td className="px-5 py-3.5 text-xs font-semibold text-primary-deep">
                          {d.referral_commission_usd ? `$${Number(d.referral_commission_usd).toFixed(0)}` : "-"}
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
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {pickerOpen && <EventPicker onClose={() => setPickerOpen(false)} />}
      </div>
    </AppShell>
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
