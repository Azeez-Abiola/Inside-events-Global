import { createFileRoute } from "@tanstack/react-router";
import { AdminInboxPage } from "@/components/inbox/admin-inbox-page";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/inbox")({
  head: () => ({ meta: [{ title: "Admin Inbox - IGE" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <AdminInboxPage />
    </RoleGate>
  ),
});
