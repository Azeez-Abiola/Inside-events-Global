import { createFileRoute } from "@tanstack/react-router";
import { SponsorCommitmentsPage } from "@/components/dashboards/sponsor-pages";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/commitments")({
  head: () => ({ meta: [{ title: "My commitments - IGE" }] }),
  component: () => (
    <RoleGate allow="sponsor">
      <SponsorCommitmentsPage />
    </RoleGate>
  ),
});
