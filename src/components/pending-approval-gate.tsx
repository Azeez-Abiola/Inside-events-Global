import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { GateSpinner } from "@/components/gate-spinner";
import { useAuth } from "@/lib/auth-context";

/**
 * Applicants with is_active=false are sent to the pending-approval screen.
 * Admins skip this gate.
 */
export function PendingApprovalGate({ children }: { children: React.ReactNode }) {
  const { isPendingApproval, loading, roles, rolesReady } = useAuth();
  const navigate = useNavigate();
  const isStaff = roles.includes("abw_admin") || roles.includes("super_admin");
  // Roles land after the session, so `isStaff` is false for a moment on every
  // sign-in — blocking on it would bounce admins to the pending screen.
  const blocked = rolesReady && isPendingApproval && !isStaff;

  useEffect(() => {
    if (loading || !blocked) return;
    void navigate({ to: "/onboarding/pending", replace: true });
  }, [blocked, loading, navigate]);

  if (loading || !rolesReady) return <>{children}</>;
  if (!blocked) return <>{children}</>;

  return (
    <GateSpinner
      className="bg-background"
      waitingOn={{ gate: "pending-approval", redirectingTo: "/onboarding/pending", isPendingApproval }}
    />
  );
}
