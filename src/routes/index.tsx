import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Globe2,
  Handshake,
  Megaphone,
  Users,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Calendar,
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import ogImage from "@/assets/og-image.jpg";
import featuredImg from "@/assets/featured-itsekiri.png";

export const Route = createFileRoute("/")(({
  head: () => ({
    meta: [
      { title: "IGE — Event Sponsorship Marketplace | Find Sponsors & Sponsor B2B Events" },
      {
        name: "description",
        content:
          "Inside Global Events (IGE) is the vetted event sponsorship marketplace. Find sponsors for your event, discover B2B events to sponsor, measure sponsorship ROI, and earn referral commission. Africa–Europe corridor and global.",
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

  component: Landing,
} as any));

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Stats />
        <MarketplacePreview />
        <ThreeSides />
        <HowItWorks />
        <Trust />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

function MarketplacePreview() {
  const fetchEvents = useServerFn(listMarketplaceEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-preview"],
    queryFn: () => fetchEvents({ data: { vetted_only: false, sort: "newest", per_page: 6 } }),
  });
  const events = data?.events ?? [];
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;

  return (
    <section ref={ref as any} className="border-t border-border/60 bg-muted/20 py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div data-reveal className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-primary-deep">
              <ShieldCheck className="h-3.5 w-3.5" /> The Marketplace
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Vetted events looking for your brand.
            </h2>
            <p className="mt-2 max-w-xl text-muted-foreground">
              Browse IGE-vetted sponsorship opportunities. Filter by sector, audience, and budget — no login needed.
            </p>
          </div>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold hover:bg-muted"
          >
            View full marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl bg-muted" />
              ))
            : events.slice(0, 6).map((e: any, i: number) => (
                <Link
                  key={e.id}
                  to="/events/$slug"
                  params={{ slug: e.slug }}
                  data-reveal
                  data-delay={String(Math.min(i + 1, 6))}
                  className="group block overflow-hidden rounded-xl border border-border bg-card transition-all hover:-translate-y-0.5 hover:shadow-lg"
                  style={{ borderLeft: "4px solid hsl(var(--primary))" }}
                >
                  <div className="relative aspect-video bg-muted">
                    {e.banner_image_url ? (
                      <img loading="lazy" src={e.banner_image_url} alt={e.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-soft to-muted text-muted-foreground">
                        <Calendar className="h-10 w-10" />
                      </div>
                    )}
                    {e.ige_vetted && (
                      <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-1 text-[10px] font-bold uppercase text-white shadow">
                        <ShieldCheck className="h-3 w-3" /> Vetted
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-2 inline-flex rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-semibold text-primary-deep">
                      {e.event_type ?? "Event"}
                    </div>
                    <h3 className="line-clamp-2 font-display text-base font-bold leading-tight">{e.name}</h3>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{e.city ?? "-"}, {e.country ?? "-"}</span>
                      {e.start_date && <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(e.start_date).toLocaleDateString()}</span>}
                    </div>
                    {e.attendance_size && (
                      <div className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />{Number(e.attendance_size).toLocaleString()}+ attendees
                      </div>
                    )}
                  </div>
                </Link>
              ))}
        </div>

        {!isLoading && events.length === 0 && (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
            No events listed yet. Check back soon — or <Link to="/signup" className="text-primary hover:underline">list yours</Link>.
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;

  return (
    <section ref={ref as any} className="relative overflow-hidden">
      {/* ambient gradient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
        style={{ background: "var(--gradient-brand-diag)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, oklch(0.55 0.14 162 / 0.6), transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 pt-20 pb-24 md:pt-28 md:pb-32">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-7">
            <span data-reveal data-delay="1" className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Now live · Vetted events · Verified sponsors
            </span>

            <h1 data-reveal data-delay="2" className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Where B2B events
              <br />
              <span className="text-brand-gradient">actually get sponsored.</span>
            </h1>

            <p data-reveal data-delay="3" className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              IGE is the vetted marketplace connecting event organisers, brand
              sponsors, and trusted referral partners. List your event, find your
              audience, get paid, without the spreadsheets, cold inbound, or
              broker noise.
            </p>

            <div data-reveal data-delay="4" className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="group inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
              >
                List your event
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/marketplace"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Browse sponsorships
              </Link>
            </div>

            <div data-reveal data-delay="5" className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <Badge icon={ShieldCheck}>Every event IGE-vetted</Badge>
              <Badge icon={Globe2}>Global · 40+ markets</Badge>
              <Badge icon={Handshake}>Commission only, no listing fees</Badge>
            </div>
          </div>

          {/* Visual card cluster */}
          <div data-reveal data-delay="3" className="relative lg:col-span-5">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function Badge({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4 text-secondary" />
      {children}
    </span>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
      {/* main featured event card */}
      <div className="absolute inset-0 rotate-[-2deg] overflow-hidden rounded-2xl border border-border bg-card shadow-brand">
        <div className="relative h-44 w-full overflow-hidden">
          <img
            src={featuredImg}
            alt="Itsekiri Global HomeComing 2026"
            className="h-full w-full object-cover"
          />
          <div className="absolute left-3 top-3 inline-flex items-center rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white backdrop-blur">
            Featured
          </div>
        </div>
        <div className="p-5">
          <div className="font-display text-lg font-bold leading-tight">
            Itsekiri Global HomeComing 2026
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Warri Kingdom, Delta State · 17 to 21 Aug 2026
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Attendance</div>
              <div className="font-semibold">20,000+ expected</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-muted-foreground">From</div>
              <div className="font-semibold">₦5,000,000</div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary-deep">
              <ShieldCheck className="h-3 w-3" /> IGE Vetted
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-deep">
              Royal Patronage
            </span>
          </div>
        </div>
      </div>

      {/* floating mini cards */}
      <div className="absolute -bottom-6 -left-6 w-56 rotate-[4deg] rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/15 text-secondary-deep">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Deal closed</div>
            <div className="text-sm font-semibold">+₦18,000,000</div>
          </div>
        </div>
      </div>

      <div className="absolute -top-4 -right-4 w-52 -rotate-[5deg] rounded-xl border border-border bg-card p-4 shadow-soft">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary-deep">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground">New inquiry</div>
            <div className="text-sm font-semibold">Verified sponsor</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Stats ---------------- */

function Stats() {
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;
  const stats = [
    { v: "100%", l: "of events vetted before going live" },
    { v: "40+", l: "markets, from Paris to Dubai to Singapore" },
    { v: "Zero", l: "listing fees, we earn when you do" },
  ];
  return (
    <section ref={ref as any} className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-12 md:grid-cols-3">
        {stats.map((s, i) => (
          <div key={s.l} data-reveal data-delay={String(i + 1)}>
            <div className="font-display text-3xl font-bold text-brand-gradient md:text-4xl">
              {s.v}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------------- Three sides ---------------- */

function ThreeSides() {
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;
  const sides = [
    {
      id: "organisers",
      tag: "Organisers",
      icon: Megaphone,
      title: "List once. Reach every sponsor who matters.",
      desc:
        "Build a complete sponsorship pack in a guided 9-step flow. Once IGE-vetted, your event is surfaced to verified sponsors and partners actively looking for your audience.",
      bullets: [
        "Guided event submission with auto-save drafts",
        "Sponsorship tiers, decks, floor plans, all in one place",
        "Optional IGE-managed sales if you want a hands-off run",
      ],
      cta: "List your event",
      to: "/signup" as const,
    },
    {
      id: "sponsors",
      tag: "Sponsors",
      icon: Globe2,
      title: "Discover events your buyers are already attending.",
      desc:
        "Search a curated catalogue of vetted B2B events worldwide. Filter by audience seniority, sector, geography, and budget, then commit with confidence.",
      bullets: [
        "Every event manually IGE-vetted before going live",
        "Side-by-side comparison of tiers, audience and ROI signals",
        "Direct messaging with verified organisers",
      ],
      cta: "Browse events",
      to: "/marketplace" as const,
    },
    {
      id: "partners",
      tag: "Referral Partners",
      icon: Handshake,
      title: "Turn your network into recurring commission.",
      desc:
        "If you know the brands who sponsor in your sector, IGE pays you for the intro. Generate unique referral links, track deals, and earn transparent commission on every closed sponsorship.",
      bullets: [
        "Personal referral links per event, trackable end-to-end",
        "Tiered commission, paid in your preferred currency",
        "IGB Partner badge once you close your first deal",
      ],
      cta: "Become a partner",
      to: "/signup" as const,
    },
  ];

  return (
    <section ref={ref as any} className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div data-reveal className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
          Built for three sides
        </div>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          One marketplace.{" "}
          <span className="text-brand-gradient">Three ways to win.</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          IGE is not a directory. It's a working marketplace where organisers list,
          sponsors discover, and partners earn, all under one vetted roof.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {sides.map((s, i) => (
          <article
            key={s.id}
            id={s.id}
            data-reveal
            data-delay={String(i + 1)}
            className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-soft"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {s.tag}
              </span>
            </div>

            <h3 className="mt-5 font-display text-2xl font-bold leading-tight">
              {s.title}
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {s.desc}
            </p>

            <ul className="mt-6 space-y-3">
              {s.bullets.map((b) => (
                <li key={b} className="flex gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-secondary" />
                  <span className="text-foreground/85">{b}</span>
                </li>
              ))}
            </ul>

            <Link
              to={s.to}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors group-hover:text-primary-deep"
            >
              {s.cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}

/* ---------------- How it works ---------------- */

function HowItWorks() {
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;
  const steps = [
    {
      n: "01",
      title: "Sign up & verify",
      desc:
        "Pick your side, organiser, sponsor, or referral partner. Verify with your work email or LinkedIn so the marketplace stays clean.",
    },
    {
      n: "02",
      title: "List, browse, or refer",
      desc:
        "Organisers publish events through a guided 9-step flow. Sponsors discover and shortlist. Partners generate trackable referral links.",
    },
    {
      n: "03",
      title: "Get vetted",
      desc:
        "Every event passes IGE's manual vetting before going live. No ghost listings, no fake attendance numbers, no surprises.",
    },
    {
      n: "04",
      title: "Connect & commit",
      desc:
        "Verified sponsors message organisers directly. Commit through structured forms, pay securely, and partners get paid commission on close.",
    },
  ];
  return (
    <section ref={ref as any} id="how" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div data-reveal className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
            How it works
          </div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            From signup to signed sponsorship, in days, not quarters.
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.n}
              data-reveal
              data-delay={String(i + 1)}
              className="relative rounded-2xl border border-border bg-card p-7"
            >
              <div className="font-display text-sm font-bold text-brand-gradient">
                {s.n}
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------------- Trust ---------------- */

function Trust() {
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;
  return (
    <section ref={ref as any} className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div data-reveal>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
            Trust by design
          </div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            Vetted humans.{" "}
            <span className="text-brand-gradient">Verified events.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            We built IGE because B2B sponsorship is full of inflated decks,
            ghost organisers, and brokers chasing finder's fees. So we made
            vetting non-negotiable, for every event, every sponsor, every
            partner on the platform.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Every event manually reviewed by IGE before going live",
              "Sponsor accounts verified via business email + LinkedIn",
              "Referral partners scored on track record and disclosure",
              "Fraud signals monitored continuously, bad actors removed",
            ].map((t, i) => (
              <li key={t} data-reveal data-delay={String(i + 1)} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                <span className="text-foreground/85">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div data-reveal data-delay="2" className="relative">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-gradient text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <div className="font-display text-lg font-bold">IGE-Vetted</div>
                <div className="text-xs text-muted-foreground">
                  Earned, not bought.
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              {[
                ["Identity", "Founder & org verified"],
                ["Track record", "Past editions confirmed"],
                ["Audience", "Attendance & seniority validated"],
                ["Commercials", "Sponsorship pricing reviewed"],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0"
                >
                  <span className="text-muted-foreground">{k}</span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                    <CheckCircle2 className="h-4 w-4 text-secondary" />
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- Final CTA ---------------- */

function FinalCta() {
  const ref = useScrollReveal() as React.RefObject<HTMLElement>;
  return (
    <section ref={ref as any} className="px-6 pb-24">
      <div data-reveal className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-gradient-diag px-8 py-16 text-white shadow-brand md:px-16 md:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.25), transparent 50%)",
          }}
        />
        <div className="relative max-w-2xl">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight md:text-5xl">
            Ready to make your next sponsorship deal a quiet one?
          </h2>
          <p className="mt-5 text-lg opacity-90">
            Join organisers, sponsors and partners already working inside IGE.
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
      </div>
    </section>
  );
}
