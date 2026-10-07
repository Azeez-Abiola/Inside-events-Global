import { createFileRoute } from "@tanstack/react-router";
import { ActivationPage } from "@/components/activations/activation-page";

export const Route = createFileRoute("/_authenticated/dashboard/activations")({
  head: () => ({ meta: [{ title: "Activations - IGE" }] }),
  component: ActivationPage,
});
