import { createFileRoute } from "@tanstack/react-router";
import { PaymentsPage } from "@/components/payments/payments-page";

export const Route = createFileRoute("/_authenticated/dashboard/payments")({
  head: () => ({ meta: [{ title: "Vendors & Payments - IGE" }] }),
  component: PaymentsPage,
});
