import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Lock, ShieldCheck } from "lucide-react";
import { getOnboardingGateState } from "@/lib/onboarding.functions";
import { VERIFICATION_LOCKED_FEATURES } from "@/lib/onboarding-constants";

/**
 * The persistent profile-completion bar (TAB 3 §3.2).
 *
 * "A persistent profile-completion bar at the top of the dashboard shows what
 *  is left and which features each remaining item unlocks."
 *
 * Renders nothing once everything is done, and nothing for accounts with no
 * application at all — an admin or a legacy account has no profile to
 * complete, and a permanent empty bar is worse than no bar.
 */
export function ProfileCompletionBar() {
  const fetchState = useServerFn(getOnboardingGateState);
  const { data } = useQuery({
    queryKey: ["onboarding-gate-state"],
    queryFn: () => fetchState(),
    staleTime: 60_000,
    retry: false,
  });

  if (!data?.hasApplication) return null;
  if (data.progress === "fully_complete") return null;

  const outstanding = data.outstanding ?? [];
  if (outstanding.length === 0) return null;

  const verificationDone = data.verificationStatus === "verified";
  const next = outstanding[0];

  return (
    <section
      aria-label="Profile completion"
      className="rounded-2xl border border-primary/25 bg-brand-soft px-5 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-primary-deep">
            {outstanding.length} thing{outstanding.length === 1 ? "" : "s"} left on your profile
          </h2>
          <p className="mt-0.5 text-xs text-primary-deep/80">
            {outstanding.map((s) => s.title).join(" · ")}
          </p>
        </div>
        <Link
          to="/onboarding/wizard"
          search={{ section: next.key }}
          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-brand-gradient px-3.5 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Finish {next.title}
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* §3.2 asks the bar to say which features each remaining item unlocks,
          so this is the point of the whole component — not decoration. */}
      {!verificationDone && (
        <ul className="mt-3 space-y-1.5 border-t border-primary/15 pt-3">
          {VERIFICATION_LOCKED_FEATURES.map((f) => (
            <li key={f.key} className="flex items-start gap-2 text-xs text-primary-deep/80">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      )}

      {verificationDone && (
        <p className="mt-3 flex items-center gap-1.5 border-t border-primary/15 pt-3 text-xs text-primary-deep/80">
          <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
          You are verified — everything is unlocked. The sections above are optional detail that
          sharpens your matches.
        </p>
      )}
    </section>
  );
}
