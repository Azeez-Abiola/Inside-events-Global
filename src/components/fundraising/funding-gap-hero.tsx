import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { fmtMoney } from "@/lib/currency";
import { getFundraising } from "@/lib/fundraising.functions";
import { fundraisingUrgency } from "@/components/fundraising/fundraising-page";

/**
 * The Organiser Command Center's hero number (TAB 5 §5.1): the funding gap of
 * the next event that has a target, with its red/amber/green countdown.
 */
export function FundingGapHero() {
  const fetchAll = useServerFn(getFundraising);
  const { data } = useQuery({ queryKey: ["fundraising"], queryFn: () => fetchAll() });
  const next = (data?.events ?? []).find(
    (e) => e.target != null && (e.days_to_event == null || e.days_to_event >= 0),
  );

  if (!data) return null;
  if (!next) {
    return (
      <Link
        to="/dashboard/fundraising"
        className="block rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground hover:bg-muted/30"
      >
        <span className="font-semibold text-foreground">Set a sponsorship target</span> for your next
        event and your funding gap will live here every morning →
      </Link>
    );
  }
  const u = fundraisingUrgency(next);
  return (
    <Link
      to="/dashboard/fundraising"
      className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-xl border border-border bg-card p-5 hover:bg-muted/20"
    >
      <div>
        <p className="text-xs text-muted-foreground">Funding gap · {next.name}</p>
        <p className="bg-brand-gradient bg-clip-text font-display text-4xl font-bold tabular-nums text-transparent">
          {fmtMoney(next.currency, next.gap ?? 0)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-3 rounded-full" style={{ background: u.colour }} aria-hidden />
        <span className="text-sm text-foreground">
          {next.days_to_event != null ? `${next.days_to_event} days to event` : "No date"} ·{" "}
          {u.label}
        </span>
      </div>
      {next.tiers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {next.tiers
            .filter((t) => t.slots_total)
            .map((t) => `${t.filled} of ${t.slots_total} ${t.tier_name}`)
            .join(" · ")}
        </p>
      )}
    </Link>
  );
}
