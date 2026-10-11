import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { MatchesPageBody } from "@/components/matches/match-notifications-panel";

export const Route = createFileRoute("/_authenticated/dashboard/matches")({
  head: () => ({ meta: [{ title: "Match Notifications - IGE" }] }),
  component: () => (
    <WorkspacePage
      title="Match notifications"
      subtitle="Introductions IGE has reviewed and approved for you, and the meetings to book."
    >
      <MatchesPageBody />
    </WorkspacePage>
  ),
});
