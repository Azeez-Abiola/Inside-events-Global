import { createFileRoute } from "@tanstack/react-router";
import { HelpGapsPage } from "@/components/support/help-gaps-page";

export const Route = createFileRoute("/_authenticated/dashboard/help-gaps")({
  head: () => ({ meta: [{ title: "Help content gaps - IGE Admin" }] }),
  component: HelpGapsPage,
});
