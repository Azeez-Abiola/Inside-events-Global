import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminTeamPanel } from "@/components/dashboards/admin-team-panel";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { SuperAdminGate } from "@/components/super-admin-gate";

export const Route = createFileRoute("/_authenticated/dashboard/team")({
  head: () => ({ meta: [{ title: "Admin team - IGE" }] }),
  component: AdminTeamPage,
});

function AdminTeamPage() {
  return (
    <SuperAdminGate>
      <AppShell>
        <div className="space-y-6">
          <DashboardHeader
            title="Admin team"
            subtitle="Invite sub-admins and review what they can access on the platform."
            breadcrumbs={[{ label: "Dashboard", to: "/dashboard" }, { label: "Admin team" }]}
          />
          <AdminTeamPanel />
        </div>
      </AppShell>
    </SuperAdminGate>
  );
}
