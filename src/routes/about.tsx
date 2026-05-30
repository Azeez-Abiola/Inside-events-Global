import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Handshake, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About IGE · Inside Global Events" },
      {
        name: "description",
        content:
          "Inside Global Events (IGE) is a vertically integrated event intelligence and sponsorship marketplace built for the Africa-Europe corridor and the global events economy.",
      },
      { property: "og:title", content: "About IGE · Inside Global Events" },
      {
        property: "og:description",
        content:
          "End-to-end commercial infrastructure connecting event organisers, brand sponsors, and a distributed network of partnerships professionals.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const pillars = [
    {
      icon: Globe2,
      title: "Africa-Europe corridor",
      desc:
        "Purpose built for the trade, capital, and culture flows between Africa and Europe, then extended to the wider global events economy.",
    },
    {
      icon: ShieldCheck,
      title: "Event intelligence",
      desc:
        "We structure sponsorship deals with data: audience, seniority, sector fit, ROI signals, and verified track record, not glossy decks.",
    },
    {
      icon: Handshake,
      title: "Sponsorship marketplace",
      desc:
        "A live two-sided marketplace where vetted organisers meet verified sponsors and actually close commercial deals.",
    },
    {
      icon: TrendingUp,
      title: "Partner network",
      desc:
        "A distributed network of partnerships professionals who source, introduce, and close sponsorships, earning transparent commission on every deal.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--gradient-brand-diag)" }}
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              About IGE
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Commercial infrastructure for the{" "}
              <span className="text-brand-gradient">global events economy.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              I.G.E (Inside Global Events) is a vertically integrated event
              intelligence and sponsorship marketplace platform built for the
              Africa to Europe corridor and the global events economy. It is not
              another event listing directory. It is end-to-end commercial
              infrastructure that connects event organisers with brand sponsors,
              structures deals with data, and monetises every stage of the
              sponsorship lifecycle, including empowering a distributed network
              of partnerships professionals to generate deals and earn
              commission.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
              What we are
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Four pillars, one marketplace.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {pillars.map((p) => (
              <article
                key={p.title}
                className="rounded-2xl border border-border bg-card p-7"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
                  <p.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-5 font-display text-xl font-bold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {p.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-24">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                Our mission
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Make B2B sponsorship a vetted, data-led market.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Sponsorship is one of the largest line items in B2B marketing,
                yet it still runs on cold inbound, inflated decks, and broker
                handshakes. IGE rebuilds that market: every event vetted, every
                sponsor verified, every partner accountable, every deal tracked.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                Who we serve
              </div>
              <ul className="mt-5 space-y-4 text-base">
                <li>
                  <span className="font-semibold">Event organisers</span>
                  <span className="block text-sm text-muted-foreground">
                    From cultural homecomings to global summits, list once and
                    reach the sponsors that actually fit your audience.
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Brand sponsors</span>
                  <span className="block text-sm text-muted-foreground">
                    Discover vetted events your buyers attend, compare tiers,
                    and commit with confidence.
                  </span>
                </li>
                <li>
                  <span className="font-semibold">Referral partners</span>
                  <span className="block text-sm text-muted-foreground">
                    Turn your network into recurring commission with trackable
                    referral links and transparent payouts.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand-gradient-diag px-8 py-14 text-white shadow-brand md:px-14 md:py-16">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              Join the marketplace.
            </h2>
            <p className="mt-4 max-w-2xl text-base opacity-90 md:text-lg">
              Organisers, sponsors and partners are already working inside IGE.
              Zero listing fees. Vetted from day one.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-primary-deep transition-transform hover:-translate-y-0.5"
              >
                Create your account
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="mailto:Hi@insideglobalevents.com"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                Talk to the team
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
