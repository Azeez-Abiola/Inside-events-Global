import { createFileRoute } from "@tanstack/react-router";
import { OrganiserDocumentsPage } from "@/components/dashboards/organiser-pages";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/documents")({
  head: () => ({ meta: [{ title: "Documents - IGE" }] }),
  component: () => (
    <RoleGate allow="organiser">
      <OrganiserDocumentsPage />
    </RoleGate>
  ),
});
