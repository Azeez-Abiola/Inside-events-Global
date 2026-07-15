import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/revenue")({
  head: () => ({ meta: [{ title: "Revenue & deals - IGE" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <AdminDashboard section="revenue" />
    </RoleGate>
  ),
});
