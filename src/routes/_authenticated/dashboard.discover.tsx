import { createFileRoute } from "@tanstack/react-router";
import { SponsorDiscoverPage } from "@/components/dashboards/sponsor-pages";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/discover")({
  head: () => ({ meta: [{ title: "Discover - IGE" }] }),
  component: () => (
    <RoleGate allow="sponsor">
      <SponsorDiscoverPage />
    </RoleGate>
  ),
});
