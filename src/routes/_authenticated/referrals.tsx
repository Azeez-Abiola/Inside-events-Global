import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { getReferralDashboard, generateReferralLink } from "@/lib/referrals.functions";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { Copy, Link2, TrendingUp, Wallet, MousePointerClick, Award } from "lucide-react";

export const Route = createFileRoute("/_authenticated/referrals")({
  head: () => ({ meta: [{ title: "Referrals — IGE" }] }),
  component: ReferralsPage,
});

function ReferralsPage() {
  const fetch = useServerFn(getReferralDashboard);
  const { data, isLoading } = useQuery({ queryKey: ["referral-dash"], queryFn: () => fetch() });

  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Refer & Earn</h1>
          <p className="mt-1 text-muted-foreground">Generate trackable links, drive sponsors, earn commission on closed deals.</p>
        </div>
        <button onClick={() => setPickerOpen(true)} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
          + Generate link
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={Link2} label="Active links" value={data?.stats.linkCount ?? 0} loading={isLoading} />
        <Stat icon={MousePointerClick} label="Total clicks" value={data?.stats.clickCount ?? 0} loading={isLoading} />
        <Stat icon={TrendingUp} label="Conversions" value={data?.stats.conversionCount ?? 0} loading={isLoading} />
        <Stat icon={Wallet} label="Earned (USD)" value={`$${(data?.totals.earned ?? 0).toFixed(0)}`} loading={isLoading} />
      </div>

      {data?.profile?.igb_partner_badge && (
        <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1.5 text-sm text-secondary-deep">
          <Award className="h-4 w-4" /> IGB Partner — Premium commission rate
        </div>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Your links</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Link</th><th className="px-4 py-3">Clicks</th><th className="px-4 py-3">Rate</th><th className="px-4 py-3">Status</th></tr>
            </thead>
            <tbody>
              {(data?.links ?? []).map((l: any) => {
                const ev = data!.events[l.event_id];
                const url = typeof window !== "undefined" ? `${window.location.origin}/r/${l.short_code}` : `/r/${l.short_code}`;
                return (
                  <tr key={l.id} className="border-t border-border">
                    <td className="px-4 py-3">{ev?.name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigator.clipboard.writeText(url)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs hover:bg-muted/80"
                      >
                        /r/{l.short_code} <Copy className="h-3 w-3" />
                      </button>
                    </td>
                    <td className="px-4 py-3">{l.click_count}</td>
                    <td className="px-4 py-3">{(Number(l.commission_rate) * 100).toFixed(1)}%</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-secondary/10 px-2 py-0.5 text-xs text-secondary-deep">{l.status}</span></td>
                  </tr>
                );
              })}
              {!data?.links?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No links yet. Generate one to start earning.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Pipeline</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Event</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Deal value</th><th className="px-4 py-3">Your commission</th><th className="px-4 py-3">Payout</th></tr>
            </thead>
            <tbody>
              {(data?.deals ?? []).map((d: any) => {
                const ev = data!.events[d.event_id];
                return (
                  <tr key={d.id} className="border-t border-border">
                    <td className="px-4 py-3">{ev?.name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize">{d.status.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{d.deal_value_native ? `${d.deal_currency} ${Number(d.deal_value_native).toLocaleString()}` : "—"}</td>
                    <td className="px-4 py-3">{d.referral_commission_usd ? `$${Number(d.referral_commission_usd).toFixed(0)}` : "—"}</td>
                    <td className="px-4 py-3">{d.referral_commission_paid ? "Paid" : "Pending"}</td>
                  </tr>
                );
              })}
              {!data?.deals?.length && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No deals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {pickerOpen && <EventPicker onClose={() => setPickerOpen(false)} />}
    </AppShell>
  );
}

function Stat({ icon: Icon, label, value, loading }: any) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <Icon className="h-5 w-5 text-muted-foreground" />
      <div className="mt-3 font-display text-2xl font-bold">{loading ? "…" : value}</div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
    </div>
  );
}

function EventPicker({ onClose }: { onClose: () => void }) {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const gen = useServerFn(generateReferralLink);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["picker-events"], queryFn: () => fetchEvents({ data: { vetted_only: true, per_page: 24 } as any }) });

  const mutation = useMutation({
    mutationFn: (event_id: string) => gen({ data: { event_id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["referral-dash"] }); onClose(); },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold">Pick an event</h3>
        <p className="mt-1 text-sm text-muted-foreground">Generate a trackable referral link for any IGE-vetted event.</p>
        <div className="mt-4 space-y-2">
          {(data?.events ?? []).map((e: any) => (
            <button
              key={e.id}
              onClick={() => mutation.mutate(e.id)}
              disabled={mutation.isPending}
              className="flex w-full items-center justify-between rounded-md border border-border px-4 py-3 text-left hover:bg-muted disabled:opacity-50"
            >
              <div>
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-muted-foreground">{[e.city, e.country].filter(Boolean).join(", ")}</div>
              </div>
              <span className="text-xs text-primary">Generate →</span>
            </button>
          ))}
        </div>
        {mutation.error && <p className="mt-3 text-sm text-destructive">{(mutation.error as Error).message}</p>}
      </div>
    </div>
  );
}
