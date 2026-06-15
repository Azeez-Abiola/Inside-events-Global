import { ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
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
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (!allowed.some((r) => roles.includes(r))) {
    return <Navigate to={fallbackTo} replace />;
  }

  return <>{children}</>;
}
