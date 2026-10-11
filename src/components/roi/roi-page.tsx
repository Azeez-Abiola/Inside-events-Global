import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileText, Loader2, Lock, Printer } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { fmtMoney } from "@/lib/currency";
import { escHtml, openPrintPage } from "@/lib/print-page";
import { objectiveReturn, roiScore } from "@/lib/roo-score";
import {
  STANDARD_OBJECTIVES,
  getRoiWorkspace,
  saveInvestmentReport,
  saveSponsorshipSetup,
  type Objective,
  type RoiDeal,
  type SectorPack,
} from "@/lib/roo.functions";

type Draft = {
  objective_name: string;
  spend_weight_pct: number;
  pillar: Objective["pillar"];
  kpi: string;
  target: string;
};
const PILLAR_LABEL = {
  money: "Value for money",
  brand: "Value for brand",
  business: "Value for business",
} as const;
const pillarOf = (name: string): Objective["pillar"] =>
  STANDARD_OBJECTIVES.find((o) => o.name === name)?.pillar ?? "brand";

/**
 * Linked sliders (TAB 4 §4.1 step 3): moving one adjusts the others in
 * proportion so the total always reads 100%.
 */
function rebalance(list: Draft[], index: number, value: number): Draft[] {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const others = list.filter((_, i) => i !== index);
  const rest = others.reduce((n, o) => n + o.spend_weight_pct, 0);
  const remaining = 100 - v;
  let assigned = 0;
  const out = list.map((o, i) => {
    if (i === index) return { ...o, spend_weight_pct: v };
    const share =
      rest > 0
        ? Math.floor((o.spend_weight_pct / rest) * remaining)
        : Math.floor(remaining / others.length);
    assigned += share;
    return { ...o, spend_weight_pct: share };
  });
  // Rounding leftovers go to the first other objective so the sum is exact.
  const firstOther = out.findIndex((_, i) => i !== index);
  if (firstOther >= 0)
    out[firstOther] = {
      ...out[firstOther],
      spend_weight_pct: out[firstOther].spend_weight_pct + (remaining - assigned),
    };
  return out;
}

