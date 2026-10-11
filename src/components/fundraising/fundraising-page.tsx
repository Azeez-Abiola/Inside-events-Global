import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { CalendarClock, Loader2, Target } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { fmtMoney } from "@/lib/currency";
import {
  getFundraising,
  setFundraisingTarget,
  type FundraisingEvent,
} from "@/lib/fundraising.functions";

/** Pace Colour System (TAB 0.1) applied to the gap against the clock. */
export function fundraisingUrgency(e: FundraisingEvent): {
  colour: string;
  label: string;
  tone: "green" | "amber" | "red" | "none";
} {
  if (e.target == null || e.target <= 0)
    return { colour: "#9b94a8", label: "No target set", tone: "none" };
  const raised = (e.committed + e.paid) / e.target;
  if (raised >= 1) return { colour: "#0E8A62", label: "Target reached", tone: "green" };
  const days = e.days_to_event;
  if (days == null) return { colour: "#E8A33D", label: "No event date", tone: "amber" };
  if (days < 0) return { colour: "#9b94a8", label: "Event has passed", tone: "none" };
  // The closer the date, the more of the target should be secured.
  if ((days <= 30 && raised < 0.75) || (days <= 14 && raised < 0.9)) {
    return { colour: "#D64545", label: "At risk", tone: "red" };
  }
  if ((days <= 60 && raised < 0.5) || (days <= 30 && raised < 0.9)) {
    return { colour: "#E8A33D", label: "Needs attention", tone: "amber" };
  }
  return { colour: "#0E8A62", label: "On track", tone: "green" };
}

function CountdownRing({ e }: { e: FundraisingEvent }) {
  const u = fundraisingUrgency(e);
  const r = 34;
  const c = 2 * Math.PI * r;
  const f = e.target ? Math.min(1, (e.committed + e.paid) / e.target) : 0;
  return (
    <div className="relative h-20 w-20 shrink-0">
      <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden>
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.1"
          strokeWidth="7"
        />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke={u.colour}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={`${c * f} ${c}`}
          transform="rotate(-90 40 40)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-lg font-bold tabular-nums leading-none text-foreground">
          {e.days_to_event != null && e.days_to_event >= 0 ? e.days_to_event : "—"}
        </span>
        <span className="text-[9px] uppercase tracking-wide text-muted-foreground">days</span>
      </div>
    </div>
  );
}

function TargetEditor({ e, onSaved }: { e: FundraisingEvent; onSaved: () => void }) {
  const save = useServerFn(setFundraisingTarget);
  const [amount, setAmount] = useState(e.target != null ? String(e.target) : "");
  const [currency, setCurrency] = useState(e.currency);
  const [share, setShare] = useState(e.show_fill_to_sponsors);
  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          event_id: e.event_id,
          target_amount: Number(amount),
          currency: currency as "NGN" | "USD" | "GBP" | "EUR",
          show_fill_to_sponsors: share,
        },
      }),
    onSuccess: () => {
      toast.success("Target saved");
      onSaved();
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={currency}
          onChange={(ev) => setCurrency(ev.target.value)}
          aria-label="Currency"
          className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
        >
          {["NGN", "USD", "GBP", "EUR"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(ev) => setAmount(ev.target.value)}
          placeholder="Sponsorship target"
          aria-label="Sponsorship target"
          className="w-40 rounded-md border border-border bg-background px-2 py-1.5 text-xs tabular-nums"
        />
        <Button size="sm" disabled={!amount || mut.isPending} onClick={() => mut.mutate()}>
          Save target
        </Button>
      </div>
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input type="checkbox" checked={share} onChange={(ev) => setShare(ev.target.checked)} />
        Show sponsors how full the tiers are
        <InfoTip tip="fundraising.share_fill" />
      </label>
    </div>
  );
}

