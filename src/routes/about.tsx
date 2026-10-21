import { createFileRoute } from "@tanstack/react-router";
import {
  ChartColumn,
  Check,
  Globe2,
  Handshake,
  ShieldCheck,
  Ticket,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/site-chrome";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { CtaBand, PageHero, PentagonIcon } from "@/components/landing/public-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About IGE — The Trust Layer for Event Sponsorship" },
      {
        name: "description",
        content:
          "Inside Global Events (IGE) is a vertically integrated event sponsorship marketplace and event intelligence platform built for the Africa–Europe corridor and the global events economy.",
      },
      {
        name: "keywords",
        content:
          "about IGE, event sponsorship marketplace, event intelligence, B2B sponsorship platform, Africa Europe events",
      },
      { property: "og:title", content: "About IGE — Event Sponsorship Marketplace" },
      {
        property: "og:description",
        content:
          "Commercial infrastructure for B2B event sponsorship: vetted organisers, verified sponsors, accredited referral partners.",
      },
      { property: "og:url", content: "https://www.insideglobalevents.com/about" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/about" }],
  }),
  component: AboutPage,
});

const PILLARS: { icon: LucideIcon; title: string; desc: string; bg: string; ink: string }[] = [
  {
    icon: Globe2,
    title: "Africa–Europe corridor",
    desc: "Purpose built for the trade, capital and culture flows between Africa and Europe, then extended to the wider global events economy.",
    bg: "bg-[#6b3fa0]",
    ink: "text-[#6b3fa0]",
  },
  {
    icon: ChartColumn,
    title: "Event intelligence",
    desc: "We structure sponsorship deals with data: audience, seniority, sector fit, ROI signals and verified track record, not glossy decks.",
    bg: "bg-[#2e8171]",
    ink: "text-[#2e8171]",
  },
  {
    icon: Ticket,
    title: "Sponsorship marketplace",
    desc: "A live two-sided marketplace where vetted organisers meet verified sponsors and actually close commercial deals.",
    bg: "bg-[#0e8a62]",
    ink: "text-[#0e8a62]",
  },
  {
    icon: Handshake,
    title: "Partner network",
    desc: "A distributed network of partnerships professionals who source, introduce and close sponsorships, earning transparent commission on every deal.",
    bg: "bg-[#4a2c73]",
    ink: "text-[#4a2c73]",
  },
];

const SERVE = [
  {
    title: "Event organisers",
    desc: "From cultural homecomings to global summits, list once and reach the sponsors that actually fit your audience.",
  },
  {
    title: "Brand sponsors",
    desc: "Discover vetted events your buyers attend, compare tiers and commit with confidence.",
  },
  {
    title: "Referral and media partners",
    desc: "Turn your network into recurring commission, or partner on coverage of vetted events.",
  },
];

function AboutPage() {
  const revealRef = useScrollReveal() as React.RefObject<HTMLDivElement>;
  return (
    <div ref={revealRef} className="min-h-screen bg-white font-sans text-[#1a1325]">
      <PageHero
        eyebrow="About IGE"
        title={
          <>
            Commercial infrastructure for the{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              global events economy
            </span>
          </>
        }
        subtitle="Inside Global Events is an event intelligence and sponsorship marketplace built for the Africa–Europe corridor. Not another listing directory: end-to-end infrastructure that connects organisers with sponsors, structures deals with data, and pays the partners who make them happen."
      />

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2
          data-reveal
          className="mx-auto max-w-xl text-center text-3xl font-semibold tracking-tight md:text-4xl"
        >
          Four pillars, one marketplace
        </h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p, i) => (
            <article
              key={p.title}
              data-reveal
              data-delay={String(i + 1)}
              className={`relative overflow-hidden rounded-[24px] p-6 text-white ${p.bg}`}
            >
              <div
                aria-hidden
                className="absolute -right-4 -top-4 h-28 w-28 bg-[radial-gradient(rgba(255,255,255,0.25)_3px,transparent_3.5px)] [background-size:16px_16px]"
              />
              <PentagonIcon icon={p.icon} iconClassName={p.ink} />
              <h3 className="relative mt-6 text-lg font-semibold">{p.title}</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-white/80">{p.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#faf8fd] py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 lg:grid-cols-2">
          <div>
            <span className="inline-flex rounded-full bg-[#efe8f8] px-3 py-1 text-xs font-medium text-[#6b3fa0]">
              Our mission
            </span>
            <h2 data-reveal className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              Make B2B sponsorship a vetted, data-led market
            </h2>
            <p className="mt-5 text-[15px] leading-relaxed text-[#5b5468]">
              Sponsorship is one of the largest line items in B2B marketing, yet it still runs on
              cold inbound, inflated decks and broker handshakes. IGE rebuilds that market: every
              event vetted, every sponsor verified, every partner accountable, every deal tracked.
            </p>
            <ul className="mt-8 space-y-4">
              {SERVE.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0e8a62]/10 text-[#0e8a62]">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <span className="font-semibold">{item.title}</span>
                    <span className="mt-0.5 block text-sm text-[#5b5468]">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div data-reveal data-delay="2" className="relative">
            <img
              src="/events/dentistry-students-team-doing-research-with-plastic-human-jaw-model.jpg"
              alt=""
              className="aspect-[4/3.4] w-full rounded-[28px] object-cover shadow-[0_24px_60px_-24px_rgba(26,19,37,0.45)]"
            />
            <div className="absolute -bottom-5 left-5 flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-lg">
              <PentagonIcon
                icon={ShieldCheck}
                className="h-10 w-10 bg-[#efe8f8]"
                iconClassName="mt-1 h-5 w-5 text-[#6b3fa0]"
              />
              <span>
                <span className="block text-sm font-semibold">Every listing vetted</span>
                <span className="block text-xs text-[#5b5468]">
                  Manual review before going live
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <CtaBand title="Join the marketplace" />
      <SiteFooter />
    </div>
  );
}
