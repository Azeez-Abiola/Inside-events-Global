import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { adminGetRevenue, adminUpdateDealStatus, adminMarkCommissionPaid, adminUpdateRates } from "@/lib/deals.functions";
import { getCurrentRates } from "@/lib/marketplace.functions";
import { fmtMoney } from "@/lib/currency";
import { DollarSign, TrendingUp, AlertTriangle, Briefcase, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/revenue")({
  head: () => ({ meta: [{ title: "Revenue — IGE Admin" }] }),
  component: AdminRevenue,
});

const DEAL_STATUSES = [
  "inquiry_received", "vetting", "intro_made", "in_negotiation",
  "verbal_commitment", "contract_sent", "contract_signed",
  "payment_received", "closed_lost", "cancelled",
];

function AdminRevenue() {
  const fetch = useServerFn(adminGetRevenue);
  const fetchRates = useServerFn(getCurrentRates);
  const updateStatus = useServerFn(adminUpdateDealStatus);
  const markPaid = useServerFn(adminMarkCommissionPaid);
  const updateRates = useServerFn(adminUpdateRates);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-revenue"], queryFn: () => fetch() });
  const { data: ratesData } = useQuery({ queryKey: ["fx-rates"], queryFn: () => fetchRates() });

  const statusMut = useMutation({
    mutationFn: (v: { id: string; status: string; deal_value_native?: number }) => updateStatus({ data: v }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-revenue"] }),
  });
  const paidMut = useMutation({
    mutationFn: (deal_id: string) => markPaid({ data: { deal_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-revenue"] }),
  });

  const [ratesOpen, setRatesOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Revenue & deals</h1>
          <p className="mt-1 text-muted-foreground">All commitments, deal stages, ABW commission, and partner payouts.</p>
        </div>
        <button onClick={() => setRatesOpen(true)} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:bg-muted">
          <RefreshCw className="h-3.5 w-3.5" /> Refresh FX rates
        </button>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Stat icon={DollarSign} label="GMV (USD)" value={`$${(data?.totals.gmv ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} loading={isLoading} />
        <Stat icon={TrendingUp} label="ABW commission" value={`$${(data?.totals.abw ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} loading={isLoading} />
        <Stat icon={Briefcase} label="Open deals" value={data?.totals.open ?? 0} loading={isLoading} />
        <Stat icon={AlertTriangle} label="Partner payouts owed" value={`$${(data?.totals.refOwed ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`} loading={isLoading} />
      </div>

      {data?.fraudFlagsOpen ? (
        <div className="mt-6 flex items-center gap-2 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4" /> {data.fraudFlagsOpen} open fraud flag(s) need review.
        </div>
      ) : null}

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Deals pipeline</h2>
        <div className="mt-4 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[1100px] text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">USD</th>
                <th className="px-4 py-3">ABW</th>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(data?.deals ?? []).map((d: any) => {
                const ev = data!.events[d.event_id];
                return (
                  <tr key={d.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <div className="font-medium">{ev?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{[ev?.city, ev?.country].filter(Boolean).join(", ")}</div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        defaultValue={d.deal_value_native ?? ""}
                        onBlur={(e) => {
                          const v = Number(e.target.value);
                          if (v && v !== Number(d.deal_value_native)) {
                            statusMut.mutate({ id: d.id, status: d.status, deal_value_native: v });
                          }
                        }}
                        className="w-28 rounded border border-border bg-transparent px-2 py-1 text-xs"
                      />
                      <div className="mt-0.5 text-[10px] text-muted-foreground">{d.deal_currency}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{d.deal_value_usd ? fmtMoney("USD", Number(d.deal_value_usd)) : "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs">{d.abw_commission_usd ? fmtMoney("USD", Number(d.abw_commission_usd)) : "—"}</td>
                    <td className="px-4 py-3">
                      {d.referral_partner_id ? (
                        <div>
                          <div className="font-mono text-xs">{d.referral_commission_usd ? fmtMoney("USD", Number(d.referral_commission_usd)) : "—"}</div>
                          <div className="text-[10px] text-muted-foreground">{d.referral_commission_paid ? "Paid" : "Owed"}</div>
                        </div>
                      ) : <span className="text-xs text-muted-foreground">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={d.status}
                        onChange={(e) => statusMut.mutate({ id: d.id, status: e.target.value })}
                        className="rounded border border-border bg-transparent px-2 py-1 text-xs capitalize"
                      >
                        {DEAL_STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, " ")}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      {d.referral_partner_id && d.status === "payment_received" && !d.referral_commission_paid && (
                        <button onClick={() => paidMut.mutate(d.id)} className="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground hover:opacity-90">
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {!data?.deals?.length && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">No deals yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-semibold">Referral partners</h2>
        <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr><th className="px-4 py-3">Partner</th><th className="px-4 py-3">Tier</th><th className="px-4 py-3">Deals closed</th><th className="px-4 py-3">Earned (USD)</th><th className="px-4 py-3">Owed</th></tr>
            </thead>
            <tbody>
              {(data?.partners ?? []).map((p: any) => (
                <tr key={p.user_id} className="border-t border-border">
                  <td className="px-4 py-3">{p.full_name ?? p.user_id.slice(0, 8)}</td>
                  <td className="px-4 py-3 capitalize">{p.commission_tier}</td>
                  <td className="px-4 py-3">{p.deals_closed}</td>
                  <td className="px-4 py-3 font-mono">{fmtMoney("USD", Number(p.total_earned_usd ?? 0))}</td>
                  <td className="px-4 py-3 font-mono">{fmtMoney("USD", Number(p.owed_usd ?? 0))}</td>
                </tr>
              ))}
              {!data?.partners?.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">No partners yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {ratesOpen && (
        <RatesDialog
          current={ratesData?.rates}
          onClose={() => setRatesOpen(false)}
          onSubmit={async (v: { ngn_rate: number; gbp_rate: number; eur_rate: number }) => {
            await updateRates({ data: v });
            qc.invalidateQueries({ queryKey: ["fx-rates"] });
            qc.invalidateQueries({ queryKey: ["admin-revenue"] });
            setRatesOpen(false);
          }}
        />
      )}
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

function RatesDialog({ current, onClose, onSubmit }: any) {
  const [ngn, setNgn] = useState(current?.ngn_rate ?? 1650);
  const [gbp, setGbp] = useState(current?.gbp_rate ?? 0.79);
  const [eur, setEur] = useState(current?.eur_rate ?? 0.92);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => { e.preventDefault(); onSubmit({ ngn_rate: Number(ngn), gbp_rate: Number(gbp), eur_rate: Number(eur) }); }}
        className="w-full max-w-md space-y-4 rounded-xl bg-card p-6 shadow-2xl"
      >
        <h3 className="font-display text-lg font-bold">Refresh exchange rates (per 1 USD)</h3>
        <label className="block text-sm">NGN <input type="number" step="0.01" value={ngn} onChange={(e) => setNgn(e.target.value as any)} className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2" /></label>
        <label className="block text-sm">GBP <input type="number" step="0.0001" value={gbp} onChange={(e) => setGbp(e.target.value as any)} className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2" /></label>
        <label className="block text-sm">EUR <input type="number" step="0.0001" value={eur} onChange={(e) => setEur(e.target.value as any)} className="mt-1 w-full rounded border border-border bg-transparent px-3 py-2" /></label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="rounded px-3 py-1.5 text-sm hover:bg-muted">Cancel</button>
          <button type="submit" className="rounded bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground">Save</button>
        </div>
      </form>
    </div>
  );
}
