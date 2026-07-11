import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { AdminWaitlistPanel } from "@/components/dashboards/admin-waitlist-panel";
import { DashboardHeader } from "@/components/dashboards/dashboard-shell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/waitlist")({
  head: () => ({ meta: [{ title: "Waitlist - IGE Admin" }] }),
  component: AdminWaitlistPage,
});

function AdminWaitlistPage() {
  const { roles } = useAuth();
  if (!roles.includes("abw_admin") && !roles.includes("super_admin")) throw redirect({ to: "/dashboard" });

  return (
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
  );
}