/** Fundraising Tracker (TAB 4 §4.2 Module 1) with its multi-event view. */
export function FundraisingPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getFundraising);
  const { data, isLoading } = useQuery({ queryKey: ["fundraising"], queryFn: () => fetchAll() });
  const [editing, setEditing] = useState<string | null>(null);
  const events = data?.events ?? [];
  const upcoming = events.filter((e) => e.days_to_event == null || e.days_to_event >= 0);
  const past = events.filter((e) => e.days_to_event != null && e.days_to_event < 0);

  if (isLoading) {
    return (
      <WorkspacePage title="Fundraising Tracker">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }

  const card = (e: FundraisingEvent) => {
    const u = fundraisingUrgency(e);
    return (
      <div key={e.event_id} className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-start gap-4">
          <CountdownRing e={e} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="truncate font-semibold text-foreground">{e.name}</p>
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ color: u.colour, background: `${u.colour}1a` }}
              >
                {u.label}
              </span>
            </div>
            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3 w-3" />
              {e.start_date ? new Date(e.start_date).toLocaleDateString() : "No date yet"}
              {e.visibility === "private" && " · Private"}
            </p>
            {e.target != null ? (
              <>
                <p className="mt-3 text-xs text-muted-foreground">Gap remaining</p>
                <p className="bg-brand-gradient bg-clip-text font-display text-3xl font-bold tabular-nums text-transparent">
                  {fmtMoney(e.currency, e.gap ?? 0)}
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div className="flex h-full">
                    <div
                      className="h-full bg-secondary"
                      style={{ width: `${Math.min(100, (e.paid / (e.target || 1)) * 100)}%` }}
                    />
                    <div
                      className="h-full bg-secondary/40"
                      style={{ width: `${Math.min(100, (e.committed / (e.target || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Target {fmtMoney(e.currency, e.target)} · paid {fmtMoney(e.currency, e.paid)} ·
                  committed {fmtMoney(e.currency, e.committed)}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                Set a sponsorship target to start tracking the gap.
              </p>
            )}
            {e.unconverted > 0 && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                {e.unconverted} amount{e.unconverted > 1 ? "s" : ""} in a currency without a rate on
                IGE yet are not counted.
              </p>
            )}
          </div>
        </div>

        {e.tiers.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="flex items-center text-xs font-semibold text-foreground">
              Tier fill
              <InfoTip tip="fundraising.tiers" />
            </p>
            {e.tiers.map((t) => (
              <div key={t.tier_name} className="flex items-center gap-3 text-xs">
                <span className="w-28 truncate text-muted-foreground">{t.tier_name}</span>
                {t.slots_total ? (
                  <>
                    <div className="flex flex-1 gap-0.5">
                      {Array.from({ length: Math.min(t.slots_total, 20) }).map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-sm ${i < t.filled ? "bg-primary" : "bg-muted"}`}
                        />
                      ))}
                    </div>
                    <span className="w-16 text-right tabular-nums text-foreground">
                      {t.filled} of {t.slots_total}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">No slot limit set</span>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <button
            type="button"
            onClick={() => setEditing(editing === e.event_id ? null : e.event_id)}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            <Target className="h-3.5 w-3.5" />
            {e.target != null ? "Change target" : "Set target"}
          </button>
          <Link
            to="/events/edit/$id"
            params={{ id: e.event_id }}
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            Edit tiers →
          </Link>
          <Link
            to="/dashboard/payments"
            className="font-semibold text-muted-foreground hover:text-foreground"
          >
            Record a payment →
          </Link>
        </div>
        {editing === e.event_id && (
          <div className="mt-3">
            <TargetEditor
              e={e}
              onSaved={() => {
                setEditing(null);
                qc.invalidateQueries({ queryKey: ["fundraising"] });
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const totalGap = upcoming.reduce<Record<string, number>>((acc, e) => {
    if (e.gap != null) acc[e.currency] = (acc[e.currency] ?? 0) + e.gap;
    return acc;
  }, {});

  return (
    <WorkspacePage
      title="Fundraising Tracker"
      subtitle="Your sponsorship target minus what is committed and paid, against the days left to each event."
    >
      {Object.keys(totalGap).length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <p className="flex items-center text-xs text-muted-foreground">
            Gap across your upcoming events
            <InfoTip tip="fundraising.gap" />
          </p>
          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1">
            {Object.entries(totalGap).map(([c, v]) => (
              <span
                key={c}
                className="bg-brand-gradient bg-clip-text font-display text-3xl font-bold tabular-nums text-transparent"
              >
                {fmtMoney(c, v)}
              </span>
            ))}
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <DashboardPanel title="No events yet">
          <p className="text-sm text-muted-foreground">
            Create an event in My Events, then set its sponsorship target here.
          </p>
        </DashboardPanel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">{upcoming.map(card)}</div>
      )}

      {past.length > 0 && (
        <details className="rounded-xl border border-border bg-card p-4">
          <summary className="cursor-pointer text-sm font-semibold text-foreground">
            Past events ({past.length})
          </summary>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">{past.map(card)}</div>
        </details>
      )}
    </WorkspacePage>
  );
}
