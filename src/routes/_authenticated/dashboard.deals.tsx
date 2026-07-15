import { createFileRoute } from "@tanstack/react-router";
import { ReferralDashboard } from "@/components/dashboards/referral-dashboard";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/deals")({
  head: () => ({ meta: [{ title: "Commission pipeline - IGE" }] }),
  component: () => (
    <RoleGate allow="referral_partner">
      <ReferralDashboard section="deals" />
    </RoleGate>
  ),
});
