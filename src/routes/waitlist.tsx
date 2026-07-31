import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { isSignupRole, stashSignupRole } from "@/lib/signup-roles";

const searchSchema = z.object({
  audience: z
    .enum(["organiser", "sponsor", "referral_partner", "media_partner"])
    .optional(),
});

/** Waitlist stage is over — send visitors to signup. */
export const Route = createFileRoute("/waitlist")({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (typeof window !== "undefined" && isSignupRole(search.audience)) {
      stashSignupRole(search.audience);
    }
    throw redirect({
      to: "/signup",
      search: search.audience ? { step: "role" } : {},
      replace: true,
    });
  },
});
