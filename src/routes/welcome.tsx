import { createFileRoute } from "@tanstack/react-router";
import { LandingPage, loadLandingEvents } from "@/components/landing/landing-page";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to IGE · Inside Global Events" },
      {
        name: "description",
        content:
          "Create your IGE account. Role-specific onboarding for organisers, sponsors, referral partners, and media partners across the Africa–Europe corridor.",
      },
      { property: "og:title", content: "Welcome to Inside Global Events" },
      {
        property: "og:description",
        content:
          "Event intelligence + sponsorship marketplace. Vetted events, matched sponsors and tracked deals across the Africa–Europe corridor.",
      },
    ],
  }),
  loader: () => loadLandingEvents(),
  component: WelcomePage,
});

function WelcomePage() {
  return <LandingPage initialEvents={Route.useLoaderData()} />;
}
