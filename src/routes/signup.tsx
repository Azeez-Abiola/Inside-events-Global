import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { SignupWizard } from "@/components/signup/signup-wizard";
import type { SignupStep } from "@/lib/signup-roles";

const signupSearch = z.object({
  step: z.enum(["role", "account", "verify", "profile"]).optional(),
  /** Pre-selects a role card, e.g. List Your Event → organiser (TAB 1 §1.2). */
  role: z.string().max(40).optional(),
  /** Where the visitor was heading — the marketplace, a share link. */
  next: z.string().max(500).optional(),
});

export const Route = createFileRoute("/signup")({
  validateSearch: signupSearch,
  head: () => ({
    meta: [{ title: "Create your IGE account" }],
  }),
  component: SignupPage,
});

function SignupPage() {
  const { step, role, next } = Route.useSearch();
  return (
    <SignupWizard
      initialStep={step as SignupStep | undefined}
      presetRole={role}
      returnTo={next}
    />
  );
}
