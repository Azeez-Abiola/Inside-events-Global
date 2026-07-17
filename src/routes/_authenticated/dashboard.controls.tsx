import { createFileRoute } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { SuperAdminGate } from "@/components/super-admin-gate";

export const Route = createFileRoute("/_authenticated/dashboard/controls")({
  head: () => ({ meta: [{ title: "Fraud & rates - IGE" }] }),
  component: () => (
    <SuperAdminGate>
      <AdminDashboard section="controls" />
    </SuperAdminGate>
  ),
});
