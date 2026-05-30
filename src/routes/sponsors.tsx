import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Globe2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/sponsors")({
  head: () => ({
    meta: [
      { title: "For Sponsors · IGE" },
      {
        name: "description",
        content:
          "Discover vetted B2B events your buyers are already attending. Search a curated catalogue, compare tiers, and commit with confidence.",
      },
      { property: "og:title", content: "For Sponsors · IGE" },
      {
        property: "og:description",
        content:
          "Discover vetted B2B events your buyers are already attending.",
      },
    ],
  }),
  component: SponsorsPage,
});

function SponsorsPage() {
  const bullets = [
    "Every event manually IGE-vetted before going live",
    "Side-by-side comparison of tiers, audience and ROI signals",
    "Direct messaging with verified organisers",
    "Saved searches and shortlists",
    "Secure structured commitment forms",
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
            <Globe2 className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Sponsors
          </span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-6xl">
          Discover events <span className="text-brand-gradient">your buyers are already attending.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Search a curated catalogue of vetted B2B events worldwide. Filter by
          audience seniority, sector, geography, and budget, then commit with
          confidence.
        </p>
        <ul className="mt-10 space-y-4">
          {bullets.map((b) => (
            <li key={b} className="flex gap-3 text-base">
              <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
          >
            Browse events
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Create sponsor account
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
