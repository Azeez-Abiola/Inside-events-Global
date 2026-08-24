import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/role-gate";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";

export const Route = createFileRoute("/_authenticated/dashboard/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace - IGE" }] }),
  component: () => (
    <RoleGate allow="organiser">
      <WorkspacePage
        title="Marketplace"
        subtitle="Browse vetted B2B events on the IGE marketplace — stay inside your organiser workspace."
      >
        <MarketplaceBrowser showTitle={false} enableReveal={false} />
      </WorkspacePage>
    </RoleGate>
  ),
});
