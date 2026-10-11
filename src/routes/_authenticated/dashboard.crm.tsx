import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CrmPage } from "@/components/crm/crm-page";

export const Route = createFileRoute("/_authenticated/dashboard/crm")({
  // Deep links into a tab, e.g. the Partnerships Pro nav's Outreach Tracker.
  validateSearch: z.object({
    tab: z.enum(["pipeline", "contacts", "companies", "outreach", "commission"]).optional(),
  }),
  head: () => ({ meta: [{ title: "Contacts & CRM - IGE" }] }),
  component: CrmRoute,
});

function CrmRoute() {
  const { tab } = Route.useSearch();
  // Keyed so following a nav link to another tab resets the page to it.
  return <CrmPage key={tab ?? "pipeline"} initialTab={tab} />;
}
