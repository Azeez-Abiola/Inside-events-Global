import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Calendar,
  Instagram,
  Mail,
  MapPin,
  Sparkles,
  Globe2,
  Handshake,
  Megaphone,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/welcome")({
  head: () => ({
    meta: [
      { title: "Welcome to IGE · Inside Global Events" },
      {
        name: "description",
        content:
          "Inside Global Events (IGE) connects event organisers, brand sponsors, and partnerships professionals across the Africa–Europe corridor. Waitlist launching soon.",
      },
      { property: "og:title", content: "Welcome to Inside Global Events" },
      {
        property: "og:description",
        content:
          "Event intelligence + sponsorship marketplace. Waitlist launching soon — featuring the Itsekiri Global Homecoming.",
      },
    ],
  }),
  component: WelcomePage,
});

const HI_EMAIL = "Hi@insideglobalevents.com";
const IG_HANDLE = "insideglobalevents";
const IG_URL = `https://instagram.com/${IG_HANDLE}`;

function WelcomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Lightweight header (no nav — gate page) */}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/welcome" className="flex items-center gap-2">
            <span
              aria-hidden
              className="inline-block h-7 w-7 rounded-md"
              style={{ background: "var(--gradient-brand-diag)" }}
            />
            <span className="font-display text-lg font-bold tracking-tight">
              Inside Global Events
            </span>
          </Link>
          <a
            href={IG_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs font-medium text-foreground hover:bg-accent"
          >
            <Instagram className="h-4 w-4" />
            @{IG_HANDLE}
          </a>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--gradient-brand-diag)" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full opacity-20 blur-3xl"
            style={{ background: "var(--gradient-brand-diag)" }}
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 md:py-28">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Waitlist launching soon
            </span>
            <h1 className="mt-6 font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Commercial infrastructure for the{" "}
              <span className="text-brand-gradient">global events economy.</span>
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
              I.G.E (Inside Global Events) is a vertically integrated event
              intelligence and sponsorship marketplace built for the Africa to
              Europe corridor — connecting event organisers, brand sponsors, and
              a distributed network of partnerships professionals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${HI_EMAIL}?subject=Interested%20in%20IGE`}
                className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow transition-transform hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                Email us at {HI_EMAIL}
              </a>
              <a
                href={IG_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <Instagram className="h-4 w-4" />
                Follow @{IG_HANDLE}
              </a>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              The full platform and waitlist are launching shortly. In the
              meantime, reach us by email or DM on Instagram.
            </p>
          </div>
        </section>

        {/* WHO IT'S FOR */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="max-w-2xl">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
              Who it's for
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              Built for the three sides of every sponsorship deal.
            </h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Megaphone,
                title: "Event organisers",
                desc: "From cultural homecomings to global summits — list once and reach sponsors that actually fit your audience.",
              },
              {
                icon: Globe2,
                title: "Brand sponsors",
                desc: "Discover vetted events your buyers attend, compare tiers, and commit with confidence and clean data.",
              },
              {
                icon: Handshake,
                title: "Referral partners",
                desc: "Turn your network into recurring commission with trackable referral links and transparent payouts.",
              },
            ].map((p) => (
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

        {/* HOW IT WORKS */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-6 py-20 md:py-24">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                How it works
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Vetted events. Verified sponsors. Tracked deals.
              </h2>
            </div>
            <ol className="mt-12 grid gap-6 md:grid-cols-4">
              {[
                { n: "01", t: "List or discover", d: "Organisers publish events; sponsors and partners browse vetted opportunities." },
                { n: "02", t: "Match with data", d: "Audience, seniority, sector fit and ROI signals — not glossy decks." },
                { n: "03", t: "Close the deal", d: "Transparent tiers, structured agreements, and a partner network that closes." },
                { n: "04", t: "Track & payout", d: "Every introduction, deal, and commission tracked end-to-end." },
              ].map((s) => (
                <li
                  key={s.n}
                  className="rounded-2xl border border-border bg-card p-6"
                >
                  <div className="font-display text-2xl font-bold text-primary">
                    {s.n}
                  </div>
                  <div className="mt-3 font-display text-lg font-bold">{s.t}</div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {s.d}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* UPCOMING EVENTS */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-24">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                Upcoming events
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                Featured event of the month.
              </h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              More events coming soon
            </span>
          </div>

          <article className="mt-10 overflow-hidden rounded-3xl border border-border bg-card shadow-brand">
            <div className="grid gap-0 md:grid-cols-5">
              <div
                aria-hidden
                className="relative h-56 md:col-span-2 md:h-auto"
                style={{ background: "var(--gradient-brand-diag)" }}
              >
                <div className="absolute inset-0 flex items-end p-8">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                      <Sparkles className="h-3.5 w-3.5" />
                      Featured event of the month
                    </span>
                    <div className="mt-4 font-display text-2xl font-bold leading-tight text-white md:text-3xl">
                      Itsekiri Global Homecoming
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 md:col-span-3 md:p-10">
                <h3 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
                  A cultural homecoming for the global Itsekiri community.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
                  IGE is proud to spotlight the Itsekiri Global Homecoming as
                  our launch featured event — a gathering of Itsekiri sons,
                  daughters, businesses and allies from across the diaspora to
                  celebrate heritage, build community and unlock new commercial
                  partnerships.
                </p>
                <ul className="mt-6 space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      Warri, Delta State, Nigeria — dates announced soon.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Handshake className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      Sponsorship and partnership opportunities available now.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <ShieldCheck className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">
                      Vetted by the IGE partnerships team.
                    </span>
                  </li>
                </ul>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href={`mailto:${HI_EMAIL}?subject=Itsekiri%20Global%20Homecoming%20—%20Interest`}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow hover:-translate-y-0.5 transition-transform"
                  >
                    Express interest
                    <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href={IG_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent"
                  >
                    <Instagram className="h-4 w-4" />
                    Follow for updates
                  </a>
                </div>
              </div>
            </div>
          </article>

          <div className="mt-8 rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
            More vetted events from across the Africa–Europe corridor will be
            announced here in the coming weeks.
          </div>
        </section>

        {/* WHO WE ARE */}
        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-24">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                Who we are
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                A team rebuilding how B2B sponsorship is done.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground">
                Sponsorship is one of the largest line items in B2B marketing,
                yet it still runs on cold inbound, inflated decks and broker
                handshakes. IGE is rebuilding that market — every event vetted,
                every sponsor verified, every partner accountable, every deal
                tracked.
              </p>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
                What we do
              </div>
              <ul className="mt-5 space-y-4 text-sm">
                {[
                  "Vet and onboard events across the Africa–Europe corridor.",
                  "Verify brand sponsors and match them to fitting audiences.",
                  "Empower a distributed network of partnerships professionals.",
                  "Structure, track and pay out every sponsorship deal end-to-end.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 md:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl bg-brand-gradient-diag px-8 py-14 text-white shadow-brand md:px-14 md:py-16">
            <h2 className="font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl">
              The waitlist is launching soon.
            </h2>
            <p className="mt-4 max-w-2xl text-base opacity-90 md:text-lg">
              While we finish polishing the platform, the best way to get on the
              founding list is to reach out directly or follow along on
              Instagram.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${HI_EMAIL}?subject=IGE%20—%20Add%20me%20to%20the%20founding%20list`}
                className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-primary-deep transition-transform hover:-translate-y-0.5"
              >
                <Mail className="h-4 w-4" />
                {HI_EMAIL}
              </a>
              <a
                href={IG_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                <Instagram className="h-4 w-4" />
                @{IG_HANDLE}
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
