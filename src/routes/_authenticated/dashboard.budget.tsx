import { createFileRoute, redirect } from "@tanstack/react-router";
import { SponsorBudgetPage } from "@/components/dashboards/sponsor-pages";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/budget")({
  head: () => ({ meta: [{ title: "Sponsorship budget - IGE" }] }),
  component: () => {
    const { roles, loading } = useAuth();
    if (loading) return null;
    if (!roles.includes("sponsor")) throw redirect({ to: "/dashboard" });
    return <SponsorBudgetPage />;
  },
});
