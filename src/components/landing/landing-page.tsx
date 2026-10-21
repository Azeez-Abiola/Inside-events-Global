/**
 * Public landing page. Layout follows the EvenTum event-management concept
 * (hero with tilted photo cards, coloured category cards, an events grid with
 * filter pills, a bento of feature cards, a destinations band, city cards and
 * a dark footer with a newsletter field), rebuilt in IGE's own palette —
 * Purple #6B3FA0 → Emerald #0E8A62 — with IGE's real copy and live events.
 * Always light: dark mode belongs to the dashboard only.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  CalendarDays,
  Clapperboard,
  Handshake,
  MapPin,
  Mic2,
  Music2,
  PartyPopper,
  Presentation,
  Store,
  Ticket,
  Users,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import {
  ArchBackdrop,
  Firework,
  PentagonIcon,
  PublicNav,
  pill,
} from "@/components/landing/public-chrome";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { trackEvent } from "@/lib/analytics";
import { stashSignupRole, type SignupRole } from "@/lib/signup-roles";

const PHOTOS = {
  party: "/events/young-man-having-fun-party.jpg",
  summit:
    "/events/portrait-young-handsome-african-american-businessman-suit-near-new-year-tree-decorations.jpg",
  phone:
    "/events/stylish-african-american-gentleman-elegant-black-jacket-glasses-holding-retro-walking-stick-as-cane-flask-tippling-cane-with-golden-diamond-ball-handle-speaking-mobile-phone.jpg",
  lounge:
    "/events/bellboy-providing-coffee-cup-guest-sitting-lounge-area-hotel-offering-excellent-luxury-services-with-drink-from-bar-woman-tourist-receiving-beverage-lobby-handheld-shot.jpg",
  team: "/events/dentistry-students-team-doing-research-with-plastic-human-jaw-model.jpg",
};

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroCard({
  src,
  kicker,
  title,
  className,
}: {
  src: string;
  kicker: string;
  title: string;
  className: string;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[28px] shadow-[0_24px_60px_-24px_rgba(26,19,37,0.45)] ${className}`}
    >
      <img
        src={src}
        alt=""
        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
      <div className="absolute bottom-3 left-3 text-white md:bottom-5 md:left-5">
        <p className="text-xs font-medium leading-tight sm:text-sm md:text-lg">{kicker}</p>
        <p className="text-xs font-semibold leading-tight sm:text-sm md:text-lg underline decoration-[#3ddc97] decoration-2 underline-offset-4">
          {title}
        </p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f7f6fa] pb-16">
      <ArchBackdrop />
      <Firework className="left-[10%] top-56 hidden h-32 w-20 text-[#6b3fa0]/25 md:block" />
      <Firework className="right-[11%] top-48 hidden h-28 w-16 text-[#0e8a62]/30 md:block" />
      <Music2
        aria-hidden
        className="absolute bottom-24 left-[16%] hidden h-6 w-6 -rotate-12 text-[#6b3fa0]/30 md:block"
      />
      <PartyPopper
        aria-hidden
        className="absolute bottom-40 right-[8%] hidden h-7 w-7 text-[#0e8a62]/35 md:block"
      />
      <PublicNav />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-16 text-center">
        <h1
          data-reveal
          data-delay="1"
          className="mt-5 text-4xl font-semibold tracking-tight text-[#1a1325] md:text-[56px] md:leading-[1.08]"
        >
          Event sponsorship
          <br />
          at your fingertips
        </h1>
        <p
          data-reveal
          data-delay="2"
          className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#5b5468]"
        >
          IGE connects event organisers, brand sponsors and partnership professionals across the
          Africa–Europe corridor, with vetted events, matched sponsors and tracked deals.
        </p>
        <Link
          data-reveal
          data-delay="3"
          to="/signup"
          onClick={() => trackEvent("signup_cta_click", { source: "landing_hero" })}
          className={`${pill} mt-8 bg-[#6b3fa0] text-white shadow-[0_12px_30px_-10px_rgba(107,63,160,0.7)]`}
        >
          Get started <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div
        data-reveal
        data-delay="4"
        className="relative z-10 mx-auto mt-14 grid max-w-5xl grid-cols-3 items-start gap-4 px-6 md:gap-6"
      >
        <HeroCard
          src={PHOTOS.party}
          kicker="Cultural"
          title="Homecomings"
          className="mt-6 aspect-[4/3.3] -rotate-2"
        />
        <HeroCard
          src={PHOTOS.summit}
          kicker="Business"
          title="Summits"
          className="aspect-[4/5] md:mt-10"
        />
        <HeroCard
          src={PHOTOS.phone}
          kicker="Brand"
          title="Activations"
          className="aspect-[4/3.3] rotate-2"
        />
      </div>
    </section>
  );
}

// ─── Who it's for: coloured category cards ───────────────────────────────────

const AUDIENCES: {
  role: SignupRole;
  cta: string;
  title: string;
  body: string;
  icon: LucideIcon;
  bg: string;
  ink: string;
  pattern: "squares" | "ovals" | "dots" | "rings";
}[] = [
  {
    role: "organiser",
    cta: "Join as an organiser",
    title: "Event organisers",
    body: "List once and reach sponsors that actually fit your audience.",
    icon: CalendarDays,
    bg: "bg-[#6b3fa0]",
    ink: "text-[#6b3fa0]",
    pattern: "squares",
  },
  {
    role: "sponsor",
    cta: "Join as a sponsor",
    title: "Brand sponsors",
    body: "Discover vetted events your buyers attend and commit with clean data.",
    icon: Ticket,
    bg: "bg-[#2e8171]",
    ink: "text-[#2e8171]",
    pattern: "ovals",
  },
  {
    role: "referral_partner",
    cta: "Join as a referral partner",
    title: "Referral partners",
    body: "Turn your network into commission with tracked, transparent payouts.",
    icon: Handshake,
    bg: "bg-[#0e8a62]",
    ink: "text-[#0e8a62]",
    pattern: "dots",
  },
  {
    role: "media_partner",
    cta: "Join as a media partner",
    title: "Media partners",
    body: "Coverage, interviews and documentary collaborations with vetted events.",
    icon: Clapperboard,
    bg: "bg-[#4a2c73]",
    ink: "text-[#4a2c73]",
    pattern: "rings",
  },
];

/** The corner decoration on each category card, one per card as in the concept. */
function CardPattern({ kind }: { kind: (typeof AUDIENCES)[number]["pattern"] }) {
  if (kind === "squares")
    return (
      <div aria-hidden className="absolute -right-6 -top-6 h-32 w-32">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="absolute rounded-2xl border-2 border-white/15"
            style={{ inset: `${i * 14}px` }}
          />
        ))}
      </div>
    );
  if (kind === "ovals")
    return (
      <div aria-hidden className="absolute -top-4 right-0 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 w-12 rounded-full bg-white/10" />
        ))}
      </div>
    );
  if (kind === "dots")
    return (
      <div
        aria-hidden
        className="absolute right-3 top-3 h-28 w-24 bg-[radial-gradient(rgba(255,255,255,0.3)_3.5px,transparent_4px)] [background-size:16px_16px]"
      />
    );
  return (
    <div
      aria-hidden
      className="absolute -right-10 -top-10 h-36 w-36 rounded-full border-[14px] border-white/10"
    >
      <div className="absolute inset-4 rounded-full border-[10px] border-white/10" />
    </div>
  );
}

