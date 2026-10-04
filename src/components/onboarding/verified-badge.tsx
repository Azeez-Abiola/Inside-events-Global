import { Link } from "@tanstack/react-router";
import { Clock, Lock, ShieldCheck } from "lucide-react";
import { useVerificationState } from "@/hooks/use-verification-state";

/**
 * The IGE Verified badge, and what it looks like before you have earned it
 * (TAB 3 §3.2A, first locked feature).
 *
 * Unverified shows the lock and a link straight into the section, which is
 * what the spec asks every locked feature to do. Submitted-but-unchecked is
 * its own state: there is nothing for the person to do, and telling them to
 * "complete onboarding" when they already have would be wrong.
 */
export function VerifiedBadge() {
  const { isLoading, verified, status, sectionKey } = useVerificationState();

  if (isLoading) return null;

  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-0.5 text-xs font-semibold text-secondary-deep">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> IGE Verified
      </span>
    );
  }

  if (status === "submitted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-3 py-0.5 text-xs font-semibold text-muted-foreground">
        <Clock className="h-3.5 w-3.5" aria-hidden /> Verification in review
      </span>
    );
  }

  return (
    <Link
      to="/onboarding/wizard"
      search={sectionKey ? { section: sectionKey } : {}}
      className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-3 py-0.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
    >
      <Lock className="h-3 w-3" aria-hidden /> Get verified
    </Link>
  );
}
