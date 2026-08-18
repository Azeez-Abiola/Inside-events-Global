import { createFileRoute } from "@tanstack/react-router";
import { PendingApprovalScreen } from "@/components/onboarding/pending-approval";

export const Route = createFileRoute("/onboarding/pending")({
  head: () => ({ meta: [{ title: "Application pending — IGE" }] }),
  component: PendingApprovalScreen,
});
