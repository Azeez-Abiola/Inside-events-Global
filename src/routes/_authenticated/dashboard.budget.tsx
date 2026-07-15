import { createFileRoute } from "@tanstack/react-router";
import { SponsorBudgetPage } from "@/components/dashboards/sponsor-pages";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/budget")({
  head: () => ({ meta: [{ title: "Sponsorship budget - IGE" }] }),
  component: () => (
    <RoleGate allow="sponsor">
      <SponsorBudgetPage />
    </RoleGate>
  ),
});
