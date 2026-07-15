import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Plus, Wallet, TrendingUp, CheckCircle2, PiggyBank, Pencil, Trash2 } from "lucide-react";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardCardGridSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useDisplayCurrency } from "@/lib/display-currency-context";
import { DashboardEmpty } from "@/components/dashboards/dashboard-shell";
import { getSponsorBudgets, upsertMarketBudget, deleteMarketBudget } from "@/lib/budget.functions";
import { fmtMoney } from "@/lib/currency";

const QUARTERS = ["q1_allocation", "q2_allocation", "q3_allocation", "q4_allocation"] as const;

export function SponsorBudgetPanel() {
  const { fmtUsd, labelSuffix } = useDisplayCurrency();
  const qc = useQueryClient();
  const fetch = useServerFn(getSponsorBudgets);
  const del = useServerFn(deleteMarketBudget);
  const { data, isLoading } = useQuery({ queryKey: ["sponsor-budgets"], queryFn: () => fetch() });
  const [editing, setEditing] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsor-budgets"] }); toast.success("Market removed"); },
    onError: (e: any) => toast.error(e.message),
  });

  const p = data?.portfolio;
  const markets = data?.markets ?? [];
  const usedPct = p && p.totalUsd > 0 ? Math.min(100, ((p.committedUsd + p.paidUsd) / p.totalUsd) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => { setEditing(null); setOpen(true); }}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-all"
        >
          <Plus className="h-4 w-4" /> Add market
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label={`Portfolio budget${labelSuffix}`} value={fmtUsd(p?.totalUsd ?? 0)} loading={isLoading} />
        <StatCard icon={TrendingUp} label={`Committed${labelSuffix}`} value={fmtUsd(p?.committedUsd ?? 0)} loading={isLoading} />
        <StatCard icon={CheckCircle2} label={`Paid${labelSuffix}`} value={fmtUsd(p?.paidUsd ?? 0)} loading={isLoading} />
        <StatCard icon={PiggyBank} label={`Remaining${labelSuffix}`} value={fmtUsd(p?.remainingUsd ?? 0)} loading={isLoading} />
      </div>

      {p && p.totalUsd > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{usedPct.toFixed(0)}% committed + paid</span>
            <span>{fmtUsd(p.remainingUsd)} remaining</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${usedPct}%` }} />
          </div>
        </div>
      )}

      {isLoading ? (
        <DashboardCardGridSkeleton count={4} />
      ) : markets.length === 0 ? (
        <DashboardEmpty
          icon={Wallet}
          title="No market budgets yet"
          description="Add a market budget (e.g. Nigeria, UK) to start tracking your annual sponsorship spend."
          action={<button onClick={() => { setEditing(null); setOpen(true); }} className="text-sm font-semibold text-primary hover:underline">Add your first market →</button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {markets.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-display text-base font-bold">{m.market_name}</div>
                  <div className="text-xs text-muted-foreground">{m.currency} · FY starts month {m.fiscal_year_start_month}</div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(m); setOpen(true); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if (confirm(`Remove ${m.market_name}?`)) delMut.mutate(m.id); }} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <div className="mt-3 font-display text-xl font-bold">{fmtMoney(m.currency, Number(m.total_annual))}</div>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {QUARTERS.map((q, i) => (
                  <div key={q} className="rounded-md bg-muted/50 p-2 text-center">
                    <div className="text-[10px] font-semibold uppercase text-muted-foreground">Q{i + 1}</div>
                    <div className="mt-0.5 text-xs font-medium">{fmtMoney(m.currency, Number(m[q]))}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {open && <BudgetModal budget={editing} onClose={() => setOpen(false)} />}
    </div>
  );
}

function BudgetModal({ budget, onClose }: { budget: any | null; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(upsertMarketBudget);
  const [form, setForm] = useState({
    id: budget?.id,
    market_name: budget?.market_name ?? "",
    currency: budget?.currency ?? "USD",
    fiscal_year_start_month: budget?.fiscal_year_start_month ?? 1,
    total_annual: budget?.total_annual ?? 0,
    q1_allocation: budget?.q1_allocation ?? 0,
    q2_allocation: budget?.q2_allocation ?? 0,
    q3_allocation: budget?.q3_allocation ?? 0,
    q4_allocation: budget?.q4_allocation ?? 0,
  });

  const mut = useMutation({
    mutationFn: () => save({
      data: {
        ...(form.id ? { id: form.id } : {}),
        market_name: form.market_name,
        currency: form.currency as any,
        fiscal_year_start_month: Number(form.fiscal_year_start_month),
        total_annual: Number(form.total_annual),
        q1_allocation: Number(form.q1_allocation),
        q2_allocation: Number(form.q2_allocation),
        q3_allocation: Number(form.q3_allocation),
        q4_allocation: Number(form.q4_allocation),
      },
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["sponsor-budgets"] }); toast.success("Budget saved"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });

  const allocTotal = ["q1_allocation", "q2_allocation", "q3_allocation", "q4_allocation"].reduce((a, k) => a + Number((form as any)[k] || 0), 0);
  const overAllocated = allocTotal > Number(form.total_annual);
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-2xl border border-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display text-xl font-bold">{form.id ? "Edit market budget" : "Add market budget"}</h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Market name</span>
            <input value={form.market_name} onChange={(e) => setForm({ ...form, market_name: e.target.value })} placeholder="e.g. Nigeria" className={input} />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Currency</span>
            <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={input}>
              {["USD", "NGN", "GBP", "EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Fiscal year start month</span>
            <select value={form.fiscal_year_start_month} onChange={(e) => setForm({ ...form, fiscal_year_start_month: Number(e.target.value) })} className={input}>
              {Array.from({ length: 12 }).map((_, i) => <option key={i + 1} value={i + 1}>{new Date(2000, i, 1).toLocaleString(undefined, { month: "long" })}</option>)}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Total annual budget</span>
            <input type="number" min={0} value={form.total_annual} onChange={(e) => setForm({ ...form, total_annual: e.target.value as any })} className={input} />
          </label>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
            <span>Quarterly allocation</span>
            <span className={overAllocated ? "text-destructive text-xs" : "text-muted-foreground text-xs"}>
              {fmtMoney(form.currency, allocTotal)} / {fmtMoney(form.currency, Number(form.total_annual))}
            </span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {["q1_allocation", "q2_allocation", "q3_allocation", "q4_allocation"].map((q, i) => (
              <label key={q} className="block text-xs">
                <span className="mb-1 block text-center font-semibold uppercase text-muted-foreground">Q{i + 1}</span>
                <input type="number" min={0} value={(form as any)[q]} onChange={(e) => setForm({ ...form, [q]: e.target.value })} className="w-full rounded-md border border-input bg-background px-2 py-1.5 text-xs" />
              </label>
            ))}
          </div>
          {overAllocated && <p className="mt-1.5 text-xs text-destructive">Quarterly allocations exceed the total budget.</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted">Cancel</button>
          <button
            onClick={() => { if (!form.market_name.trim()) return toast.error("Market name is required"); mut.mutate(); }}
            disabled={mut.isPending}
            className="rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {mut.isPending ? "Saving…" : "Save budget"}
          </button>
        </div>
      </div>
    </div>
  );
}
