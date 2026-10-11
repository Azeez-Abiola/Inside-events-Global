import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Plus,
  Wallet,
  TrendingUp,
  CheckCircle2,
  PiggyBank,
  Pencil,
  Trash2,
  Gauge,
} from "lucide-react";
import { StatCard } from "@/components/dashboards/shared";
import { DashboardCardGridSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useDisplayCurrency } from "@/lib/display-currency-context";
import { DashboardEmpty } from "@/components/dashboards/dashboard-shell";
import { ChipMulti } from "@/components/signup/profile-fields";
import { InfoTip } from "@/components/info-tip";
import { getSponsorBudgets, upsertMarketBudget, deleteMarketBudget } from "@/lib/budget.functions";
import { fmtMoney, toUsd } from "@/lib/currency";
import { quarterOf, quarterProgress, spendPace, type Pace } from "@/lib/fiscal";
import { ONBOARDING_SECTORS } from "@/lib/onboarding-constants";
import { EVENT_TYPE_VALUES } from "@/lib/event-types";

const QUARTERS = ["q1_allocation", "q2_allocation", "q3_allocation", "q4_allocation"] as const;
type QuarterKey = (typeof QUARTERS)[number];

const MONTH_NAMES = Array.from({ length: 12 }).map((_, i) =>
  new Date(2000, i, 1).toLocaleString(undefined, { month: "long" }),
);

/** The brand Pace Colour System (TAB 0.1): red / amber / green. */
const PACE_STYLE: Record<Pace | "off", { ring: string; text: string; label: string }> = {
  on: { ring: "#0E8A62", text: "text-secondary-deep", label: "On pace" },
  ahead: { ring: "#E8A33D", text: "text-amber-700 dark:text-amber-300", label: "Ahead of pace" },
  behind: { ring: "#E8A33D", text: "text-amber-700 dark:text-amber-300", label: "Behind pace" },
  off: { ring: "#D64545", text: "text-destructive", label: "Well off pace" },
};

function budgetLabel(m: any) {
  if (m.budget_name && m.region) return `${m.budget_name} · ${m.region}`;
  return m.budget_name || m.market_name || "Budget";
}

