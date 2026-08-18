import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/onboarding-vetting")({
  head: () => ({ meta: [{ title: "Onboarding vetting — IGE Admin" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <AdminDashboard section="onboarding" />
    </RoleGate>
  ),
});
