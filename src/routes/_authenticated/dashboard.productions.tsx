import { createFileRoute } from "@tanstack/react-router";
import { ProductionsPage } from "@/components/productions/productions-page";

export const Route = createFileRoute("/_authenticated/dashboard/productions")({
  head: () => ({ meta: [{ title: "My Productions - IGE" }] }),
  component: ProductionsPage,
});
