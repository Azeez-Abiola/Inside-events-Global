import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminNewsletterPanel } from "@/components/dashboards/admin-newsletter-panel";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/newsletter")({
  head: () => ({ meta: [{ title: "Newsletter - IGE Admin" }] }),
  component: AdminNewsletterPage,
});

function AdminNewsletterPage() {
  return (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <AppShell>
        <div className="space-y-6">
          <DashboardHeader
            title="Newsletter"
            subtitle="Manage homepage subscribers and send branded campaign emails."
            breadcrumbs={[
              { label: "Dashboard", to: "/dashboard" },
              { label: "Newsletter" },
            ]}
          />
          <AdminNewsletterPanel />
        </div>
      </AppShell>
    </RoleGate>
  );
}
