import { createFileRoute } from "@tanstack/react-router";
import { ReadinessPage } from "@/components/readiness/readiness-page";

export const Route = createFileRoute("/_authenticated/dashboard/readiness")({
  head: () => ({ meta: [{ title: "Brand-Readiness Coach - IGE" }] }),
  component: ReadinessPage,
});
