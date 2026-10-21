import { createFileRoute } from "@tanstack/react-router";
import { RoleGate } from "@/components/role-gate";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";

export const Route = createFileRoute("/_authenticated/dashboard/marketplace")({
  head: () => ({ meta: [{ title: "Marketplace - IGE" }] }),
  component: () => (
    <RoleGate allow={["organiser", "abw_admin", "super_admin"]}>
      <WorkspacePage
        title="Marketplace"
        subtitle="Browse vetted B2B events on the IGE marketplace without leaving your dashboard."
      >
        <MarketplaceBrowser showTitle={false} enableReveal={false} />
      </WorkspacePage>
    </RoleGate>
  ),
});
