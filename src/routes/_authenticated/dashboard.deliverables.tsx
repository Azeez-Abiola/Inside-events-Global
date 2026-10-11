import { createFileRoute } from "@tanstack/react-router";
import { DeliverablesPage } from "@/components/deliverables/deliverables-page";

export const Route = createFileRoute("/_authenticated/dashboard/deliverables")({
  head: () => ({ meta: [{ title: "Deliverable Matrix - IGE" }] }),
  component: DeliverablesPage,
});
