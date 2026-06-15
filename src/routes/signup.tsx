import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignupWizard } from "@/components/signup/signup-wizard";
import type { SignupStep } from "@/lib/signup-roles";

const signupSearch = z.object({
  step: z.enum(["role", "account", "profile"]).optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: signupSearch,
  head: () => ({
    meta: [{ title: "Create your IGE account" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { step } = Route.useSearch();
  return <SignupWizard initialStep={step as SignupStep | undefined} />;
}
