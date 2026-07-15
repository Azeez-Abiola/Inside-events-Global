import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useAuth } from "@/lib/auth-context";

type AppRole =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "abw_admin"
  | "super_admin";

export function RoleGate({
  allow,
  children,
  fallbackTo = "/dashboard",
}: {
  allow: AppRole | AppRole[];
  children: ReactNode;
  fallbackTo?: string;
}) {
  const { roles, loading } = useAuth();
  const allowed = Array.isArray(allow) ? allow : [allow];

  if (loading) {
    return <DashboardPageSkeleton kpis={3} tableRows={5} />;
  }

  if (!allowed.some((r) => roles.includes(r))) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
}