function SetupFlow({
  deal,
  packs,
  onDone,
}: {
  deal: RoiDeal;
  packs: SectorPack[];
  onDone: () => void;
}) {
  const save = useServerFn(saveSponsorshipSetup);
  const [step, setStep] = useState(1);
  const [pack, setPack] = useState<string | null>(deal.setup?.sector_pack_id ?? null);
  const [list, setList] = useState<Draft[]>(
    deal.objectives.map((o) => ({
      objective_name: o.objective_name,
      spend_weight_pct: o.spend_weight_pct,
      pillar: o.pillar,
      kpi: o.kpi ?? "",
      target: o.target_value != null ? String(o.target_value) : "",
    })),
  );
  const total = list.reduce((n, o) => n + o.spend_weight_pct, 0);

  const pickPack = (id: string | null) => {
    if (
      list.length &&
      !confirm("Replace your current objectives and weights with this pack's defaults?")
    )
      return;
    setPack(id);
    const p = packs.find((x) => x.id === id);
    setList(
      p
        ? p.default_objectives.map((name, i) => ({
            objective_name: name,
            spend_weight_pct: p.default_weights[i] ?? 0,
            pillar: pillarOf(name),
            kpi: p.default_kpis[i] ?? "",
            target: "",
          }))
        : [],
    );
    setStep(2);
  };

  const mut = useMutation({
    mutationFn: (lock: boolean) =>
      save({
        data: {
          deal_id: deal.id,
          sector_pack_id: pack,
          lock,
          objectives: list.map((o) => ({
            objective_name: o.objective_name,
            spend_weight_pct: o.spend_weight_pct,
            pillar: o.pillar,
            kpi: o.kpi || undefined,
            target_value: o.target ? Number(o.target) : null,
          })),
        },
      }),
    onSuccess: (_r, lock) => {
      toast.success(lock ? "Objectives locked for this sponsorship." : "Saved.");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <p className="font-mono text-[11px] uppercase tracking-wider text-primary-deep">
        Step {step} of 3
      </p>
      {step === 1 && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {packs.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => pickPack(p.id)}
              className={`rounded-xl border p-3 text-left text-sm ${pack === p.id ? "border-primary bg-brand-soft" : "border-border hover:border-primary/50"}`}
            >
              <span className="block font-semibold text-foreground">{p.pack_name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {p.default_objectives.join(" · ")}
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => pickPack(null)}
            className="rounded-xl border border-dashed border-border p-3 text-left text-sm hover:border-primary/50"
          >
            <span className="block font-semibold text-foreground">Custom</span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Build your own objective mix.
            </span>
          </button>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            What should this sponsorship achieve? Pick at least one.
          </p>
          <div className="flex flex-wrap gap-2">
            {STANDARD_OBJECTIVES.map((o) => {
              const on = list.some((x) => x.objective_name === o.name);
              return (
                <button
                  key={o.name}
                  type="button"
                  onClick={() =>
                    setList(
                      on
                        ? list.filter((x) => x.objective_name !== o.name)
                        : [
                            ...list,
                            {
                              objective_name: o.name,
                              spend_weight_pct: 0,
                              pillar: o.pillar,
                              kpi: "",
                              target: "",
                            },
                          ],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-primary bg-brand-soft text-primary-deep" : "border-border text-muted-foreground"}`}
                >
                  {o.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2 pt-2">
            <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
              Back
            </Button>
            <Button
              size="sm"
              disabled={!list.length}
              onClick={() => {
                // Default to an even split when nothing is weighted yet.
                if (list.every((o) => !o.spend_weight_pct)) {
                  const each = Math.floor(100 / list.length);
                  setList(
                    list.map((o, i) => ({
                      ...o,
                      spend_weight_pct: i === 0 ? 100 - each * (list.length - 1) : each,
                    })),
                  );
                }
                setStep(3);
              }}
            >
              Continue
            </Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-3">
          {list.map((o, i) => (
            <div key={o.objective_name} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{o.objective_name}</span>
                <span className="tabular-nums font-semibold text-primary-deep">
                  {o.spend_weight_pct}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={o.spend_weight_pct}
                onChange={(e) => setList(rebalance(list, i, Number(e.target.value)))}
                aria-label={`${o.objective_name} weight`}
                className="mt-1 w-full accent-[#6B3FA0]"
              />
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  value={o.kpi}
                  onChange={(e) =>
                    setList(list.map((x, j) => (j === i ? { ...x, kpi: e.target.value } : x)))
                  }
                  placeholder="KPI (e.g. Qualified leads)"
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  min={0}
                  value={o.target}
                  onChange={(e) =>
                    setList(list.map((x, j) => (j === i ? { ...x, target: e.target.value } : x)))
                  }
                  placeholder="Target"
                  className="rounded border border-border bg-background px-2 py-1 text-xs"
                />
              </div>
            </div>
          ))}
          <p
            className={`text-sm font-semibold ${total === 100 ? "text-secondary-deep" : "text-destructive"}`}
          >
            Total {total}%
          </p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => setStep(2)}>
              Back
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={total !== 100 || mut.isPending}
              onClick={() => mut.mutate(false)}
            >
              Save draft
            </Button>
            <Button
              size="sm"
              disabled={total !== 100 || mut.isPending}
              onClick={() => {
                if (
                  confirm(
                    "Lock these weights? After this only IGE can change them, and it is logged.",
                  )
                )
                  mut.mutate(true);
              }}
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" /> Confirm and lock
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ResultsForm({ deal, onDone }: { deal: RoiDeal; onDone: () => void }) {
  const save = useServerFn(saveInvestmentReport);
  const r = deal.report;
  const [achieved, setAchieved] = useState<Record<string, string>>(
    Object.fromEntries(
      deal.objectives.map((o) => [
        o.objective_name,
        o.achieved_value != null ? String(o.achieved_value) : "",
      ]),
    ),
  );
  const [f, setF] = useState({
    rights_fee:
      r?.rights_fee != null ? String(r.rights_fee) : deal.value != null ? String(deal.value) : "",
    fmv: r?.fair_market_value != null ? String(r.fair_market_value) : "",
    attendees: r?.attendees_reached != null ? String(r.attendees_reached) : "",
    leads: r?.leads_captured != null ? String(r.leads_captured) : "",
    pipeline: r?.pipeline_value != null ? String(r.pipeline_value) : "",
    lift: r?.awareness_lift_pct != null ? String(r.awareness_lift_pct) : "",
    sentiment: r?.sentiment_note ?? "",
    competitors: r?.competitors_present ?? "",
    outlook: r?.outlook_90_day ?? "",
  });
  const n = (v: string) => (v === "" ? null : Number(v));
  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          deal_id: deal.id,
          achieved: Object.fromEntries(Object.entries(achieved).map(([k, v]) => [k, n(v)])),
          rights_fee: n(f.rights_fee),
          fair_market_value: n(f.fmv),
          attendees_reached: n(f.attendees),
          leads_captured: n(f.leads),
          pipeline_value: n(f.pipeline),
          awareness_lift_pct: n(f.lift),
          sentiment_note: f.sentiment,
          competitors_present: f.competitors,
          outlook_90_day: f.outlook,
          generate: true,
        },
      }),
    onSuccess: (res) => {
      toast.success(res.roi_score ? `Saved. IGE ROI Score ${res.roi_score}/100.` : "Saved.");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const cell = "rounded border border-border bg-background px-2 py-1 text-xs";
  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-muted-foreground">
        Results you enter are marked self-reported in the report. A clearly labelled number is more
        credible than an unverified one dressed up as automatic.
      </p>
      {deal.objectives.map((o) => (
        <label key={o.objective_name} className="flex items-center justify-between gap-3">
          <span>
            {o.objective_name}{" "}
            <span className="text-xs text-muted-foreground">
              ({o.kpi ?? "result"}, target {o.target_value ?? "—"})
            </span>
          </span>
          <input
            type="number"
            min={0}
            value={achieved[o.objective_name] ?? ""}
            onChange={(e) => setAchieved({ ...achieved, [o.objective_name]: e.target.value })}
            className={`${cell} w-28`}
            aria-label={`${o.objective_name} achieved`}
          />
        </label>
      ))}
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          type="number"
          placeholder="Rights fee paid"
          value={f.rights_fee}
          onChange={(e) => setF({ ...f, rights_fee: e.target.value })}
          className={cell}
        />
        <input
          type="number"
          placeholder="Fair market value"
          value={f.fmv}
          onChange={(e) => setF({ ...f, fmv: e.target.value })}
          className={cell}
        />
        <input
          type="number"
          placeholder="Attendees reached"
          value={f.attendees}
          onChange={(e) => setF({ ...f, attendees: e.target.value })}
          className={cell}
        />
        <input
          type="number"
          placeholder="Leads captured"
          value={f.leads}
          onChange={(e) => setF({ ...f, leads: e.target.value })}
          className={cell}
        />
        <input
          type="number"
          placeholder="Pipeline value"
          value={f.pipeline}
          onChange={(e) => setF({ ...f, pipeline: e.target.value })}
          className={cell}
        />
        <input
          type="number"
          placeholder="Awareness lift %"
          value={f.lift}
          onChange={(e) => setF({ ...f, lift: e.target.value })}
          className={cell}
        />
      </div>
      <textarea
        rows={2}
        placeholder="Sentiment and brand notes"
        value={f.sentiment}
        onChange={(e) => setF({ ...f, sentiment: e.target.value })}
        className={`${cell} w-full`}
      />
      <textarea
        rows={2}
        placeholder="Competing brands present or absent"
        value={f.competitors}
        onChange={(e) => setF({ ...f, competitors: e.target.value })}
        className={`${cell} w-full`}
      />
      <textarea
        rows={2}
        placeholder="90-day outlook and renewal case"
        value={f.outlook}
        onChange={(e) => setF({ ...f, outlook: e.target.value })}
        className={`${cell} w-full`}
      />
      <Button size="sm" disabled={mut.isPending} onClick={() => mut.mutate()}>
        Save results
      </Button>
    </div>
  );
}

function money(d: RoiDeal, v: number | null) {
  return v == null ? "—" : fmtMoney(d.currency ?? "USD", v);
}

/** The board-ready one-pager (TAB 4 §4.1 "The Justify-the-Spend Artifact"). */
function printBusinessCase(d: RoiDeal, pack: SectorPack | undefined) {
  const e = d.event;
  const cpa = d.value != null && e?.attendance_size ? d.value / e.attendance_size : null;
  const html = `
    <h1>Sponsorship Business Case</h1>
    <div class="meta">${escHtml(e?.name ?? "Event")} · ${escHtml([e?.city, e?.country].filter(Boolean).join(", "))} · ${e?.start_date ? new Date(e.start_date).toDateString() : ""}</div>
    <h2>The investment</h2>
    <table><tr><th>Proposed value</th><td class="num">${escHtml(money(d, d.value))}</td></tr>
    <tr><th>Expected attendance</th><td class="num">${e?.attendance_size?.toLocaleString() ?? "—"}</td></tr>
    <tr><th>Cost per attendee</th><td class="num">${cpa != null ? escHtml(money(d, Math.round(cpa))) : "—"}</td></tr></table>
    <h2>Why this event</h2>
    <p>Audience: ${escHtml(e?.primary_audience ?? "—")}. Sector: ${escHtml(e?.primary_sector ?? "—")}. Seniority: ${escHtml(e?.audience_seniority ?? "—")}${e?.decision_makers_pct != null ? `, about ${e.decision_makers_pct}% decision-makers` : ""}.</p>
    <h2>What it must achieve</h2>
    <table><tr><th>Objective</th><th>Pillar</th><th class="num">Spend weight</th><th>KPI</th><th class="num">Target</th></tr>
    ${d.objectives.map((o) => `<tr><td>${escHtml(o.objective_name)}</td><td>${PILLAR_LABEL[o.pillar]}</td><td class="num">${o.spend_weight_pct}%</td><td>${escHtml(o.kpi ?? "—")}</td><td class="num">${o.target_value?.toLocaleString() ?? "—"}</td></tr>`).join("")}</table>
    ${pack ? `<h2>Benchmark</h2><p>Sector pack: ${escHtml(pack.pack_name)} (${escHtml(pack.pillar_emphasis)}). Typical KPIs: ${escHtml(pack.default_kpis.join(", "))}. <span class="tag">${escHtml(pack.benchmark_note ?? "Industry reference")}</span></p>` : ""}
    <p class="note">Measured against the objectives above, weighted by spend, using the value-for-money / brand / business structure of IEG's 3-2-1 approach. Benchmarks are labelled by source; IGE does not present industry reference ranges as its own data. The IGE ROI Score is IGE's own methodology, not an independent certification.</p>`;
  if (!openPrintPage(`Business Case — ${e?.name ?? "Sponsorship"}`, html))
    toast.error("Allow pop-ups for IGE to save the PDF.");
}

/** Investment Report in the TAB 8 §8.3 structure, ROI Score shown last. */
function printInvestmentReport(d: RoiDeal) {
  const r = d.report;
  const e = d.event;
  const score = roiScore(d.objectives);
  const html = `
    <h1>Investment Report</h1>
    <div class="meta">${escHtml(e?.name ?? "Event")} · ${r?.generated_at ? `generated ${new Date(r.generated_at).toDateString()}` : "draft"}</div>
    <h2>Executive summary</h2>
    <p>${escHtml(money(d, r?.rights_fee ?? d.value))} invested across ${d.objectives.length} objective${d.objectives.length === 1 ? "" : "s"}. ${r?.renewal_recommended ? "Renewal recommended." : ""}</p>
    <h2>Objective scorecard</h2>
    <table><tr><th>Objective</th><th class="num">Weight</th><th>KPI</th><th class="num">Target</th><th class="num">Achieved</th><th class="num">Return</th></tr>
    ${d.objectives
      .map((o) => {
        const ret = objectiveReturn(o);
        return `<tr><td>${escHtml(o.objective_name)} ${o.is_self_reported ? '<span class="tag">self-reported</span>' : ""}</td><td class="num">${o.spend_weight_pct}%</td><td>${escHtml(o.kpi ?? "—")}</td><td class="num">${o.target_value?.toLocaleString() ?? "—"}</td><td class="num">${o.achieved_value?.toLocaleString() ?? "—"}</td><td class="num">${ret != null ? `${Math.round(ret * 100)}% of target` : "—"}</td></tr>`;
      })
      .join("")}</table>
    <h2>Value for money</h2>
    <p>Rights fee ${escHtml(money(d, r?.rights_fee ?? null))} against a fair market value of ${escHtml(money(d, r?.fair_market_value ?? null))}.${r?.attendees_reached && r?.rights_fee ? ` Cost per attendee reached: ${escHtml(money(d, Math.round(r.rights_fee / r.attendees_reached)))}.` : ""}</p>
    <h2>Value for brand</h2>
    <p>${r?.awareness_lift_pct != null ? `Awareness lift ${r.awareness_lift_pct}%. ` : ""}${escHtml(r?.sentiment_note ?? "")}</p>
    ${d.evidence.length ? `<p>Activation evidence: ${d.evidence.map((x) => escHtml(`${x.kind}${x.attendance_count ? ` (${x.attendance_count} attended)` : ""}${x.caption ? ` — ${x.caption}` : ""}`)).join("; ")}.</p>` : ""}
    <h2>Value for business</h2>
    <p>${r?.leads_captured != null ? `${r.leads_captured} leads captured. ` : ""}${r?.pipeline_value != null ? `Pipeline value ${escHtml(money(d, r.pipeline_value))}.` : ""}</p>
    <h2>Competitive intelligence</h2><p>${escHtml(r?.competitors_present ?? "—")}</p>
    <h2>90-day outlook</h2><p>${escHtml(r?.outlook_90_day ?? "—")}</p>
    <h2>IGE ROI Score</h2><p>${score != null ? `${score} / 100` : "Not enough results yet"} — a composite for cross-event comparison only. The objective scorecard above is the primary evidence.</p>
    <p class="note">IGE ROI Score is IGE's proprietary methodology (hitting every target scores 70; doubling every target scores 100). It is not an independent or third-party certification.</p>`;
  if (!openPrintPage(`Investment Report — ${e?.name ?? "Sponsorship"}`, html))
    toast.error("Allow pop-ups for IGE to save the PDF.");
}

/** Sponsorship ROI: setup flow, Business Case and Investment Report (TAB 4 §4.1, TAB 8). */
export function RoiPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getRoiWorkspace);
  const { data, isLoading } = useQuery({ queryKey: ["roi"], queryFn: () => fetchAll() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["roi"] });
  const [mode, setMode] = useState<Record<string, "setup" | "results" | null>>({});

  if (isLoading) {
    return (
      <WorkspacePage title="Sponsorship ROI">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }
  const deals = data?.deals ?? [];
  return (
    <WorkspacePage
      title="Sponsorship ROI"
      subtitle="Set what each sponsorship must achieve, defend it with a Business Case, and prove it with an Investment Report."
    >
      {deals.length === 0 ? (
        <DashboardPanel title="No committed sponsorships yet">
          <p className="text-sm text-muted-foreground">
            Once a sponsorship reaches commitment, set its objectives here — it takes under two
            minutes.
          </p>
        </DashboardPanel>
      ) : (
        deals.map((d) => {
          const locked = !!d.setup?.locked_at;
          const pack = data?.packs.find((p) => p.id === d.setup?.sector_pack_id);
          const score = roiScore(d.objectives);
          const m = mode[d.id] ?? null;
          return (
            <DashboardPanel
              key={d.id}
              title={d.event?.name ?? "Sponsorship"}
              description={`${d.status.replace(/_/g, " ")} · ${money(d, d.value)}${score != null ? ` · ROI Score ${score}/100` : ""}`}
              action={
                <div className="flex flex-wrap items-center gap-2">
                  {d.my_side === "sponsor" && !locked && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setMode({ ...mode, [d.id]: m === "setup" ? null : "setup" })}
                    >
                      Set objectives
                    </Button>
                  )}
                  {locked && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Lock className="h-3 w-3" /> Weights locked
                    </span>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!d.objectives.length}
                    onClick={() => printBusinessCase(d, pack)}
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" /> Business Case
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!d.objectives.length}
                    onClick={() => setMode({ ...mode, [d.id]: m === "results" ? null : "results" })}
                  >
                    Record results
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={!d.objectives.length}
                    onClick={() => printInvestmentReport(d)}
                  >
                    <Printer className="mr-1.5 h-3.5 w-3.5" /> Investment Report
                  </Button>
                  <InfoTip tip="roi.roo" />
                </div>
              }
            >
              {d.objectives.length > 0 && m !== "setup" && (
                <ul className="mb-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {d.objectives.map((o) => {
                    const ret = objectiveReturn(o);
                    return (
                      <li
                        key={o.objective_name}
                        className="rounded-lg border border-border p-3 text-sm"
                      >
                        <div className="flex justify-between">
                          <span className="font-medium text-foreground">{o.objective_name}</span>
                          <span className="tabular-nums text-primary-deep">
                            {o.spend_weight_pct}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {PILLAR_LABEL[o.pillar]} · {o.kpi ?? "no KPI"} · target{" "}
                          {o.target_value ?? "—"}
                        </p>
                        {ret != null && (
                          <p className="mt-1 text-xs font-semibold text-secondary-deep">
                            {Math.round(ret * 100)}% of target
                          </p>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              {!d.objectives.length && m !== "setup" && (
                <p className="text-sm text-muted-foreground">
                  {d.my_side === "sponsor"
                    ? "No objectives yet. Set them to measure this sponsorship properly."
                    : "The sponsor has not set objectives for this sponsorship yet."}
                </p>
              )}
              {m === "setup" && (
                <SetupFlow
                  deal={d}
                  packs={data?.packs ?? []}
                  onDone={() => {
                    setMode({ ...mode, [d.id]: null });
                    refresh();
                  }}
                />
              )}
              {m === "results" && (
                <ResultsForm
                  deal={d}
                  onDone={() => {
                    setMode({ ...mode, [d.id]: null });
                    refresh();
                  }}
                />
              )}
            </DashboardPanel>
          );
        })
      )}
    </WorkspacePage>
  );
}
