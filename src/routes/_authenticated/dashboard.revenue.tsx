import { createFileRoute, redirect } from "@tanstack/react-router";
import { AdminDashboard } from "@/components/dashboards/admin-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/revenue")({
  head: () => ({ meta: [{ title: "Revenue & deals - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("abw_admin") && !roles.includes("super_admin")) throw redirect({ to: "/dashboard" });
    return <AdminDashboard section="revenue" />;
  },
});
