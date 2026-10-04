import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import { InfoTip } from "@/components/info-tip";
import { successMetricGroupsForRole } from "@/lib/success-metrics";
import type { OnboardingRole } from "@/lib/onboarding-constants";

/**
 * The Global Success Metrics Library picker (Appendix C, TAB 3 §3.6.1).
 *
 * The library runs to roughly sixty metrics, so a flat pill grid is unusable.
 * Metrics are grouped by the framework they come from, as the appendix
 * requires, and each group collapses — open by default only where the person
 * has already chosen something, so returning to the section shows their
 * answers rather than a wall of closed rows.
 *
 * Organisers and Sponsors see the whole library; other roles see the groups
 * relevant to them.
 */
export function SuccessMetricsPicker({
  role,
  value,
  onChange,
}: {
  role: OnboardingRole;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const groups = useMemo(() => successMetricGroupsForRole(role), [role]);
  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.key, g.metrics.some((m) => value.includes(m))])),
  );

  function toggleMetric(metric: string) {
    onChange(value.includes(metric) ? value.filter((m) => m !== metric) : [...value, metric]);
  }

  return (
    <div className="space-y-2">
      <p className="text-xs leading-relaxed text-muted-foreground">
        Grouped by the global framework each measure comes from. Pick as many as apply — your
        dashboard and reports are built around them. IGE references these frameworks; it is not
        endorsed by them.
      </p>

      {groups.map((group) => {
        const chosen = group.metrics.filter((m) => value.includes(m)).length;
        const isOpen = open[group.key] ?? false;
        return (
          <div key={group.key} className="rounded-lg border border-border bg-card">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [group.key]: !isOpen }))}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{group.framework}</span>
                <span className="block text-xs text-muted-foreground">{group.blurb}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {chosen > 0 && (
                  <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-primary-deep">
                    {chosen}
                  </span>
                )}
                <ChevronDown
                  size={16}
                  className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
              </span>
            </button>

            {isOpen && (
              <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2.5">
                {group.metrics.map((metric) => {
                  const on = value.includes(metric);
                  return (
                    <button
                      type="button"
                      key={metric}
                      aria-pressed={on}
                      onClick={() => toggleMetric(metric)}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                        on
                          ? "border-primary bg-brand-soft text-primary-deep"
                          : "border-border bg-card text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {metric}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length} metric{value.length === 1 ? "" : "s"} selected
          <InfoTip tip="field.success_metrics" />
        </p>
      )}
    </div>
  );
}
