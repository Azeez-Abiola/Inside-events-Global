import { createFileRoute, redirect } from "@tanstack/react-router";
import { SponsorAnalyticsPage } from "@/components/dashboards/sponsor-pages";
import { OrganiserAnalyticsPage } from "@/components/dashboards/organiser-pages";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Analytics - IGE" }] }),
  component: AnalyticsRoute,
});

function AnalyticsRoute() {
  const { roles } = useAuth();
  if (roles.includes("abw_admin") || roles.includes("super_admin")) return <AdminDashboard section="analytics" />;
  if (roles.includes("organiser")) return <OrganiserAnalyticsPage />;
  if (roles.includes("sponsor")) return <SponsorAnalyticsPage />;
  if (roles.includes("referral_partner")) return <ReferralDashboard section="analytics" />;
  if (roles.includes("media_partner")) return <MediaPartnerDashboard section="analytics" />;
  throw redirect({ to: "/dashboard" });
}
