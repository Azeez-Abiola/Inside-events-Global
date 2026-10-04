import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Clock, Loader2 } from "lucide-react";
import { getMyWorkspaces, getTeamActivity } from "@/lib/workspace.functions";
import { ROLE_LABELS, type WorkspaceRole } from "@/lib/workspace-permissions";

/**
 * Team Activity (TAB 4 §4.3) — the Manager role's reason to exist.
 *
 * "A boss can monitor the team without editing anything, and can download the
 *  Weekly Team Activity Report."
 *
 * Only three of the five columns the spec names can be measured today;
 * outreach, meetings, activations and tasks arrive with the shared daily
 * tools in Version 1.1 Section B. Those are listed as not yet tracked rather
 * than shown as zero, because a manager reading "0 meetings held" would
 * conclude their team did nothing.
 */

const RANGES = [
  { days: 7, label: "This week" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

export function TeamActivity() {
  const fetchWorkspaces = useServerFn(getMyWorkspaces);
  const fetchActivity = useServerFn(getTeamActivity);
  const [days, setDays] = useState(7);

  const { data: ws } = useQuery({ queryKey: ["my-workspaces"], queryFn: () => fetchWorkspaces() });
  const workspaceId = ws?.activeWorkspaceId ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["team-activity", workspaceId, days],
    enabled: !!workspaceId,
    queryFn: () => fetchActivity({ data: { workspace_id: workspaceId!, days } }),
    retry: false,
  });

  if (!workspaceId || isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Could not load Team Activity."}
      </p>
    );
  }

  const rows = data?.rows ?? [];

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-muted/20 px-5 py-4">
        <div>
          <h3 className="font-display text-sm font-bold text-foreground">Team Activity</h3>
          <p className="text-xs text-muted-foreground">What each person moved, per period.</p>
        </div>
        <div className="flex gap-1">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              onClick={() => setDays(r.days)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                days === r.days
                  ? "bg-brand-soft text-primary-deep"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No active team members yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-semibold">Person</th>
                <th className="px-5 py-3 font-semibold">Seat</th>
                <th className="px-5 py-3 text-right font-semibold">Listings created</th>
                <th className="px-5 py-3 text-right font-semibold">Deals opened</th>
                <th className="px-5 py-3 text-right font-semibold">Pipeline moves</th>
                <th className="px-5 py-3 font-semibold">Last active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {rows.map((r) => (
                <tr key={r.user_id}>
                  <td className="px-5 py-3 font-medium text-foreground">{r.name}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {ROLE_LABELS[r.role as WorkspaceRole]}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.listings_created}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.deals_opened}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{r.pipeline_moves}</td>
                  <td className="px-5 py-3 text-xs text-muted-foreground">
                    {r.last_active_at ? new Date(r.last_active_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data?.untracked?.length ? (
        <div className="flex gap-2 border-t border-border/60 bg-muted/20 px-5 py-4">
          <Clock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-foreground">Not tracked yet:</span>{" "}
            {data.untracked.join(", ")}. These arrive with the shared daily tools — the CRM,
            Activation Task Tracker and meeting notes — and will appear here as columns once they
            do. They are listed rather than shown as zero so the numbers above can be trusted.
          </p>
        </div>
      ) : null}
    </section>
  );
}
