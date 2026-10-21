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
import { toast } from "sonner";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Calendar,
  Handshake,
  Megaphone,
  MapPin,
  Search,
  Sparkles,
  Tent,
  TrendingUp,
} from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { listMarketplaceEvents } from "@/lib/marketplace.functions";
import { subscribeNewsletter } from "@/lib/newsletter.functions";
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

const pill =
  "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5";

// ─── Nav ─────────────────────────────────────────────────────────────────────

function Nav() {
  return (
    <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <Link to="/" className="flex items-center gap-2.5">
        <BrandLogo size="sm" />
        <span className="text-[15px] font-semibold tracking-tight text-[#1a1325]">
          Inside Global Events
        </span>
      </Link>
      <nav className="hidden items-center gap-9 text-sm text-[#5b5468] md:flex">
        <Link to="/marketplace" className="hover:text-[#1a1325]">
          Events
        </Link>
        <Link to="/how-it-works" className="hover:text-[#1a1325]">
          How it works
        </Link>
        <Link to="/about" className="hover:text-[#1a1325]">
          About
        </Link>
        <Link to="/contact" className="hover:text-[#1a1325]">
          Contact us
        </Link>
      </nav>
      <div className="flex items-center gap-3">
        <Link
          to="/marketplace"
          aria-label="Search events"
          className="hidden h-9 w-9 items-center justify-center rounded-full text-[#5b5468] hover:bg-black/5 sm:inline-flex"
        >
          <Search className="h-4 w-4" />
        </Link>
        <Link
          to="/login"
          className="hidden text-sm font-medium text-[#1a1325] hover:text-[#6b3fa0] sm:inline"
        >
          Sign in
        </Link>
        <Link
          to="/signup"
          onClick={() => trackEvent("signup_cta_click", { source: "landing_nav" })}
          className={`${pill} border border-[#1a1325]/15 bg-white px-4 py-2 text-[#1a1325] shadow-sm`}
        >
          Get started <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </header>
  );
}

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
      <div className="absolute bottom-5 left-5 text-white">
        <p className="text-lg font-medium leading-tight">{kicker}</p>
        <p className="text-lg font-semibold leading-tight underline decoration-[#3ddc97] decoration-2 underline-offset-4">
          {title}
        </p>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Soft brand wash and sparkles, as in the concept's confetti header. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[560px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(107,63,160,0.14),transparent_70%)]"
      />
      <Sparkles aria-hidden className="absolute left-[12%] top-40 h-6 w-6 text-[#6b3fa0]/25" />
      <Sparkles aria-hidden className="absolute right-[14%] top-28 h-8 w-8 text-[#0e8a62]/25" />
      <Nav />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pt-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#6b3fa0]/15 bg-white/80 px-3.5 py-1 text-xs font-medium text-[#6b3fa0] shadow-sm">
          <BadgeCheck className="h-3.5 w-3.5" /> The vetted B2B sponsorship marketplace
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#1a1325] md:text-[56px] md:leading-[1.08]">
          Event sponsorship
          <br />
          at your fingertips
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#5b5468]">
          IGE connects event organisers, brand sponsors and partnership professionals across the
          Africa–Europe corridor, with vetted events, matched sponsors and tracked deals.
        </p>
        <Link
          to="/signup"
          onClick={() => trackEvent("signup_cta_click", { source: "landing_hero" })}
          className={`${pill} mt-8 bg-[#6b3fa0] text-white shadow-[0_12px_30px_-10px_rgba(107,63,160,0.7)]`}
        >
          Get started <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative z-10 mx-auto mt-14 grid max-w-5xl grid-cols-3 items-start gap-4 px-6 md:gap-6">
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
  title: string;
  body: string;
  icon: typeof Tent;
  bg: string;
}[] = [
  {
    role: "organiser",
    title: "Event organisers",
    body: "List once and reach sponsors that actually fit your audience.",
    icon: Tent,
    bg: "bg-[#6b3fa0]",
  },
  {
    role: "sponsor",
    title: "Brand sponsors",
    body: "Discover vetted events your buyers attend and commit with clean data.",
    icon: TrendingUp,
    bg: "bg-[#2e8171]",
  },
  {
    role: "referral_partner",
    title: "Referral partners",
    body: "Turn your network into commission with tracked, transparent payouts.",
    icon: Handshake,
    bg: "bg-[#0e8a62]",
  },
  {
    role: "media_partner",
    title: "Media partners",
    body: "Coverage, interviews and documentary collaborations with vetted events.",
    icon: Megaphone,
    bg: "bg-[#4a2c73]",
  },
];

