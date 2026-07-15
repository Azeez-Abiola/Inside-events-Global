import { createFileRoute } from "@tanstack/react-router";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/referrals")({
  head: () => ({ meta: [{ title: "My referrals - IGE" }] }),
  component: () => (
    <RoleGate allow="referral_partner">
      <ReferralDashboard section="links" />
    </RoleGate>
  ),
});
