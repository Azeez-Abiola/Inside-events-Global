import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  SponsorCommitmentsPage, SponsorSavedPage, SponsorDiscoverPage, SponsorAnalyticsPage,
} from "@/components/dashboards/sponsor-pages";
import { useAuth } from "@/lib/auth-context";

function requireRole(roles: string[], allowed: string[]) {
  if (!allowed.some((r) => roles.includes(r))) throw redirect({ to: "/dashboard" });
}

export const Route = createFileRoute("/_authenticated/dashboard/commitments")({
  head: () => ({ meta: [{ title: "My commitments - IGE" }] }),
  component: () => { const { roles } = useAuth(); requireRole(roles, ["sponsor"]); return <SponsorCommitmentsPage />; },
});
