import { createFileRoute, redirect } from "@tanstack/react-router";
import { SponsorDiscoverPage } from "@/components/dashboards/sponsor-pages";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard/discover")({
  head: () => ({ meta: [{ title: "Discover - IGE" }] }),
  component: () => {
    const { roles } = useAuth();
    if (!roles.includes("sponsor")) throw redirect({ to: "/dashboard" });
    return <SponsorDiscoverPage />;
  },
});
