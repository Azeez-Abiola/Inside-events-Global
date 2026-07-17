import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useAuth } from "@/lib/auth-context";

export function SuperAdminGate({
  children,
  fallbackTo = "/dashboard",
}: {
  children: ReactNode;
  fallbackTo?: string;
}) {
  const { roles, loading } = useAuth();

  if (loading) {
    return <DashboardPageSkeleton kpis={3} tableRows={5} />;
  }

  if (!roles.includes("super_admin")) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
}
