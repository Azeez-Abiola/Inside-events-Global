import { createFileRoute } from "@tanstack/react-router";
import { RoleSelectionScreen } from "@/components/onboarding/role-selection";

export const Route = createFileRoute("/onboarding/role")({
  head: () => ({ meta: [{ title: "Choose your role — IGE" }] }),
  component: RoleSelectionScreen,
});
