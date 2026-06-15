import { createFileRoute, redirect } from "@tanstack/react-router";
import { SponsorSavedPage } from "@/components/dashboards/sponsor-pages";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/saved")({
  head: () => ({ meta: [{ title: "Saved events - IGE" }] }),
  component: SavedRoute,
});

function SavedRoute() {
  const { roles } = useAuth();
  if (roles.includes("sponsor")) return <SponsorSavedPage />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard section="saved" />;
  throw redirect({ to: "/dashboard" });
}
