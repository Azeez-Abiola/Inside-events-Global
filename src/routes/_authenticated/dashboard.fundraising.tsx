import { createFileRoute } from "@tanstack/react-router";
import { FundraisingPage } from "@/components/fundraising/fundraising-page";

export const Route = createFileRoute("/_authenticated/dashboard/fundraising")({
  head: () => ({ meta: [{ title: "Fundraising Tracker - IGE" }] }),
  component: FundraisingPage,
});
