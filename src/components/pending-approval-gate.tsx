import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

/**
 * Applicants with is_active=false are sent to the pending-approval screen.
 * Admins skip this gate.
 */
export function PendingApprovalGate({ children }: { children: React.ReactNode }) {
  const { isPendingApproval, loading, roles } = useAuth();
  const navigate = useNavigate();
  const isStaff = roles.includes("abw_admin") || roles.includes("super_admin");
  const blocked = isPendingApproval && !isStaff;

  useEffect(() => {
    if (loading || !blocked) return;
    void navigate({ to: "/onboarding/pending", replace: true });
  }, [blocked, loading, navigate]);

  if (loading) return <>{children}</>;
  if (!blocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
