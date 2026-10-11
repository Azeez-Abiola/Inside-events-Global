import { createFileRoute } from "@tanstack/react-router";
import { CompliancePage } from "@/components/deliverables/deliverables-page";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/compliance")({
  head: () => ({ meta: [{ title: "Deal compliance - IGE" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <CompliancePage />
    </RoleGate>
  ),
});
