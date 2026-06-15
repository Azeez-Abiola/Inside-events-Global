import { createFileRoute } from "@tanstack/react-router";
import { SponsorSavedPage } from "@/components/dashboards/sponsor-pages";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { RoleGate } from "@/components/role-gate";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/saved")({
  head: () => ({ meta: [{ title: "Saved events - IGE" }] }),
  component: SavedRoute,
});

function SavedRoute() {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (roles.includes("sponsor")) return <SponsorSavedPage />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard section="saved" />;
  return <Navigate to="/dashboard" replace />;
}
