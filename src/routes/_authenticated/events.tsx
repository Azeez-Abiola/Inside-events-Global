import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout route for /events. Renders the child route:
//   /events       -> events.index.tsx (My events list)
//   /events/$id   -> events.$id.tsx   (9-step event editor)
export const Route = createFileRoute("/_authenticated/events")({
  component: () => <Outlet />,
});
