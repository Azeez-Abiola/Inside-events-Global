import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminAuditPanel } from "@/components/dashboards/admin-audit-panel";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { SuperAdminGate } from "@/components/super-admin-gate";

export const Route = createFileRoute("/_authenticated/dashboard/audit")({
  head: () => ({ meta: [{ title: "Audit log - IGE" }] }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  return (
    <SuperAdminGate>
      <AppShell>
        <div className="space-y-6">
          <DashboardHeader
            title="Audit log"
            subtitle="Track sub-admin logins and vital platform actions."
            breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Audit log" }]}
          />
          <AdminAuditPanel />
        </div>
      </AppShell>
    </SuperAdminGate>
  );
}