function Audiences() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2
        data-reveal
        className="mx-auto max-w-xl text-center text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl"
      >
        Built for every side of the sponsorship economy
      </h2>
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map((a, i) => (
          <Link
            key={a.role}
            data-reveal
            data-delay={String(i + 1)}
            to="/signup"
            onClick={() => stashSignupRole(a.role)}
            className={`group relative overflow-hidden rounded-[24px] p-6 text-white transition-transform hover:-translate-y-1 ${a.bg}`}
          >
            <CardPattern kind={a.pattern} />
            <PentagonIcon icon={a.icon} iconClassName={a.ink} />
            <h3 className="relative mt-6 text-lg font-semibold">{a.title}</h3>
            <p className="relative mt-1.5 text-sm leading-relaxed text-white/80">{a.body}</p>
            <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold">
              {a.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ─── Events around the corner: live vetted events with filter pills ──────────

type LandingEvent = {
  id: string;
  slug: string | null;
  name: string;
  event_type: string | null;
  start_date: string | null;
  city: string | null;
  country: string | null;
  banner_image_url: string | null;
};

/** An event-type icon for the badge on each event card. */
function eventTypeIcon(type: string | null): LucideIcon {
  const t = (type ?? "").toLowerCase();
  if (/summit|conference|forum/.test(t)) return Presentation;
  if (/expo|fair|trade/.test(t)) return Store;
  if (/network|mixer|meetup/.test(t)) return Users;
  if (/festival|homecoming|cultur|party/.test(t)) return PartyPopper;
  if (/music|concert/.test(t)) return Music2;
  if (/talk|panel|podcast|media/.test(t)) return Mic2;
  return Ticket;
}

const fmtDate = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
    : "Date TBA";

const LANDING_EVENTS_QUERY = { sort: "soonest", per_page: 12 } as never;

/**
 * Route loader for the landing page. Fetching on the server sends the events
 * with the page HTML; a browser round trip to the server function took long
 * enough that visitors saw an empty section. Client-side navigations skip it
 * and let the section fetch on its own.
 */
export function loadLandingEvents() {
  return import.meta.env.SSR
    ? listMarketplaceEvents({ data: LANDING_EVENTS_QUERY })
    : Promise.resolve(undefined);
}

type LandingEventsResult = Awaited<ReturnType<typeof listMarketplaceEvents>>;

function Events({ initial }: { initial?: LandingEventsResult }) {
  const list = useServerFn(listMarketplaceEvents);
  const [type, setType] = useState<string>("all");
  const { data } = useQuery({
    queryKey: ["landing-events"],
    queryFn: () => list({ data: LANDING_EVENTS_QUERY }),
    initialData: initial,
    staleTime: 5 * 60_000,
  });
  const events = ((data?.events ?? []) as LandingEvent[]).filter(
    (e) => !e.start_date || new Date(e.start_date) >= new Date(new Date().toDateString()),
  );
  const types = [...new Set(events.map((e) => e.event_type).filter(Boolean))] as string[];
  const shown = events.filter((e) => type === "all" || e.event_type === type).slice(0, 3);

  return (
    <section className="bg-[#faf8fd] py-24">
      <div className="mx-auto max-w-6xl px-6">
        <h2
          data-reveal
          className="mx-auto max-w-lg text-center text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl"
        >
          Vetted events around the corner
        </h2>
        {types.length > 1 && (
          <div className="mx-auto mt-8 flex w-fit flex-wrap justify-center gap-1 rounded-full border border-black/5 bg-white p-1 shadow-sm">
            {["all", ...types].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  type === t ? "bg-[#6b3fa0] text-white" : "text-[#5b5468] hover:text-[#1a1325]"
                }`}
              >
                {t === "all" ? "All events" : t}
              </button>
            ))}
          </div>
        )}
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {shown.map((e, i) => (
            <Link
              key={e.id}
              data-reveal
              data-delay={String(i + 1)}
              to="/signup"
              className="group overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_-20px_rgba(26,19,37,0.25)] transition-transform hover:-translate-y-1"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#efe8f8]">
                <PentagonIcon
                  icon={eventTypeIcon(e.event_type)}
                  className="absolute left-3 top-3 z-10 h-11 w-11 shadow-sm"
                  iconClassName="mt-1 h-5 w-5 text-[#6b3fa0]"
                />
                {e.banner_image_url ? (
                  <img
                    src={e.banner_image_url}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[#6b3fa0]/40">
                    <Calendar className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="p-5">
                {e.event_type && (
                  <span className="rounded-full bg-[#efe8f8] px-2.5 py-0.5 text-[11px] font-medium text-[#6b3fa0]">
                    {e.event_type}
                  </span>
                )}
                <h3 className="mt-2.5 line-clamp-1 font-semibold text-[#1a1325]">{e.name}</h3>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#5b5468]">
                  <MapPin className="h-3.5 w-3.5 text-[#0e8a62]" />{" "}
                  {[e.city, e.country].filter(Boolean).join(", ") || "Location TBA"}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-[#5b5468]">
                  <Calendar className="h-3.5 w-3.5 text-[#0e8a62]" /> {fmtDate(e.start_date)}
                </p>
              </div>
            </Link>
          ))}
          <Link
            to="/signup"
            onClick={() => trackEvent("signup_cta_click", { source: "landing_events" })}
            data-reveal
            data-delay="4"
            className="group relative flex min-h-[280px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#6b3fa0] p-6 text-white transition-transform hover:-translate-y-1"
          >
            <div
              aria-hidden
              className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[#0e8a62]/50 blur-2xl"
            />
            <p className="relative text-lg font-semibold leading-snug">
              Discover vetted events seeking sponsors across the Africa–Europe corridor.
            </p>
            <span className="relative ml-auto flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#6b3fa0] transition-transform group-hover:rotate-45">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </Link>
        </div>
        {!shown.length && (
          <p className="mt-6 text-center text-sm text-[#5b5468]">
            New vetted events are announced here every week.
          </p>
        )}
      </div>
    </section>
  );
}

// ─── Beyond events: bento of what IGE does ───────────────────────────────────

const STEPS = [
  [
    "List or discover",
    "Organisers publish events; sponsors and partners browse vetted opportunities.",
  ],
  ["Match with data", "Audience, seniority, sector fit and ROI signals, not glossy decks."],
  ["Close the deal", "Clear tiers, structured agreements and a partner network that closes."],
  ["Track & get paid", "Every introduction, deal and commission tracked end to end."],
];

function Bento() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2
        data-reveal
        className="max-w-md text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl"
      >
        Sponsorship, beyond expectations
      </h2>
      <div data-reveal data-delay="1" className="mt-10 grid gap-5 lg:grid-cols-4">
        <div className="relative overflow-hidden rounded-[24px] bg-[#e9e1f6] p-7 lg:col-span-2 lg:row-span-1">
          <p className="text-lg font-semibold text-[#1a1325]">How IGE works</p>
          <ol className="mt-5 grid gap-4 sm:grid-cols-2">
            {STEPS.map(([t, d], i) => (
              <li key={t}>
                <span className="text-xs font-semibold text-[#6b3fa0]">0{i + 1}</span>
                <p className="mt-0.5 text-sm font-semibold text-[#1a1325]">{t}</p>
                <p className="mt-1 text-xs leading-relaxed text-[#5b5468]">{d}</p>
              </li>
            ))}
          </ol>
        </div>
        <BentoPhoto
          src={PHOTOS.lounge}
          title="Hospitality partnerships"
          note="Sponsor the moments guests remember"
        />
        <BentoPhoto
          src={PHOTOS.team}
          title="Education & research"
          note="Reach the next generation of decision makers"
        />
        <BentoPhoto
          src={PHOTOS.party}
          title="Cultural homecomings"
          note="Heritage events with global diaspora reach"
        />
        <BentoPhoto
          src={PHOTOS.phone}
          title="Networking & mixers"
          note="Small rooms, serious partnerships"
        />
        <Link
          to="/contact"
          className="group relative overflow-hidden rounded-[24px] bg-[#e3f4ed] p-7 transition-transform hover:-translate-y-1 lg:col-span-2"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-lg font-semibold text-[#1a1325]">Want IGE to run it for you?</p>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-[#5b5468]">
                AlexBoyo World handles sponsorship strategy, sourcing, activation and reporting, end
                to end. Tell us what you need and we'll set up a meeting.
              </p>
            </div>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#0e8a62] shadow-sm transition-transform group-hover:rotate-45">
              <ArrowUpRight className="h-5 w-5" />
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
}

function BentoPhoto({ src, title, note }: { src: string; title: string; note: string }) {
  return (
    <div className="group overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_-20px_rgba(26,19,37,0.25)]">
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        <p className="font-semibold text-[#1a1325]">{title}</p>
        <p className="mt-1 text-xs text-[#5b5468]">{note}</p>
      </div>
    </div>
  );
}

// ─── Corridor + cities ───────────────────────────────────────────────────────

const CITIES = [
  { city: "Lagos", note: "Nigeria", tint: "bg-[#e9e1f6]" },
  { city: "Nairobi", note: "Kenya", tint: "bg-[#fbf1dc]" },
  { city: "Accra", note: "Ghana", tint: "bg-[#e3f4ed]" },
  { city: "London", note: "United Kingdom", tint: "bg-[#e5eefb]" },
];

function Corridor() {
  return (
    <section className="bg-[#faf8fd] py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
        <div data-reveal>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e3f4ed] text-[#0e8a62]">
            <MapPin className="h-5 w-5" />
          </span>
          <h2
            data-reveal
            className="mt-5 text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl"
          >
            Built for the Africa–Europe corridor
          </h2>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[#5b5468]">
            From cultural homecomings in Warri to summits in Lagos, expos in Nairobi and networking
            rooms in London, IGE vets the events and brings the right sponsors to the table.
          </p>
          <Link to="/marketplace" className={`${pill} mt-7 bg-[#0e8a62] text-white`}>
            Explore events <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div data-reveal data-delay="2" className="relative">
          <div className="overflow-hidden rounded-[28px] shadow-[0_24px_60px_-24px_rgba(26,19,37,0.45)]">
            <img src={PHOTOS.summit} alt="" className="aspect-[4/3] w-full object-cover" />
          </div>
          <div className="absolute -bottom-6 left-6 right-6 flex items-center gap-3 rounded-2xl bg-white p-4 shadow-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8f8] text-[#6b3fa0]">
              <BadgeCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-[#1a1325]">Every listing vetted by IGE</p>
              <p className="text-xs text-[#5b5468]">
                Identity, registration and past delivery checked
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-28 max-w-6xl px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2
            data-reveal
            className="max-w-sm text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl"
          >
            Where our events happen
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-[#5b5468]">
            Vetted events across the cities shaping the Africa–Europe events economy.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CITIES.map((c, i) => (
            <Link
              key={c.city}
              data-reveal
              data-delay={String(i + 1)}
              to="/marketplace"
              className={`group flex items-center justify-between rounded-[22px] p-5 transition-transform hover:-translate-y-0.5 ${c.tint}`}
            >
              <span className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#6b3fa0] shadow-sm">
                  <MapPin className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-semibold text-[#1a1325]">{c.city}</span>
                  <span className="block text-xs text-[#5b5468]">{c.note}</span>
                </span>
              </span>
              <ArrowUpRight className="h-5 w-5 text-[#6b3fa0] transition-transform group-hover:rotate-45" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LandingPage({ initialEvents }: { initialEvents?: LandingEventsResult }) {
  const revealRef = useScrollReveal() as React.RefObject<HTMLDivElement>;
  return (
    <div ref={revealRef} className="min-h-screen bg-white font-sans text-[#1a1325]">
      <Hero />
      <Audiences />
      <Events initial={initialEvents} />
      <Bento />
      <Corridor />
      <SiteFooter />
    </div>
  );
}
