import { createFileRoute, redirect } from "@tanstack/react-router";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/requests")({
  head: () => ({ meta: [{ title: "My requests - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("media_partner")) throw redirect({ to: "/dashboard" });
    return <MediaPartnerDashboard section="requests" />;
  },
});
