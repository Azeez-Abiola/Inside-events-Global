import { createFileRoute, redirect } from "@tanstack/react-router";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  head: () => ({ meta: [{ title: "My referrals - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("referral_partner")) throw redirect({ to: "/dashboard" });
    return <ReferralDashboard section="links" />;
  },
});
