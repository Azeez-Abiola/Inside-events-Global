import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Megaphone } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/organisers")({
  head: () => ({
    meta: [
      { title: "Find Event Sponsors — List Your B2B Event on IGE" },
      {
        name: "description",
        content:
          "Find event sponsors fast. List your B2B event on IGE's vetted sponsorship marketplace, build sponsorship packages, pitch verified corporate sponsors, and close sponsorship deals. Zero listing fees.",
      },
      {
        name: "keywords",
        content:
          "find event sponsors, how to get event sponsorship, list your event for sponsorship, sponsorship packages, sponsorship proposal, attract sponsors, event sponsorship platform for organisers",
      },
      { property: "og:title", content: "Find Event Sponsors — IGE for Organisers" },
      { property: "og:description", content: "List your B2B event and reach verified sponsors actively looking for your audience." },
      { property: "og:url", content: "https://www.insideglobalevents.com/organisers" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/organisers" }],
  }),
  component: OrganisersPage,
});

function OrganisersPage() {
  const bullets = [
    "Guided event submission with auto-save drafts",
    "Sponsorship tiers, decks, floor plans, all in one place",
    "Optional IGE-managed sales if you want a hands-off run",
    "Direct messaging with verified sponsors",
    "Commission only, no listing fees",
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Organisers
          </span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-6xl">
          List once. <span className="text-brand-gradient">Reach every sponsor who matters.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Build a complete sponsorship pack in a guided 9-step flow. Once
          IGE-vetted, your event is surfaced to verified sponsors and partners
          actively looking for your audience.
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
            to="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
          >
            List your event
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            How it works
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
