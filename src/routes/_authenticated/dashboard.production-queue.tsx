import { createFileRoute } from "@tanstack/react-router";
import { ProductionQueuePage } from "@/components/productions/production-admin-and-discovery";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/production-queue")({
  head: () => ({ meta: [{ title: "Production vetting - IGE" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <ProductionQueuePage />
    </RoleGate>
  ),
});
