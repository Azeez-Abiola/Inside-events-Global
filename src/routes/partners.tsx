import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, Handshake } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/partners")({
  head: () => ({
    meta: [
      { title: "Referral Partners · IGE" },
      {
        name: "description",
        content:
          "Turn your network into recurring commission. Generate trackable referral links, close sponsorships, and earn transparent commission.",
      },
      { property: "og:title", content: "Referral Partners · IGE" },
      {
        property: "og:description",
        content:
          "Turn your network into recurring commission with IGE.",
      },
    ],
  }),
  component: PartnersPage,
});

function PartnersPage() {
  const bullets = [
    "Personal referral links per event, trackable end to end",
    "Tiered commission, paid in your preferred currency",
    "IGE Partner badge once you close your first deal",
    "Transparent dashboard of clicks, conversions and payouts",
    "Fraud protection baked in",
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
            <Handshake className="h-5 w-5 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Referral Partners
          </span>
        </div>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-6xl">
          Turn your network into <span className="text-brand-gradient">recurring commission.</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          If you know the brands who sponsor in your sector, IGE pays you for
          the intro. Generate unique referral links, track deals, and earn
          transparent commission on every closed sponsorship.
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
            Become a partner
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
