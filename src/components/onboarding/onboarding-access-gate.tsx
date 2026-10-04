/**
 * Dashboard access under progressive onboarding (TAB 3 §3.2A, §3.3).
 *
 * "No Admin approval to sign up, sign in or use the dashboard. Admin vets an
 *  event only when it is published to the marketplace." (§3.2A)
 * "The person reaches their dashboard immediately after the compulsory
 *  sections." (§3.2)
 *
 * So the only thing this gate asks is whether the compulsory sections are
 * done. It no longer waits on an application status, and a deferred section —
 * Verification & trust — never blocks the dashboard; it locks features
 * instead, which the completion bar explains.
 *
 * Accounts with no application at all (legacy, or mid-role-selection) are left
 * alone rather than redirected into a wizard that may have nothing to show.
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getOnboardingGateState } from "@/lib/onboarding.functions";

export function OnboardingAccessGate({ children }: { children: React.ReactNode }) {
  const { roles, loading, rolesReady } = useAuth();
  const navigate = useNavigate();
  const getState = useServerFn(getOnboardingGateState);
  const isStaff = roles.includes("abw_admin") || roles.includes("super_admin");

  const { data, isLoading } = useQuery({
    queryKey: ["onboarding-gate-state"],
    queryFn: () => getState(),
    // Roles arrive after the session does. Asking before they land treats an
    // admin as an applicant and redirects them off their own dashboard.
    enabled: !loading && rolesReady && !isStaff,
    // A failed read must not lock someone out of a dashboard they have earned,
    // so treat an error as "let them through" and let the completion bar
    // prompt them instead.
    retry: false,
  });

  const blocked = data?.hasApplication === true && data.progress === "compulsory_incomplete";

  useEffect(() => {
    if (loading || !rolesReady || isStaff || isLoading) return;
    if (!blocked) return;
    void navigate({ to: "/onboarding/wizard", replace: true });
  }, [blocked, isStaff, isLoading, loading, rolesReady, navigate]);

  if (isStaff) return <>{children}</>;
  if (loading || !rolesReady || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dashboard-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (blocked) return null;

  return <>{children}</>;
}
