import { useState } from "react";
import { GripVertical } from "lucide-react";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import type { CrmCompany, CrmContact, CrmDeal, CrmStage } from "@/lib/crm.functions";

/**
 * Pipeline tracker — kanban and table views of deals through editable stages
 * (TAB 4 §4.4.2).
 *
 * Drag and drop uses the browser's own HTML5 DnD rather than a library: the
 * only gesture is card-to-column, and a dependency for that would be more
 * code than the feature. Every card is also keyboard-reachable through the
 * stage select, so the board is not drag-only.
 */
export function PipelineBoard({
  stages,
  deals,
  contactById,
  companyById,
  editable,
  onMove,
}: {
  stages: CrmStage[];
  deals: CrmDeal[];
  contactById: Map<string, CrmContact>;
  companyById: Map<string, CrmCompany>;
  editable: boolean;
  onMove: (dealId: string, stageId: string) => void;
  onChanged: () => void;
}) {
  const [view, setView] = useState<"board" | "table">("board");
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const byStage = (stageId: string) => deals.filter((d) => d.stage_id === stageId);
  const unstaged = deals.filter((d) => !d.stage_id || !stages.some((s) => s.id === d.stage_id));

  const money = (d: CrmDeal) =>
    d.value_amount == null
      ? null
      : `${d.value_currency} ${Number(d.value_amount).toLocaleString()}`;

  const label = (d: CrmDeal) => {
    const contact = d.contact_id ? contactById.get(d.contact_id) : null;
    const company = d.company_id ? companyById.get(d.company_id) : null;
    return [contact?.full_name, company?.name].filter(Boolean).join(" · ");
  };

  return (
    <DashboardPanel
      title="Pipeline"
      description="Deals and partnerships through your stages."
      action={
        <div className="flex gap-1">
          {(["board", "table"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors ${
                view === v
                  ? "bg-brand-soft text-primary-deep"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-0"
    >
      {deals.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          No deals yet. Open a contact and add one to start tracking it here.
        </p>
      ) : view === "board" ? (
        <div className="overflow-x-auto px-5 py-4">
          <div className="flex gap-3">
            {stages.map((stage) => {
              const cards = byStage(stage.id);
              const total = cards.reduce((sum, d) => sum + Number(d.value_amount ?? 0), 0);
              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => {
                    if (!editable || !dragging) return;
                    e.preventDefault();
                    setOver(stage.id);
                  }}
                  onDragLeave={() => setOver((o) => (o === stage.id ? null : o))}
                  onDrop={(e) => {
                    e.preventDefault();
                    setOver(null);
                    if (editable && dragging) onMove(dragging, stage.id);
                    setDragging(null);
                  }}
                  className={`w-60 shrink-0 rounded-xl border p-2 transition-colors ${
                    over === stage.id ? "border-primary bg-brand-soft" : "border-border bg-muted/20"
                  }`}
                >
                  <div className="mb-2 flex items-baseline justify-between gap-2 px-1">
                    <span
                      className={`truncate text-xs font-semibold ${
                        stage.is_won
                          ? "text-secondary-deep"
                          : stage.is_lost
                            ? "text-muted-foreground"
                            : "text-foreground"
                      }`}
                    >
                      {stage.name}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                      {cards.length}
                    </span>
                  </div>
                  {total > 0 && (
                    <p className="mb-2 px-1 text-[11px] tabular-nums text-muted-foreground">
                      {cards[0]?.value_currency} {total.toLocaleString()}
                    </p>
                  )}
                  <div className="space-y-2">
                    {cards.map((d) => (
                      <article
                        key={d.id}
                        draggable={editable}
                        onDragStart={() => setDragging(d.id)}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        className={`rounded-lg border border-border bg-card p-2.5 shadow-card ${
                          editable ? "cursor-grab active:cursor-grabbing" : ""
                        } ${dragging === d.id ? "opacity-50" : ""}`}
                      >
                        <div className="flex items-start gap-1.5">
                          {editable && (
                            <GripVertical
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                              aria-hidden
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {d.title}
                            </p>
                            {label(d) && (
                              <p className="truncate text-[11px] text-muted-foreground">
                                {label(d)}
                              </p>
                            )}
                            {money(d) && (
                              <p className="mt-1 text-[11px] font-semibold tabular-nums text-foreground">
                                {money(d)}
                              </p>
                            )}
                          </div>
                        </div>
                        {editable && (
                          <select
                            value={d.stage_id ?? ""}
                            onChange={(e) => onMove(d.id, e.target.value)}
                            aria-label={`Stage for ${d.title}`}
                            className="mt-2 w-full rounded border border-border bg-background px-1.5 py-1 text-[11px] text-muted-foreground focus:border-primary focus:outline-none"
                          >
                            {stages.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          {unstaged.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {unstaged.length} deal{unstaged.length === 1 ? "" : "s"} with no stage — set one from
              the table view.
            </p>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Deal</th>
                <th className="px-5 py-3 font-semibold">Who</th>
                <th className="px-5 py-3 font-semibold">Stage</th>
                <th className="px-5 py-3 text-right font-semibold">Value</th>
                <th className="px-5 py-3 text-right font-semibold">Prob.</th>
                <th className="px-5 py-3 font-semibold">Close</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {deals.map((d) => (
                <tr key={d.id}>
                  <td className="px-5 py-3 font-medium text-foreground">{d.title}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">{label(d) || "—"}</td>
                  <td className="px-5 py-3">
                    {editable ? (
                      <select
                        value={d.stage_id ?? ""}
                        onChange={(e) => onMove(d.id, e.target.value)}
                        aria-label={`Stage for ${d.title}`}
                        className="rounded border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
                      >
                        <option value="">—</option>
                        {stages.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {stages.find((s) => s.id === d.stage_id)?.name ?? "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right text-xs tabular-nums">{money(d) ?? "—"}</td>
                  <td className="px-5 py-3 text-right text-xs tabular-nums text-muted-foreground">
                    {d.probability == null ? "—" : `${d.probability}%`}
                  </td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {d.expected_close ? new Date(d.expected_close).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardPanel>
  );
}
