import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Clapperboard,
  ExternalLink,
  Gauge,
  Handshake,
  Instagram,
  Lock,
  Megaphone,
  Mic2,
  Newspaper,
  ShieldCheck,
  Target,
  Users,
  Wallet,
} from "lucide-react";
import { SiteFooter, SiteHeader } from "@/components/site-chrome";
import { useAuth } from "@/lib/auth-context";
import { trackEvent } from "@/lib/analytics";
import {
  IGE_LUMA_CALENDAR,
  getInstagramFeed,
  getUpcomingHomeEvents,
  type HomeEvent,
} from "@/lib/public-site.functions";

const PODCAST_URL = "https://www.youtube.com/@alexboyoworld";
const IG_URL = "https://www.instagram.com/insideglobalevents";

/**
 * The home page, in the order agreed at the 26 September review (TAB 1 §1.0):
 * hero → the problem as role bubbles → Upcoming IGE Featured Events and the
 * marketplace teaser → the two Command Centers → footer. The retained sections
 * (§1.4, 1.7, 1.10, 1.11, 1.12) sit beneath and can be trimmed after the demo.
 */
export function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <RoleBubbles />
        <UpcomingFeaturedEvents />
        <MarketplaceTeaser />
        <InstagramStrip />
        <CommandCenters />
        <HowItWorks />
        <RoiStandard />
        <MovementLayer />
        <HowWeGetPaid />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}

/** Visitors go to the "Join IGE as…" screen with a role ticked; members go straight in (§1.2). */
function useCtas() {
  const { user } = useAuth();
  return {
    signedIn: !!user,
    listEvent: user
      ? ({ to: "/events" } as const)
      : ({ to: "/signup", search: { role: "organiser" } } as const),
    findEvents: user
      ? ({ to: "/marketplace" } as const)
      : ({ to: "/signup", search: { role: "sponsor", next: "/marketplace" } } as const),
  };
}

// ─── Block 1: Hero (§1.2) ─────────────────────────────────────────────────────

function Hero() {
  const cta = useCtas();
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
        style={{ background: "var(--gradient-brand-diag)" }}
      />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-6 pb-20 pt-16 md:pt-24 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-deep">
            The vetted event sponsorship marketplace
          </p>
          <h1 className="mt-4 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
            Where B2B Events <span className="text-brand-gradient">Actually Get Sponsored.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
            Inside Global Events is a vetted event sponsorship, intelligence and management
            platform. List your event to find sponsors, media partners and brand partners, or keep
            it private and run your planning, partnerships, CRM and reporting on IGE every day.
            Brands discover vetted events and creative productions and prove what their spend
            returned. IGE is free to use. We only earn when a sponsorship we sourced closes and the
            sponsor has paid, or when you hire our team for execution, planning or management.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              {...cta.listEvent}
              onClick={() => trackEvent("signup_cta_click", { source: "home_hero_list" })}
              className="group inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
            >
              List Your Event
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              {...cta.findEvents}
              onClick={() => trackEvent("signup_cta_click", { source: "home_hero_find" })}
              className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3.5 text-sm font-semibold text-primary transition-colors hover:bg-brand-soft"
            >
              Find Vetted Events To Sponsor
            </Link>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Want our team to run your sponsorship search for you?{" "}
            <Link to="/services" className="font-semibold text-primary hover:underline">
              Talk to ABW
            </Link>
          </p>
          <div className="mt-10">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Building sponsor pipelines with
            </p>
            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 font-display text-lg font-semibold text-muted-foreground/80">
              {["Nestlé Maggi", "Stanbic IBTC", "Swiss Hotel", "Overland Airways", "Enugu Air"].map(
                (b) => (
                  <span key={b}>{b}</span>
                ),
              )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-5">
          <HeroVisual />
        </div>
      </div>
    </section>
  );
}

