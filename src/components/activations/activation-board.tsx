import { useMemo, useState } from "react";
import { GripVertical } from "lucide-react";
import type {
  Activation,
  ActivationMilestone,
  ActivationTeamMember,
} from "@/lib/activations.functions";

/**
 * Board, Timeline, Calendar and Table views of activations (Module 4A).
 *
 * Status columns are fixed by the spec — Not started, In progress, Blocked,
 * Done — unlike CRM pipeline stages, which are editable per workspace. Keeping
 * them an enum means a Blocked activation means the same thing in everyone's
 * reporting.
 */

export type ActivationView = "board" | "timeline" | "table";

const STATUS_COLUMNS = [
  { key: "not_started", label: "Not started" },
  { key: "in_progress", label: "In progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Done" },
] as const;

const STATUS_TONE: Record<string, string> = {
  not_started: "border-border bg-muted/20",
  in_progress: "border-primary/30 bg-brand-soft",
  blocked: "border-destructive/30 bg-destructive/5",
  done: "border-secondary/30 bg-secondary/10",
};

const TYPE_LABEL: Record<string, string> = {
  sampling: "Sampling",
  booth: "Booth",
  stage_moment: "Stage moment",
  hosted_session: "Hosted session",
  content_shoot: "Content shoot",
  pop_up: "Pop-up",
  community_outreach: "Community outreach",
  other: "Other",
};

