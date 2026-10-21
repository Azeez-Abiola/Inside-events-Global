import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Handshake,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { SiteFooter } from "@/components/site-chrome";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { CtaBand, PageHero, PentagonIcon, pill } from "@/components/landing/public-chrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How Event Sponsorship Works on IGE — From Pitch to Paid" },
      {
        name: "description",
        content:
          "See how IGE structures B2B event sponsorship deals end-to-end: vetting, sponsorship packages, sponsor matching, contracts, payment, and ROI tracking. From signup to signed sponsorship in days.",
      },
      {
        name: "keywords",
        content:
          "how event sponsorship works, sponsorship process, sponsorship deal flow, sponsorship contract, sponsorship activation, sponsorship payment",
      },
      { property: "og:title", content: "How Event Sponsorship Works on IGE" },
      {
        property: "og:description",
        content: "From signup to signed sponsorship in days, not quarters.",
      },
      { property: "og:url", content: "https://www.insideglobalevents.com/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/how-it-works" }],
  }),
  component: HowItWorksPage,
});

const STEPS: {
  n: string;
  title: string;
  desc: string;
  icon: LucideIcon;
  bg: string;
  ink: string;
}[] = [
  {
    n: "01",
    title: "Sign up & verify",
    desc: "Pick your side: organiser, sponsor, referral or media partner. Sign up with email, finish your profile from your dashboard, and start browsing vetted opportunities.",
    icon: BadgeCheck,
    bg: "bg-[#6b3fa0]",
    ink: "text-[#6b3fa0]",
  },
  {
    n: "02",
    title: "List, browse or refer",
    desc: "Organisers publish events through a guided flow. Sponsors discover and shortlist. Partners share trackable referral links.",
    icon: CalendarDays,
    bg: "bg-[#2e8171]",
    ink: "text-[#2e8171]",
  },
  {
    n: "03",
    title: "Get vetted",
    desc: "Every event passes IGE's manual vetting before it goes live. No ghost listings, no inflated attendance, no surprises.",
    icon: ShieldCheck,
    bg: "bg-[#0e8a62]",
    ink: "text-[#0e8a62]",
  },
  {
    n: "04",
    title: "Match & close",
    desc: "IGE introduces the right sponsors to the right events, structures the deal, and tracks it to payment, with partners paid commission on close.",
    icon: Handshake,
    bg: "bg-[#4a2c73]",
    ink: "text-[#4a2c73]",
  },
];

const SIDES = [
  {
    title: "For organisers",
    points: [
      "One listing, matched sponsors",
      "Clear sponsorship tiers",
      "Deals tracked end to end",
    ],
    to: "/organisers",
  },
  {
    title: "For sponsors",
    points: ["Vetted events only", "Audience and seniority data", "Structured agreements"],
    to: "/sponsors",
  },
  {
    title: "For partners",
    points: ["Trackable referral links", "Transparent commission", "Paid on close"],
    to: "/partners",
  },
] as const;

function HowItWorksPage() {
  const revealRef = useScrollReveal() as React.RefObject<HTMLDivElement>;
  return (
    <div ref={revealRef} className="min-h-screen bg-white font-sans text-[#1a1325]">
      <PageHero
        eyebrow="How it works"
        title={
          <>
            From signup to signed sponsorship,{" "}
            <span className="bg-brand-gradient bg-clip-text text-transparent">
              in days, not quarters
            </span>
          </>
        }
        subtitle="IGE runs the whole sponsorship journey: vetting, matching, agreements, payment and tracking, so organisers and sponsors spend their time on the event, not the chase."
      >
        <Link
          to="/signup"
          className={`${pill} mt-8 bg-[#6b3fa0] text-white shadow-[0_12px_30px_-10px_rgba(107,63,160,0.7)]`}
        >
          Create your account <ArrowUpRight className="h-4 w-4" />
        </Link>
      </PageHero>

      <section className="mx-auto max-w-6xl px-6 py-24">
        <h2
          data-reveal
          className="mx-auto max-w-xl text-center text-3xl font-semibold tracking-tight md:text-4xl"
        >
          Four steps to a closed deal
        </h2>
        <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              data-reveal
              data-delay={String(i + 1)}
              className={`relative overflow-hidden rounded-[24px] p-6 text-white ${s.bg}`}
            >
              <span
                aria-hidden
                className="absolute -right-1 top-1 text-[96px] font-semibold leading-none text-white/10"
              >
                {s.n}
              </span>
              <PentagonIcon icon={s.icon} iconClassName={s.ink} />
              <h3 className="relative mt-6 text-lg font-semibold">{s.title}</h3>
              <p className="relative mt-1.5 text-sm leading-relaxed text-white/80">{s.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-[#faf8fd] py-24">
        <div className="mx-auto max-w-6xl px-6">
          <h2 data-reveal className="max-w-md text-3xl font-semibold tracking-tight md:text-4xl">
            What each side gets
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {SIDES.map((side, i) => (
              <Link
                key={side.to}
                data-reveal
                data-delay={String(i + 1)}
                to={side.to}
                className="group rounded-[24px] bg-white p-7 shadow-[0_12px_40px_-20px_rgba(26,19,37,0.25)] transition-transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between">
                  <p className="text-lg font-semibold">{side.title}</p>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#efe8f8] text-[#6b3fa0] transition-transform group-hover:rotate-45">
                    <ArrowUpRight className="h-4 w-4" />
                  </span>
                </div>
                <ul className="mt-5 space-y-2.5">
                  {side.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-sm text-[#5b5468]">
                      <Check className="h-4 w-4 text-[#0e8a62]" /> {p}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
      <SiteFooter />
    </div>
  );
}
