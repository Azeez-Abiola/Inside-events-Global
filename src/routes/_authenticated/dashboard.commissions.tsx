import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/commissions")({
  head: () => ({ meta: [{ title: "Commission tracker - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("referral_partner")) throw redirect({ to: "/dashboard" });
    return <ReferralDashboard section="commissions" />;
  },
});
