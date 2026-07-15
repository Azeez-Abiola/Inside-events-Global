import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminWaitlistPanel } from "@/components/dashboards/admin-waitlist-panel";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/waitlist")({
  head: () => ({ meta: [{ title: "Waitlist - IGE Admin" }] }),
  component: AdminWaitlistPage,
});

function AdminWaitlistPage() {
  return (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <AppShell>
        <div className="space-y-6">
          <DashboardHeader
            title="Waitlist"
            subtitle="Monitor founding waitlist signups by role. Click any row for full intake details."
            breadcrumbs={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Waitlist" },
            ]}
          />
          <AdminWaitlistPanel />
        </div>
      </AppShell>
    </RoleGate>
  );
}
