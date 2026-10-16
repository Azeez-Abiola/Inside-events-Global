import { createFileRoute, Navigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";

const search = z.object({
  step: z.enum(["role", "account", "profile"]).optional(),
});

// An index route, not a layout: as `onboarding.tsx` this component was the
// parent of every /onboarding/* page and rendered a redirect to /signup
// instead of an <Outlet />, so /onboarding/role and /onboarding/wizard could
// never be reached — signup sent people to onboarding, onboarding sent them
// straight back, and the page sat on "Loading…" forever.
export const Route = createFileRoute("/onboarding/")({
  validateSearch: search,
  component: OnboardingRedirect,
});

function OnboardingRedirect() {
  const { step } = useSearch({ from: "/onboarding/" });
  return <Navigate to="/signup" search={step ? { step } : undefined} replace />;
}
