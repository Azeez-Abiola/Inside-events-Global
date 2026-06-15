import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";

const search = z.object({
  step: z.enum(["role", "account", "profile"]).optional(),
});

export const Route = createFileRoute("/onboarding")({
  validateSearch: search,
  component: OnboardingRedirect,
});

function OnboardingRedirect() {
  const { step } = useSearch({ from: "/onboarding" });
  return <Navigate to="/signup" search={step ? { step } : undefined} replace />;
}
