import { createFileRoute } from "@tanstack/react-router";
import { HomeEventsAdminPage } from "@/components/home/home-events-admin";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/home-events")({
  head: () => ({ meta: [{ title: "Home page events - IGE" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <HomeEventsAdminPage />
    </RoleGate>
  ),
});
