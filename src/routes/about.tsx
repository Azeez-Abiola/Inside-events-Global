import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Globe2, Handshake, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { AuthSlideshow } from "@/components/auth-shell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About IGE — The Trust Layer for Event Sponsorship" },
      { name: "description", content: "Inside Global Events (IGE) is a vertically integrated event sponsorship marketplace and event intelligence platform built for the Africa–Europe corridor and the global events economy." },
      { name: "keywords", content: "about IGE, event sponsorship marketplace, event intelligence, B2B sponsorship platform, Africa Europe events" },
      { property: "og:title", content: "About IGE — Event Sponsorship Marketplace" },
      { property: "og:description", content: "Commercial infrastructure for B2B event sponsorship: vetted organisers, verified sponsors, accredited referral partners." },
      { property: "og:url", content: "https://www.insideglobalevents.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  const heroRef = useScrollReveal() as React.RefObject<HTMLElement>;
  const pillarsRef = useScrollReveal() as React.RefObject<HTMLElement>;
  const missionRef = useScrollReveal() as React.RefObject<HTMLElement>;
  const ctaRef = useScrollReveal() as React.RefObject<HTMLElement>;

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
        {/* ── Hero ── */}
        <section ref={heroRef as any} className="relative overflow-hidden border-b border-border bg-slate-950 text-white">
          <AuthSlideshow />
          <div className="relative mx-auto max-w-5xl px-6 py-24 md:py-32 z-10">
            <span data-reveal className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-300 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />
              About IGE
            </span>
            <h1 data-reveal data-delay="1" className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl text-white">
              Commercial infrastructure for the{" "}
              <span className="text-brand-gradient">global events economy.</span>
            </h1>
            <p data-reveal data-delay="2" className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-200">
              I.G.E (Inside Global Events 2026) is a vertically integrated event
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

        {/* ── Four pillars ── */}
        <section ref={pillarsRef as any} className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div data-reveal className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
              What we are
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Four pillars, one marketplace.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2">
            {pillars.map((p, i) => (
              <article
                key={p.title}
                data-reveal
                data-delay={String(i + 1)}
                className="rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-soft"
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

        {/* ── Mission + Who we serve ── */}
        <section ref={missionRef as any} className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-24">
            <div data-reveal>
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
            <div data-reveal data-delay="2">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                Who we serve
              </div>
              <ul className="mt-5 space-y-4 text-base">
                {[
                  {
                    title: "Event organisers",
                    desc: "From cultural homecomings to global summits, list once and reach the sponsors that actually fit your audience.",
                  },
                  {
                    title: "Brand sponsors",
                    desc: "Discover vetted events your buyers attend, compare tiers, and commit with confidence.",
                  },
                  {
                    title: "Referral partners",
                    desc: "Turn your network into recurring commission with trackable referral links and transparent payouts.",
                  },
                ].map((item, i) => (
                  <li key={item.title} data-reveal data-delay={String(i + 1)}>
                    <span className="font-semibold">{item.title}</span>
                    <span className="block text-sm text-muted-foreground">
                      {item.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section ref={ctaRef as any} className="px-6 py-20 md:py-24">
          <div data-reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand-gradient-diag px-8 py-14 text-white shadow-brand md:px-14 md:py-16">
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
