import { createFileRoute } from "@tanstack/react-router";
import { MatchQueuePage } from "@/components/matches/match-queue-page";
import { RoleGate } from "@/components/role-gate";

export const Route = createFileRoute("/_authenticated/dashboard/match-queue")({
  head: () => ({ meta: [{ title: "Match Approval Queue - IGE" }] }),
  component: () => (
    <RoleGate allow={["abw_admin", "super_admin"]}>
      <MatchQueuePage />
    </RoleGate>
  ),
});
