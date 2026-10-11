import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * The old gate page. The home page itself now carries the v6.4 structure, so
 * links and bookmarks to /welcome land there.
 */
export const Route = createFileRoute("/welcome")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
});
