import { createFileRoute, Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import ogImage from "@/assets/og-image.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IGE — The vetted marketplace for B2B event sponsorships" },
      {
        name: "description",
        content:
          "Inside Global Events connects vetted B2B event organisers, sponsors, and trusted referral partners. Discover sponsorship opportunities, close deals, and grow revenue — without the noise.",
      },
      { property: "og:title", content: "IGE — Inside Global Events" },
      {
        property: "og:description",
        content:
          "The vetted marketplace where B2B event organisers, sponsors, and referral partners actually close deals.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: ogImage },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ogImage },
    ],
  }),

  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Stats />
        <ThreeSides />
        <HowItWorks />
        <Trust />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ---------------- Hero ---------------- */

function Hero() {
  return (
    <section className="relative overflow-hidden">
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
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Now live · Vetted events · Verified sponsors
            </span>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Where B2B events
              <br />
              <span className="text-brand-gradient">actually get sponsored.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              IGE is the vetted marketplace connecting event organisers, brand
              sponsors, and trusted referral partners. List your event, find your
              audience, get paid — without the spreadsheets, cold inbound, or
              broker noise.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                to="/"
                className="group inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
              >
                List your event
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Browse sponsorships
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
              <Badge icon={ShieldCheck}>Every event IGE-vetted</Badge>
              <Badge icon={Globe2}>Global · 40+ markets</Badge>
              <Badge icon={Handshake}>Commission only — no listing fees</Badge>
            </div>
          </div>

          {/* Visual card cluster */}
          <div className="relative lg:col-span-5">
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
      <div className="absolute inset-0 rotate-[-2deg] rounded-2xl border border-border bg-card p-5 shadow-brand">
        <div className="flex h-40 w-full items-center justify-center rounded-xl bg-brand-gradient-diag text-white">
          <div className="text-center">
            <div className="text-xs uppercase tracking-[0.2em] opacity-80">Featured</div>
            <div className="mt-1 font-display text-2xl font-bold">Global FinTech Summit</div>
            <div className="mt-1 text-xs opacity-80">London · 12–14 Oct 2026</div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Attendance</div>
            <div className="font-semibold">3,200 senior buyers</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-muted-foreground">From</div>
            <div className="font-semibold">$25,000</div>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary-deep">
            <ShieldCheck className="h-3 w-3" /> IGE Vetted
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-deep">
            ABW Managed
          </span>
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
            <div className="text-sm font-semibold">+$42,000</div>
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
  const stats = [
    { v: "100%", l: "of events vetted before going live" },
    { v: "40+", l: "markets, from London to Dubai to Singapore" },
    { v: "0", l: "listing fees — we earn when you do" },
    { v: "72h", l: "median time from listing to first sponsor inquiry" },
  ];
  return (
    <section className="border-y border-border bg-muted/30">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        {stats.map((s) => (
          <div key={s.l}>
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
        "Sponsorship tiers, decks, floor plans — all in one place",
        "Optional ABW-managed sales if you want a hands-off run",
      ],
      cta: "List your event",
    },
    {
      id: "sponsors",
      tag: "Sponsors",
      icon: Globe2,
      title: "Discover events your buyers are already attending.",
      desc:
        "Search a curated catalogue of vetted B2B events worldwide. Filter by audience seniority, sector, geography, and budget — then commit with confidence.",
      bullets: [
        "Every event manually IGE-vetted before going live",
        "Side-by-side comparison of tiers, audience and ROI signals",
        "Direct messaging with verified organisers",
      ],
      cta: "Browse events",
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
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
          Built for three sides
        </div>
        <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
          One marketplace.{" "}
          <span className="text-brand-gradient">Three ways to win.</span>
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          IGE is not a directory. It's a working marketplace where organisers list,
          sponsors discover, and partners earn — all under one vetted roof.
        </p>
      </div>

      <div className="mt-14 grid gap-6 lg:grid-cols-3">
        {sides.map((s) => (
          <article
            key={s.id}
            id={s.id}
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
              to="/"
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
  const steps = [
    {
      n: "01",
      title: "Sign up & verify",
      desc:
        "Pick your side — organiser, sponsor, or referral partner. Verify with your work email or LinkedIn so the marketplace stays clean.",
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
    <section id="how" className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-24 md:py-32">
        <div className="max-w-2xl">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
            How it works
          </div>
          <h2 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-5xl">
            From signup to signed sponsorship — in days, not quarters.
          </h2>
        </div>

        <ol className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => (
            <li
              key={s.n}
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
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 md:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
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
            vetting non-negotiable — for every event, every sponsor, every
            partner on the platform.
          </p>

          <ul className="mt-8 space-y-4">
            {[
              "Every event manually reviewed by ABW before going live",
              "Sponsor accounts verified via business email + LinkedIn",
              "Referral partners scored on track record and disclosure",
              "Fraud signals monitored continuously — bad actors removed",
            ].map((t) => (
              <li key={t} className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                <span className="text-foreground/85">{t}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
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
  return (
    <section className="px-6 pb-24">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-brand-gradient-diag px-8 py-16 text-white shadow-brand md:px-16 md:py-20">
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
              to="/"
              className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-primary-deep transition-transform hover:-translate-y-0.5"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Talk to the team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