function Audiences() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-24">
      <h2 className="mx-auto max-w-xl text-center text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl">
        Built for every side of the sponsorship economy
      </h2>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {AUDIENCES.map((a) => (
          <Link
            key={a.role}
            to="/signup"
            onClick={() => stashSignupRole(a.role)}
            className={`group relative overflow-hidden rounded-[24px] p-6 text-white transition-transform hover:-translate-y-1 ${a.bg}`}
          >
            {/* Dotted corner texture, as on the concept's category cards. */}
            <div
              aria-hidden
              className="absolute -right-4 -top-4 h-28 w-28 bg-[radial-gradient(rgba(255,255,255,0.35)_1.2px,transparent_1.2px)] [background-size:10px_10px]"
            />
            <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#1a1325] shadow-sm">
              <a.icon className="h-6 w-6" />
            </div>
            <h3 className="relative mt-8 text-lg font-semibold">{a.title}</h3>
            <p className="relative mt-1.5 text-sm leading-relaxed text-white/80">{a.body}</p>
            <span className="relative mt-5 inline-flex items-center gap-1 text-sm font-semibold">
              Join as {a.title.split(" ")[0].toLowerCase()}{" "}
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
        <h2 className="mx-auto max-w-lg text-center text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl">
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
          {shown.map((e) => (
            <Link
              key={e.id}
              to="/signup"
              className="group overflow-hidden rounded-[24px] bg-white shadow-[0_12px_40px_-20px_rgba(26,19,37,0.25)] transition-transform hover:-translate-y-1"
            >
              <div className="aspect-[4/3] overflow-hidden bg-[#efe8f8]">
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
      <h2 className="max-w-md text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl">
        Sponsorship, beyond expectations
      </h2>
      <div className="mt-10 grid gap-5 lg:grid-cols-4">
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
        <div>
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#e3f4ed] text-[#0e8a62]">
            <MapPin className="h-5 w-5" />
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl">
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
        <div className="relative">
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
          <h2 className="max-w-sm text-3xl font-semibold tracking-tight text-[#1a1325] md:text-4xl">
            Where our events happen
          </h2>
          <p className="max-w-xs text-sm leading-relaxed text-[#5b5468]">
            Vetted events across the cities shaping the Africa–Europe events economy.
          </p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {CITIES.map((c) => (
            <Link
              key={c.city}
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

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  const subscribe = useServerFn(subscribeNewsletter);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await subscribe({ data: { email: trimmed, source: "homepage" } });
      toast.success("You're subscribed — watch your inbox for IGE updates.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe. Try again.");
    } finally {
      setBusy(false);
    }
  };
  const col = "text-sm text-white/60 transition-colors hover:text-white";
  return (
    <footer className="bg-[#14101b] text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-semibold tracking-tight">Stay sponsorship-ready</p>
          <p className="mt-2 max-w-xs text-sm text-white/60">
            New vetted events and sponsorship insights, monthly.
          </p>
          <form
            onSubmit={submit}
            className="mt-6 flex max-w-sm items-center gap-2 border-b border-white/15 pb-2"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Your email"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              aria-label="Subscribe"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6b3fa0] text-white disabled:opacity-60"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        <div className="flex flex-col gap-3">
          <Link to="/" className={col}>
            Home
          </Link>
          <Link to="/about" className={col}>
            About us
          </Link>
          <Link to="/marketplace" className={col}>
            Events
          </Link>
          <Link to="/contact" className={col}>
            Contact us
          </Link>
        </div>
        <div className="flex flex-col gap-3">
          <a
            href="https://www.instagram.com/insideglobalevents"
            target="_blank"
            rel="noreferrer"
            className={col}
          >
            Instagram
          </a>
          <a
            href="https://www.linkedin.com/company/inside-global-events"
            target="_blank"
            rel="noreferrer"
            className={col}
          >
            LinkedIn
          </a>
          <Link to="/faq" className={col}>
            FAQ
          </Link>
          <Link to="/privacy" className={col}>
            Privacy
          </Link>
          <Link to="/terms" className={col}>
            Terms
          </Link>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-6">
          <span className="flex items-center gap-2.5">
            {/* The logo is dark ink, so it sits on a white tile on the dark footer. */}
            <span className="rounded-md bg-white p-1">
              <BrandLogo size="sm" />
            </span>
            <span className="text-sm font-semibold">Inside Global Events</span>
          </span>
          <span className="text-xs text-white/50">
            © {new Date().getFullYear()} Inside Global Events. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  );
}

export function LandingPage({ initialEvents }: { initialEvents?: LandingEventsResult }) {
  return (
    <div className="min-h-screen bg-white font-sans text-[#1a1325]">
      <Hero />
      <Audiences />
      <Events initial={initialEvents} />
      <Bento />
      <Corridor />
      <Footer />
    </div>
  );
}
