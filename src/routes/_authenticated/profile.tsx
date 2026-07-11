import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { ProfilePage } from "@/components/profile/profile-page";

const searchSchema = z.object({
  tab: z.enum(["general", "role", "security"]).optional(),
});

export const Route = createFileRoute("/_authenticated/profile")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "Profile - IGE" }],
  }),
  component: ProfileRoute,
});

function ProfileRoute() {
  const { tab } = Route.useSearch();
  return (
    <AppShell>
      <ProfilePage initialTab={tab ?? "general"} />
    </AppShell>
  );
}
