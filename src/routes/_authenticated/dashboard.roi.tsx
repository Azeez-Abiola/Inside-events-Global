import { createFileRoute } from "@tanstack/react-router";
import { RoiPage } from "@/components/roi/roi-page";

export const Route = createFileRoute("/_authenticated/dashboard/roi")({
  head: () => ({ meta: [{ title: "Sponsorship ROI - IGE" }] }),
  component: RoiPage,
});
