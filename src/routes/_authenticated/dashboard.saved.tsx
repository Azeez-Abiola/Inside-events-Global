import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { DashboardPageSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { SponsorSavedPage } from "@/components/dashboards/sponsor-pages";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/saved")({
  head: () => ({ meta: [{ title: "Saved events - IGE" }] }),
  component: SavedRoute,
});

function SavedRoute() {
  const { roles, loading } = useAuth();

  if (loading) {
    return (
      <AppShell>
        <DashboardPageSkeleton kpis={3} />
      </AppShell>
    );
  }

  if (roles.includes("sponsor")) return <SponsorSavedPage />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard section="saved" />;
  return <Navigate to="/dashboard" replace />;
}