export function ActivationBoard({
  view,
  activations,
  milestones,
  team,
  editable,
  onMove,
  onOpen,
}: {
  view: ActivationView;
  activations: Activation[];
  milestones: ActivationMilestone[];
  team: ActivationTeamMember[];
  editable: boolean;
  onMove: (id: string, status: string) => void;
  onOpen: (a: Activation) => void;
}) {
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<string | null>(null);

  const nameFor = useMemo(() => new Map(team.map((t) => [t.user_id, t.name])), [team]);
  const milesFor = useMemo(() => {
    const m = new Map<string, ActivationMilestone[]>();
    for (const x of milestones) {
      const list = m.get(x.activation_id);
      if (list) list.push(x);
      else m.set(x.activation_id, [x]);
    }
    return m;
  }, [milestones]);

  const progress = (a: Activation) => {
    const list = milesFor.get(a.id) ?? [];
    if (!list.length) return null;
    return { done: list.filter((m) => m.completed_at).length, total: list.length };
  };

  const money = (a: Activation) =>
    a.budget_amount == null
      ? null
      : `${a.budget_currency} ${Number(a.budget_amount).toLocaleString()}`;

  if (view === "board") {
    return (
      <div className="overflow-x-auto px-5 py-4">
        <div className="flex gap-3">
          {STATUS_COLUMNS.map((col) => {
            const cards = activations.filter((a) => a.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  if (!editable || !dragging) return;
                  e.preventDefault();
                  setOver(col.key);
                }}
                onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
                onDrop={(e) => {
                  e.preventDefault();
                  setOver(null);
                  if (editable && dragging) onMove(dragging, col.key);
                  setDragging(null);
                }}
                className={`w-64 shrink-0 rounded-xl border p-2 transition-colors ${
                  over === col.key ? "border-primary bg-brand-soft" : STATUS_TONE[col.key]
                }`}
              >
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <span className="text-xs font-semibold text-foreground">{col.label}</span>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {cards.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {cards.map((a) => {
                    const p = progress(a);
                    return (
                      <article
                        key={a.id}
                        draggable={editable}
                        onDragStart={() => setDragging(a.id)}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        className={`rounded-lg border border-border bg-card p-2.5 shadow-card ${
                          dragging === a.id ? "opacity-50" : ""
                        }`}
                      >
                        <div className="flex items-start gap-1.5">
                          {editable && (
                            <GripVertical
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground/60"
                              aria-hidden
                            />
                          )}
                          <button
                            type="button"
                            onClick={() => onOpen(a)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <span className="block truncate text-sm font-medium text-foreground">
                              {a.name}
                            </span>
                            <span className="block text-[11px] text-muted-foreground">
                              {TYPE_LABEL[a.activation_type] ?? a.activation_type}
                            </span>
                            {(a.city || a.venue) && (
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {[a.venue, a.city].filter(Boolean).join(", ")}
                              </span>
                            )}
                            {a.starts_on && (
                              <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">
                                {new Date(a.starts_on).toLocaleDateString()}
                              </span>
                            )}
                            {money(a) && (
                              <span className="block text-[11px] font-semibold tabular-nums text-foreground">
                                {money(a)}
                              </span>
                            )}
                            {p && (
                              <span className="mt-1 block text-[11px] text-muted-foreground">
                                {p.done}/{p.total} milestones
                              </span>
                            )}
                            {a.owner_id && (
                              <span className="mt-1 block truncate text-[11px] text-primary">
                                {nameFor.get(a.owner_id) ?? "Assigned"}
                              </span>
                            )}
                          </button>
                        </div>
                        {editable && (
                          <select
                            value={a.status}
                            onChange={(e) => onMove(a.id, e.target.value)}
                            aria-label={`Status for ${a.name}`}
                            className="mt-2 w-full rounded border border-border bg-background px-1.5 py-1 text-[11px] text-muted-foreground focus:border-primary focus:outline-none"
                          >
                            {STATUS_COLUMNS.map((s) => (
                              <option key={s.key} value={s.key}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (view === "timeline") {
    // Gantt-style: one row per activation, bar positioned across the span of
    // everything scheduled. Activations with no dates are listed separately
    // rather than drawn at an arbitrary position.
    const dated = activations.filter((a) => a.starts_on);
    const undated = activations.filter((a) => !a.starts_on);

    if (dated.length === 0) {
      return (
        <p className="px-5 py-12 text-center text-sm text-muted-foreground">
          No activation has dates yet. Add a start date to see it on the timeline.
        </p>
      );
    }

    const times = dated.flatMap((a) => [
      new Date(a.starts_on!).getTime(),
      new Date(a.ends_on ?? a.starts_on!).getTime(),
    ]);
    const min = Math.min(...times);
    const max = Math.max(...times);
    const span = Math.max(max - min, 86_400_000);

    return (
      <div className="space-y-2 px-5 py-4">
        {dated.map((a) => {
          const s = new Date(a.starts_on!).getTime();
          const e = new Date(a.ends_on ?? a.starts_on!).getTime();
          const left = ((s - min) / span) * 100;
          const width = Math.max(((e - s) / span) * 100, 2);
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => onOpen(a)}
              className="block w-full text-left"
            >
              <span className="mb-1 flex items-baseline justify-between gap-3">
                <span className="truncate text-xs font-medium text-foreground">{a.name}</span>
                <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                  {new Date(a.starts_on!).toLocaleDateString()}
                  {a.ends_on ? ` – ${new Date(a.ends_on).toLocaleDateString()}` : ""}
                </span>
              </span>
              <span className="block h-2.5 rounded-full bg-muted">
                <span
                  className={`block h-2.5 rounded-full ${
                    a.status === "done"
                      ? "bg-secondary"
                      : a.status === "blocked"
                        ? "bg-destructive"
                        : "bg-brand-gradient"
                  }`}
                  style={{ marginLeft: `${left}%`, width: `${width}%` }}
                />
              </span>
            </button>
          );
        })}
        {undated.length > 0 && (
          <p className="pt-2 text-xs text-muted-foreground">
            {undated.length} activation{undated.length === 1 ? "" : "s"} with no dates yet.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-5 py-3 font-semibold">Activation</th>
            <th className="px-5 py-3 font-semibold">Type</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Owner</th>
            <th className="px-5 py-3 font-semibold">Dates</th>
            <th className="px-5 py-3 text-right font-semibold">Budget</th>
            <th className="px-5 py-3 text-right font-semibold">Milestones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {activations.map((a) => {
            const p = progress(a);
            return (
              <tr
                key={a.id}
                onClick={() => onOpen(a)}
                className="cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-3 font-medium text-foreground">{a.name}</td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {TYPE_LABEL[a.activation_type] ?? a.activation_type}
                </td>
                <td className="px-5 py-3 text-xs capitalize text-muted-foreground">
                  {a.status.replace("_", " ")}
                </td>
                <td className="px-5 py-3 text-xs text-muted-foreground">
                  {a.owner_id ? (nameFor.get(a.owner_id) ?? "—") : "—"}
                </td>
                <td className="px-5 py-3 text-xs tabular-nums text-muted-foreground">
                  {a.starts_on ? new Date(a.starts_on).toLocaleDateString() : "—"}
                </td>
                <td className="px-5 py-3 text-right text-xs tabular-nums">{money(a) ?? "—"}</td>
                <td className="px-5 py-3 text-right text-xs tabular-nums text-muted-foreground">
                  {p ? `${p.done}/${p.total}` : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
