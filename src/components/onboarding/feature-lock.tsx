import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { useVerificationState } from "@/hooks/use-verification-state";
import { VERIFICATION_LOCKED_FEATURES } from "@/lib/onboarding-constants";

/**
 * Features that stay locked until Verification & trust is complete
 * (TAB 3 §3.2A).
 *
 * "Each shows a lock icon and a 'Complete onboarding to unlock' button that
 *  opens the section directly."
 *
 * Note what this is NOT: it is a UI affordance, not an authorisation check.
 * Anything that actually matters — taking a payment, issuing a payout,
 * generating a contract — has to be enforced on the server as well. This
 * stops someone bumping into a dead end without an explanation; it does not
 * stop a determined request.
 */

export type LockedFeatureKey = (typeof VERIFICATION_LOCKED_FEATURES)[number]["key"];

/**
 * Wraps a feature. Renders it when verification is done, and a lock panel
 * when it is not. While the check is in flight it renders nothing rather than
 * flashing a lock at someone who is already verified.
 */
export function FeatureLock({
  feature,
  children,
  compact,
}: {
  feature: LockedFeatureKey;
  children: ReactNode;
  /** Inline variant for a button or a table cell. */
  compact?: boolean;
}) {
  const { isLoading, verified, status, sectionKey } = useVerificationState();

  if (isLoading) return null;
  if (verified) return <>{children}</>;

  const meta = VERIFICATION_LOCKED_FEATURES.find((f) => f.key === feature);
  const label = meta?.label ?? "This feature";

  // Submitted but not yet checked is a different message: there is nothing
  // for them to do, and telling them to "complete onboarding" would be wrong.
  const awaitingReview = status === "submitted";

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3 shrink-0" aria-hidden />
        {awaitingReview ? (
          "Locked until IGE checks your documents"
        ) : (
          <Link
            to="/onboarding/wizard"
            search={sectionKey ? { section: sectionKey } : {}}
            className="font-semibold text-primary underline underline-offset-2 hover:text-primary-deep"
          >
            Complete onboarding to unlock
          </Link>
        )}
      </span>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-6 text-center">
      <Lock className="mx-auto h-5 w-5 text-muted-foreground" aria-hidden />
      <p className="mt-2 text-sm font-medium text-foreground">{label}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
        {awaitingReview
          ? "Your documents are with IGE. We will unlock this as soon as they are checked — nothing more is needed from you."
          : (meta?.unlocksWhen ?? "Complete Verification & trust to unlock this.")}
      </p>
      {!awaitingReview && (
        <Link
          to="/onboarding/wizard"
          search={sectionKey ? { section: sectionKey } : {}}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
        >
          Complete onboarding to unlock
        </Link>
      )}
    </div>
  );
}

/** The lock badge on its own, for a card corner or a list row. */
export function LockBadge({ className }: { className?: string }) {
  const { verified, isLoading } = useVerificationState();
  if (isLoading || verified) return null;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground ${className ?? ""}`}
    >
      <Lock className="h-3 w-3" aria-hidden /> Locked
    </span>
  );
}
