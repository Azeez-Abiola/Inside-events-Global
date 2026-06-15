import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/submissions")({
  head: () => ({ meta: [{ title: "Submissions - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("abw_admin") && !roles.includes("super_admin")) throw redirect({ to: "/dashboard" });
    return <AdminDashboard section="submissions" />;
  },
});
