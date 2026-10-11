import { createFileRoute } from "@tanstack/react-router";
import { ReportsPage } from "@/components/reports/reports-page";

export const Route = createFileRoute("/_authenticated/dashboard/reports")({
  head: () => ({ meta: [{ title: "Reports - IGE" }] }),
  component: ReportsPage,
});
