import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { MarketplaceBrowser } from "@/components/marketplace/marketplace-browser";
import { ensureMarketplaceAccess } from "@/lib/marketplace-visibility";

export const Route = createFileRoute("/marketplace")({
  beforeLoad: () => ensureMarketplaceAccess(),
  head: () => ({
    meta: [
      { title: "Event Sponsorship Marketplace — Browse Vetted B2B Events | IGE" },
      {
        name: "description",
        content:
          "Browse the IGE event sponsorship marketplace. Filter vetted B2B events by sector, audience, country, and format. Find sponsorship opportunities that match your buyers.",
      },
      {
        name: "keywords",
        content:
          "event sponsorship marketplace, sponsorship opportunities, B2B events to sponsor, vetted sponsorship listings, find events to sponsor",
      },
      { property: "og:title", content: "Event Sponsorship Marketplace — IGE" },
      {
        property: "og:description",
        content:
          "Discover IGE-vetted sponsorship opportunities across the Africa–Europe corridor and globally.",
      },
      { property: "og:url", content: "https://www.insideglobalevents.com/marketplace" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/marketplace" }],
  }),
  component: MarketplacePage,
});

function MarketplacePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-6 py-10">
        <MarketplaceBrowser />
      </main>
      <SiteFooter />
    </div>
  );
}
