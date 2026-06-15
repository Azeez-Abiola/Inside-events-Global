import { createFileRoute } from "@tanstack/react-router";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/explore")({
  head: () => ({ meta: [{ title: "Explore - IGE" }] }),
  component: () => (
    <RoleGate allow="media_partner">
      <MediaPartnerDashboard section="explore" />
    </RoleGate>
  ),
});