/** "The Sponsorship Command Center's daily feed morphing into the Organiser Command Center's fundraising tracker." */
function HeroVisual() {
  const [side, setSide] = useState<0 | 1>(0);
  useEffect(() => {
    const t = setInterval(() => setSide((s) => (s ? 0 : 1)), 4500);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="relative h-[380px]" aria-hidden>
      {[0, 1].map((i) => (
        <div
          key={i}
          className={`absolute inset-0 rounded-2xl border border-border bg-card p-6 shadow-brand transition-all duration-700 ${side === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
        >
          {i === 0 ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary-deep">
                Sponsorship Command Center
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Q3 marketing budget remaining</p>
              <p className="bg-brand-gradient bg-clip-text font-display text-4xl font-bold text-transparent">
                $184,500
              </p>
              <p className="mt-1 text-xs text-secondary-deep">● On pace</p>
              <p className="mt-6 text-xs font-semibold text-foreground">
                Today's vetted events for you
              </p>
              {[
                ["Fintech Leaders Summit · Lagos", 92],
                ["Diaspora Investment Forum · London", 86],
                ["Creative Economy Week · Accra", 79],
              ].map(([n, s]) => (
                <div
                  key={n as string}
                  className="mt-2 flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm"
                >
                  <span className="truncate">{n}</span>
                  <span className="rounded-full bg-secondary/15 px-2 text-xs font-bold text-secondary-deep">
                    {s}
                  </span>
                </div>
              ))}
            </>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-secondary-deep">
                Organiser Command Center
              </p>
              <p className="mt-3 text-xs text-muted-foreground">Funding gap · 42 days to event</p>
              <p className="bg-brand-gradient bg-clip-text font-display text-4xl font-bold text-transparent">
                ₦18.5M
              </p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full w-[62%] bg-secondary" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                62% raised · 1 of 1 Title filled · 2 of 4 Gold filled
              </p>
              <p className="mt-6 text-xs font-semibold text-foreground">Today's coaching</p>
              <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                Add a decision-maker seniority breakdown to your audience profile.
              </p>
              <p className="mt-2 rounded-lg bg-muted/40 px-3 py-2 text-sm">
                Readiness score 74/100 · +6 this week
              </p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Block 2: The problem, as role bubbles (§1.3) ─────────────────────────────

const BUBBLES = [
  {
    id: "organisers",
    label: "Event Organisers",
    icon: Megaphone,
    pain: "You know your event is good. You just cannot prove it to a brand's finance team.",
    role: "organiser",
  },
  {
    id: "sponsors",
    label: "Brands and Sponsors",
    icon: Wallet,
    pain: "You spent the budget. Can you actually show what it returned?",
    role: "sponsor",
  },
  {
    id: "everyone",
    label: "Everyone Else",
    icon: Users,
    pain: "Sponsorship deals still live in spreadsheets, WhatsApp threads, and someone's inbox.",
    role: null,
  },
] as const;

const SUB_BUBBLES = [
  { label: "Referral Partners", role: "referral_partner", icon: Handshake },
  { label: "Media Partners", role: "media_partner", icon: Newspaper },
  { label: "Partnerships Professionals", role: "partnerships_pro", icon: BarChart3 },
  { label: "Creative Hub", role: "creative_hub", icon: Clapperboard },
  { label: "Private Event Hosts", role: "organiser", icon: Lock },
] as const;

function RoleBubbles() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <section className="border-y border-border bg-[#F2F0F5] py-20 dark:bg-muted/20">
      <div className="mx-auto max-w-6xl px-6 text-center">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Sponsorship should not be this hard.
        </h2>
        <div className="mt-12 flex flex-wrap items-start justify-center gap-6">
          {BUBBLES.map((b) => {
            const isOpen = open === b.id;
            return (
              <div key={b.id} className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : b.id)}
                  onMouseEnter={() => setOpen(b.id)}
                  aria-expanded={isOpen}
                  className={`flex flex-col items-center justify-center rounded-full border border-border bg-card text-center shadow-soft transition-all duration-300 ${isOpen ? "h-72 w-72 border-primary" : "h-44 w-44 hover:scale-105"}`}
                >
                  <b.icon className="h-7 w-7 text-primary" />
                  <span className="mt-2 px-4 font-semibold text-foreground">{b.label}</span>
                  {isOpen && (
                    <span className="mt-3 px-8 text-sm italic text-muted-foreground">
                      “{b.pain}”
                    </span>
                  )}
                </button>
                {isOpen && b.role && (
                  <Link
                    to="/signup"
                    search={{ role: b.role }}
                    className="mt-3 text-sm font-semibold text-primary hover:underline"
                  >
                    Join IGE as{" "}
                    {b.label === "Event Organisers" ? "an Event Organiser" : "a Brand / Sponsor"} →
                  </Link>
                )}
                {isOpen && !b.role && (
                  <div className="mt-4 flex max-w-md flex-wrap justify-center gap-2">
                    {SUB_BUBBLES.map((s) => (
                      <Link
                        key={s.label}
                        to="/signup"
                        search={{ role: s.role }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary"
                      >
                        <s.icon className="h-3.5 w-3.5 text-primary" />
                        {s.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Block 3a: Upcoming IGE Featured Events (§1.5D) ───────────────────────────

function UpcomingFeaturedEvents() {
  const fetchEvents = useServerFn(getUpcomingHomeEvents);
  const { data } = useQuery({ queryKey: ["upcoming-home-events"], queryFn: () => fetchEvents() });
  const events = data?.events ?? [];
  // "If no upcoming events are uploaded, the section does not render."
  if (!events.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-deep">
            Coming up
          </p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Upcoming IGE Featured Events
          </h2>
        </div>
        <a
          href={IGE_LUMA_CALENDAR}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
        >
          See all upcoming events <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {events.map((e) => (
          <HomeEventCard key={e.id} e={e} />
        ))}
      </div>
    </section>
  );
}

function HomeEventCard({ e }: { e: HomeEvent }) {
  const when = new Date(e.starts_at);
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <img src={e.cover_image_url} alt="" className="h-48 w-full object-cover" loading="lazy" />
      <div className="flex flex-1 flex-col p-5">
        <span
          className={`self-start rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${e.source === "ige_abw" ? "bg-brand-soft text-primary-deep" : "bg-muted text-muted-foreground"}`}
        >
          {e.source === "ige_abw" ? "IGE / ABW Event" : "Client Event"}
        </span>
        <h3 className="mt-3 font-display text-xl font-bold">{e.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          {when.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })} ·{" "}
          {e.city || "Virtual"}
        </p>
        <p className="mt-3 flex-1 text-sm text-muted-foreground">{e.description}</p>
        <a
          href={e.luma_url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white"
        >
          Register on Luma <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>
    </article>
  );
}

// ─── Block 3b: Marketplace teaser (§1.5, 1.5A) ────────────────────────────────

function MarketplaceTeaser() {
  const cta = useCtas();
  return (
    <section className="border-y border-border bg-[#F2F0F5] py-20 dark:bg-muted/20">
      <div className="mx-auto max-w-5xl px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-deep">
          The marketplace
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-4xl">
          Every published event is vetted before it is listed.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Every listing is scored against the IGE Brand-Readiness Framework: audience clarity,
          attendance proof, sponsor ROI history, commercialisation readiness, experience quality and
          organiser credibility. Private workspace events never appear here.
        </p>
        <div className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="relative h-28 overflow-hidden rounded-xl border border-border bg-card"
            >
              <div className="absolute inset-0 bg-brand-gradient opacity-10 blur-sm" />
              <Lock className="absolute inset-0 m-auto h-6 w-6 text-muted-foreground" />
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            {...cta.findEvents}
            className="inline-flex items-center gap-2 rounded-md border border-primary px-6 py-3 text-sm font-semibold text-primary hover:bg-brand-soft"
          >
            {cta.signedIn ? "Browse the Marketplace" : "Sign up to browse the Marketplace"}
          </Link>
          <Link
            to="/past-events"
            className="inline-flex items-center gap-2 rounded-md px-6 py-3 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Past Events →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Instagram (§1.5B) ────────────────────────────────────────────────────────

function InstagramStrip() {
  const fetchFeed = useServerFn(getInstagramFeed);
  const { data } = useQuery({ queryKey: ["instagram-feed"], queryFn: () => fetchFeed() });
  const posts = data?.posts ?? [];
  if (posts.length < 4) return null;
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {posts.map((p) => (
          <a
            key={p.id}
            href={p.permalink}
            target="_blank"
            rel="noreferrer"
            className="group block aspect-square overflow-hidden rounded-xl bg-muted"
          >
            <img
              src={p.media_url}
              alt={p.caption?.slice(0, 120) ?? "Inside Global Events on Instagram"}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </a>
        ))}
      </div>
      <a
        href={IG_URL}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
      >
        <Instagram className="h-4 w-4" /> Follow us on Instagram
      </a>
    </section>
  );
}

// ─── Block 4: The two Command Centers (§1.6) ─────────────────────────────────

function CommandCenters() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20">
      <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Built to be opened every morning, not once a quarter.
      </h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {[
          {
            icon: Gauge,
            title: "Sponsorship Command Center",
            desc: "Your whole marketing budget across four quarters, one login. Daily vetted event feed, live pipeline, one click Business Case.",
          },
          {
            icon: Target,
            title: "Organiser Command Center",
            desc: "Watch your funding gap shrink in real time. Daily coaching, sponsor match notifications, one calendar for every deadline.",
          },
        ].map((c) => (
          <div key={c.title} className="rounded-2xl border border-border bg-card p-8">
            <c.icon className="h-8 w-8 text-primary" />
            <h3 className="mt-4 font-display text-2xl font-bold">{c.title}</h3>
            <p className="mt-2 text-muted-foreground">{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── How IGE works (§1.4) ─────────────────────────────────────────────────────

const JOURNEYS: Record<string, string[]> = {
  Organisers: [
    "Create your event and plan it on IGE, privately or publicly.",
    "Publish it to seek sponsors or partners and get a Brand-Readiness Score.",
    "Get vetted by Admin.",
    "Get notified on your dashboard when Admin approves a match for you, with details on how to book a meeting.",
  ],
  Sponsors: [
    "Set your budget and objectives.",
    "Browse vetted, featured and newly listed events on the marketplace.",
    "Get notified on your dashboard when Admin approves an event match for you, with details on how to book a meeting with the organiser.",
  ],
  Professionals: [
    "Build your profile.",
    "Get matched to organisers and sponsors who need what you offer.",
    "Get notified on your dashboard when Admin approves a match.",
  ],
  Creators: [
    "List your production or project and the brand placement it offers.",
    "Get notified on your dashboard when Admin approves a brand match, with details on how to book a meeting.",
  ],
};

function HowItWorks() {
  const [tab, setTab] = useState("Organisers");
  return (
    <section id="how" className="border-y border-border bg-[#F2F0F5] py-20 dark:bg-muted/20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          One platform, four journeys.
        </h2>
        <p className="mt-3 text-muted-foreground">
          No step involves messaging another user directly — every match is reviewed and delivered
          by the IGE team.
        </p>
        <div className="mt-8 flex flex-wrap gap-2" role="tablist">
          {Object.keys(JOURNEYS).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={tab === k}
              onClick={() => setTab(k)}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === k ? "bg-brand-gradient text-white" : "bg-card text-muted-foreground hover:text-foreground"}`}
            >
              {k}
            </button>
          ))}
        </div>
        <ol className="mt-8 grid gap-4 md:grid-cols-2">
          {JOURNEYS[tab].map((step, i) => (
            <li key={step} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <span className="font-mono text-sm font-bold text-primary">0{i + 1}</span>
              <span className="text-sm text-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ─── Proof, not promises (§1.7) ───────────────────────────────────────────────

function RoiStandard() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
        Built on the same discipline global sponsorship runs on.
      </h2>
      <p className="mt-4 text-muted-foreground">
        Every sponsorship is measured across three value pillars — value for money, value for brand
        and value for business — the 3-2-1 approach developed by IEG (sponsorship.com), and against
        the objectives the brand actually set. IGE's structures are aligned with ESA, IEG, IFEA and
        CFEE, EIC and APEX, and ISO 20121.
      </p>
      <p className="mt-3 text-xs text-muted-foreground">
        This alignment is referenced, not licensed or endorsed. IGE is not a member organisation of
        ESA, IEG, IFEA or EIC, and is not ISO 20121 certified.
      </p>
    </section>
  );
}

// ─── Movement layer (§1.10) ───────────────────────────────────────────────────

function MovementLayer() {
  return (
    <section className="border-y border-border bg-[#F2F0F5] py-20 dark:bg-muted/20">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
          Events are not a cost centre. They are a growth engine.
        </h2>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <a
            href={PODCAST_URL}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border bg-card p-6 hover:border-primary"
          >
            <Mic2 className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">PartnerUp Podcast</p>
            <p className="mt-1 text-sm text-muted-foreground">
              The global partnerships podcast, co-hosted by Alero.
            </p>
          </a>
          <div className="rounded-xl border border-border bg-card p-6">
            <BarChart3 className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">Quarterly Intelligence Report</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Market data and sponsorship benchmarks. Join the newsletter below to get it first.
            </p>
          </div>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSeNzRDQHA4zjwDYgf_bbZDDpiD_WA2LQY-_hy5T6ZteNE-G_w/viewform"
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border border-border bg-card p-6 hover:border-primary"
          >
            <Users className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">ABW PartnerUp Tribe</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Our WhatsApp community for partnership and events professionals.
            </p>
          </a>
        </div>
      </div>
    </section>
  );
}

// ─── How we get paid (§1.11) ──────────────────────────────────────────────────

function HowWeGetPaid() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-secondary-deep">
        Free to use. We only win when you do.
      </p>
      <p className="mt-4 text-lg text-foreground">
        Inside Global Events is free to use for every role until May 2027 — no charge to create an
        account, list or plan an event, browse the marketplace, receive a match, or use the daily
        tools. A commission is only ever charged on a sponsorship IGE sourced, once it has closed
        and the sponsor's payment has been received. Organisations that want AlexBoyo World's team
        for strategy, planning, execution or management can engage it on a monthly retainer, a
        one-off fee or an annual fee.
      </p>
      <Link
        to="/services"
        className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
      >
        See IGE Services <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

// ─── Final CTA band (§1.12) ───────────────────────────────────────────────────

function FinalCta() {
  const cta = useCtas();
  return (
    <section className="px-6 pb-24">
      <div className="mx-auto max-w-6xl rounded-3xl bg-brand-gradient-diag px-8 py-16 text-center text-white shadow-brand">
        <h2 className="mx-auto max-w-3xl font-display text-3xl font-bold md:text-5xl">
          Your Next Sponsor Is Already Looking For an Event Like Yours.
        </h2>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            {...cta.listEvent}
            className="inline-flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-primary-deep"
          >
            List Your Event <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            {...cta.findEvents}
            className="inline-flex items-center gap-2 rounded-md border border-white/50 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white"
          >
            <ShieldCheck className="h-4 w-4" /> Find Events to Sponsor
          </Link>
        </div>
      </div>
    </section>
  );
}
