import { createFileRoute } from "@tanstack/react-router";
import { DiscoverProductionsPage } from "@/components/productions/production-admin-and-discovery";

export const Route = createFileRoute("/_authenticated/dashboard/discover-productions")({
  head: () => ({ meta: [{ title: "Creative productions - IGE" }] }),
  component: DiscoverProductionsPage,
});
