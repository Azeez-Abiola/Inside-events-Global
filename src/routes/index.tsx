import { createFileRoute } from "@tanstack/react-router";
import { HomePage } from "@/components/home/home-page";
import ogImage from "@/assets/og-image.jpg";

/**
 * The public home page (TAB 1). Visitors land here; the marketplace itself is
 * for signed-in users only (v6.4), so the page never depends on it being open.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IGE — Event Sponsorship Marketplace | Find Sponsors & Sponsor B2B Events" },
      {
        name: "description",
        content:
          "Inside Global Events (IGE) is the vetted event sponsorship marketplace. Find sponsors for your event, discover B2B events to sponsor, measure sponsorship ROI, and earn referral commission. Africa, the Middle East, Europe and North America.",
      },
      {
        name: "keywords",
        content:
          "event sponsorship, event sponsorship marketplace, B2B event sponsorship, find event sponsors, sponsor B2B events, corporate event sponsorship, sponsorship ROI, sponsorship packages, sponsorship platform, vetted sponsors, referral commission, Africa Europe events, conference sponsorship",
      },
      { property: "og:title", content: "IGE — The Event Sponsorship Marketplace" },
      {
        property: "og:description",
        content:
          "Find sponsors, sponsor vetted B2B events, and earn referral commission on closed sponsorship deals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.insideglobalevents.com/" },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/" }],
  }),

  component: HomePage,
});
