/**
 * Keeps unapproved applicants on the onboarding path instead of the dashboard.
 * Legacy accounts (no onboarding_applications row) are left alone.
 */
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getMyOnboardingApplication } from "@/lib/onboarding.functions";

export function OnboardingAccessGate({ children }: { children: React.ReactNode }) {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  const getFn = useServerFn(getMyOnboardingApplication);
  const isStaff = roles.includes("abw_admin") || roles.includes("super_admin");

  const { data, isLoading } = useQuery({
    queryKey: ["my-onboarding-application"],
    queryFn: () => getFn({ data: undefined as never }) as Promise<{
      application: { status: string } | null;
    }>,
    enabled: !loading && !isStaff,
  });

  const status = data?.application?.status;

  useEffect(() => {
    if (loading || isStaff || isLoading) return;
    if (!status) return;
    if (status === "approved") return;
    if (status === "draft" || status === "changes_requested") {
      void navigate({ to: "/onboarding/wizard", replace: true });
      return;
    }
    void navigate({ to: "/onboarding/pending", replace: true });
  }, [status, isStaff, isLoading, loading, navigate]);

  if (isStaff) return <>{children}</>;
  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-dashboard-canvas">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (status && status !== "approved") return null;

  return <>{children}</>;
}