function PaceRing({ fraction, color }: { fraction: number; color: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const f = Math.max(0, Math.min(1, fraction));
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden>
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="6"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={`${c * f} ${c}`}
        transform="rotate(-90 32 32)"
      />
    </svg>
  );
}

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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-budgets"] });
      toast.success("Budget removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const p = data?.portfolio;
  const markets = data?.markets ?? [];
  const rate = data?.rate ?? null;
  const usedPct =
    p && p.totalUsd > 0 ? Math.min(100, ((p.committedUsd + p.paidUsd) / p.totalUsd) * 100) : 0;

  // Portfolio pace for the current quarter. Markets can start their years in
  // different months, so each market's current-quarter allocation is taken on
  // its own calendar; spend is bucketed on the primary (first) market's.
  const primaryStart = Number(markets[0]?.fiscal_year_start_month ?? 1);
  const primary = quarterProgress(primaryStart);
  const currentQ = primary.quarters[primary.index];
  const allocationUsd = markets.reduce((sum: number, m: any) => {
    const mp = quarterProgress(Number(m.fiscal_year_start_month ?? 1));
    const key = QUARTERS[mp.index];
    return sum + (toUsd(Number(m[key] ?? 0), m.currency, rate) ?? 0);
  }, 0);
  const spentThisQuarter = (data?.spend ?? [])
    .filter((s: { date: string }) => quarterOf(s.date, primary.quarters) === currentQ.q)
    .reduce((n: number, s: { usd: number }) => n + s.usd, 0);
  const pace = spendPace(spentThisQuarter, allocationUsd, primary.elapsed);
  const paceKey: Pace | "off" = Math.abs(pace.deviation) > 0.3 ? "off" : pace.pace;
  const paceStyle = PACE_STYLE[paceKey];

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" /> Add marketing budget
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Wallet}
          label={`Portfolio budget${labelSuffix}`}
          value={fmtUsd(p?.totalUsd ?? 0)}
          loading={isLoading}
        />
        <StatCard
          icon={TrendingUp}
          label={`Committed${labelSuffix}`}
          value={fmtUsd(p?.committedUsd ?? 0)}
          loading={isLoading}
        />
        <StatCard
          icon={CheckCircle2}
          label={`Paid${labelSuffix}`}
          value={fmtUsd(p?.paidUsd ?? 0)}
          loading={isLoading}
        />
        <StatCard
          icon={PiggyBank}
          label={`Remaining${labelSuffix}`}
          value={fmtUsd(p?.remainingUsd ?? 0)}
          loading={isLoading}
        />
      </div>

      {markets.length > 0 && (
        <div className="flex flex-wrap items-center gap-5 rounded-xl border border-border bg-card p-5">
          <div className="relative">
            <PaceRing
              fraction={allocationUsd > 0 ? spentThisQuarter / allocationUsd : 0}
              color={paceStyle.ring}
            />
            <Gauge className="absolute inset-0 m-auto h-5 w-5 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center text-sm font-semibold text-foreground">
              Q{currentQ.q} pace · {currentQ.label}
              <InfoTip tip="budget.pace" />
            </p>
            <p className={`text-sm font-medium ${paceStyle.text}`}>{paceStyle.label}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {fmtUsd(spentThisQuarter)} committed or paid of {fmtUsd(allocationUsd)} allocated ·{" "}
              {Math.round(primary.elapsed * 100)}% of the quarter gone · {fmtUsd(pace.expected)}{" "}
              expected by today
            </p>
          </div>
        </div>
      )}

      {p && p.totalUsd > 0 && (
        <div>
          <div className="mb-1 flex justify-between text-xs text-muted-foreground">
            <span>{usedPct.toFixed(0)}% committed + paid</span>
            <span>{fmtUsd(p.remainingUsd)} remaining</span>
          </div>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-brand-gradient"
              style={{ width: `${usedPct}%` }}
            />
          </div>
        </div>
      )}

      {isLoading ? (
        <DashboardCardGridSkeleton count={4} />
      ) : markets.length === 0 ? (
        <DashboardEmpty
          icon={Wallet}
          title="No marketing budgets yet"
          description="Add a marketing budget for each market you sponsor in. Choose the month your year starts and IGE counts Q1 to Q4 from there."
          action={
            <button
              onClick={() => {
                setEditing(null);
                setOpen(true);
              }}
              className="text-sm font-semibold text-primary hover:underline"
            >
              Add your first budget →
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {markets.map((m: any) => {
            const mp = quarterProgress(Number(m.fiscal_year_start_month ?? 1));
            const allocated = QUARTERS.reduce((n, q) => n + Number(m[q] ?? 0), 0);
            const over = allocated > Number(m.total_annual ?? 0);
            const tags: string[] = [...(m.sector_tags ?? []), ...(m.event_type_tags ?? [])];
            return (
              <div key={m.id} className="rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-display text-base font-bold">{budgetLabel(m)}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.currency} · year starts{" "}
                      {MONTH_NAMES[Number(m.fiscal_year_start_month ?? 1) - 1]}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(m);
                        setOpen(true);
                      }}
                      aria-label={`Edit ${budgetLabel(m)}`}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${budgetLabel(m)}?`)) delMut.mutate(m.id);
                      }}
                      aria-label={`Remove ${budgetLabel(m)}`}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 font-display text-xl font-bold">
                  {fmtMoney(m.currency, Number(m.total_annual))}
                </div>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {QUARTERS.map((q, i) => (
                    <div
                      key={q}
                      className={`rounded-md p-2 text-center ${i === mp.index ? "bg-brand-soft ring-1 ring-primary/30" : "bg-muted/50"}`}
                    >
                      <div className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Q{i + 1}
                        {i === mp.index && " · now"}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {mp.quarters[i].label}
                      </div>
                      <div className="mt-0.5 text-xs font-medium">
                        {fmtMoney(m.currency, Number(m[q]))}
                      </div>
                    </div>
                  ))}
                </div>
                {over && (
                  <p className="mt-2 text-xs text-destructive">
                    Quarters add up to more than the annual budget.
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {tags.slice(0, 6).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-secondary/40 px-2 py-0.5 text-[10px] text-secondary-deep"
                      >
                        {t}
                      </span>
                    ))}
                    {tags.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">
                        +{tags.length - 6} more
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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
    region: budget?.region ?? "",
    budget_name: budget?.budget_name ?? budget?.market_name ?? "",
    currency: budget?.currency ?? "USD",
    fiscal_year_start_month: budget?.fiscal_year_start_month ?? 1,
    total_annual: Number(budget?.total_annual ?? 0),
    q1_allocation: Number(budget?.q1_allocation ?? 0),
    q2_allocation: Number(budget?.q2_allocation ?? 0),
    q3_allocation: Number(budget?.q3_allocation ?? 0),
    q4_allocation: Number(budget?.q4_allocation ?? 0),
    sector_tags: (budget?.sector_tags as string[] | undefined) ?? [],
    event_type_tags: (budget?.event_type_tags as string[] | undefined) ?? [],
  });
  // Only send tags once the column exists (the row has it) or some were
  // picked — see upsertMarketBudget.
  const tagsSupported = budget ? "sector_tags" in budget : false;

  const quarters = quarterProgress(Number(form.fiscal_year_start_month)).quarters;

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          ...(form.id ? { id: form.id } : {}),
          region: form.region,
          budget_name: form.budget_name,
          currency: form.currency as any,
          fiscal_year_start_month: Number(form.fiscal_year_start_month),
          total_annual: Number(form.total_annual),
          q1_allocation: Number(form.q1_allocation),
          q2_allocation: Number(form.q2_allocation),
          q3_allocation: Number(form.q3_allocation),
          q4_allocation: Number(form.q4_allocation),
          ...(tagsSupported || form.sector_tags.length || form.event_type_tags.length
            ? { sector_tags: form.sector_tags, event_type_tags: form.event_type_tags }
            : {}),
        },
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sponsor-budgets"] });
      toast.success("Budget saved");
      onClose();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const total = Number(form.total_annual) || 0;
  const allocTotal = QUARTERS.reduce((a, k) => a + Number(form[k] || 0), 0);
  const overAllocated = allocTotal > total;
  const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
  const setQ = (k: QuarterKey, v: number) => setForm({ ...form, [k]: Math.max(0, Math.round(v)) });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-xl font-bold">
          {form.id ? "Edit marketing budget" : "Add marketing budget"}
        </h3>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Market / region</span>
            <input
              value={form.region}
              onChange={(e) => setForm({ ...form, region: e.target.value })}
              placeholder="e.g. Nigeria"
              className={input}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Budget name</span>
            <input
              value={form.budget_name}
              onChange={(e) => setForm({ ...form, budget_name: e.target.value })}
              placeholder="e.g. Events and sponsorship"
              className={input}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Currency</span>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className={input}
            >
              {["USD", "NGN", "GBP", "EUR"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1.5 flex items-center font-medium">
              Year starts in
              <InfoTip tip="budget.year_start" />
            </span>
            <select
              value={form.fiscal_year_start_month}
              onChange={(e) =>
                setForm({ ...form, fiscal_year_start_month: Number(e.target.value) })
              }
              className={input}
            >
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1.5 block font-medium">Total annual budget</span>
            <input
              type="number"
              min={0}
              value={form.total_annual}
              onChange={(e) => setForm({ ...form, total_annual: Number(e.target.value) })}
              className={input}
            />
          </label>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-sm font-medium">
            <span>Quarterly allocation</span>
            <span
              className={
                overAllocated ? "text-xs text-destructive" : "text-xs text-muted-foreground"
              }
            >
              {fmtMoney(form.currency, allocTotal)} / {fmtMoney(form.currency, total)}
            </span>
          </div>
          <div className="space-y-3">
            {QUARTERS.map((q, i) => (
              <div key={q}>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">
                    Q{i + 1}{" "}
                    <span className="font-normal text-muted-foreground">· {quarters[i].label}</span>
                  </span>
                  <input
                    type="number"
                    min={0}
                    value={form[q]}
                    onChange={(e) => setQ(q, Number(e.target.value))}
                    aria-label={`Q${i + 1} amount`}
                    className="w-32 rounded-md border border-input bg-background px-2 py-1 text-right text-xs tabular-nums"
                  />
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(total, Number(form[q]))}
                  step={Math.max(1, Math.round(total / 200))}
                  value={form[q]}
                  onChange={(e) => setQ(q, Number(e.target.value))}
                  aria-label={`Q${i + 1} allocation`}
                  className="mt-1 w-full accent-[#6B3FA0]"
                  disabled={total <= 0}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between">
            <button
              type="button"
              disabled={total <= 0}
              onClick={() => {
                const each = Math.floor(total / 4);
                setForm({
                  ...form,
                  q1_allocation: each,
                  q2_allocation: each,
                  q3_allocation: each,
                  q4_allocation: total - each * 3,
                });
              }}
              className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
            >
              Split evenly across the year
            </button>
            {!overAllocated && allocTotal < total && (
              <span className="text-xs text-muted-foreground">
                {fmtMoney(form.currency, total - allocTotal)} unallocated
              </span>
            )}
          </div>
          {overAllocated && (
            <p className="mt-1.5 text-xs text-destructive">
              Quarterly allocations exceed the total budget.
            </p>
          )}
        </div>

        <div className="mt-5 space-y-4">
          <ChipMulti
            label="Sectors this budget sponsors"
            options={[...ONBOARDING_SECTORS]}
            value={form.sector_tags}
            onChange={(v) => setForm({ ...form, sector_tags: v })}
          />
          <ChipMulti
            label="Event types this budget sponsors"
            options={EVENT_TYPE_VALUES}
            value={form.event_type_tags}
            onChange={(v) => setForm({ ...form, event_type_tags: v })}
          />
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-md px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!form.region.trim()) return toast.error("Market / region is required");
              if (!form.budget_name.trim()) return toast.error("Budget name is required");
              mut.mutate();
            }}
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
