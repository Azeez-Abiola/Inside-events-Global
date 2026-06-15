import { createFileRoute } from "@tanstack/react-router";
import { MediaPartnerDashboard } from "@/components/dashboards/media-dashboard";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/requests")({
  head: () => ({ meta: [{ title: "My requests - IGE" }] }),
  component: () => (
    <RoleGate allow="media_partner">
      <MediaPartnerDashboard section="requests" />
    </RoleGate>
  ),
});
