import { createFileRoute } from "@tanstack/react-router";
import { CrmPage } from "@/components/crm/crm-page";

export const Route = createFileRoute("/_authenticated/dashboard/crm")({
  head: () => ({ meta: [{ title: "Contacts & CRM - IGE" }] }),
  component: CrmPage,
});
