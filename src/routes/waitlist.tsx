import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { CheckCircle2, Sparkles, MessageSquare } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  WaitlistIntake,
  WaitlistProgressBar,
  type WaitlistProgress,
} from "@/components/waitlist-intake";
import {
  WAITLIST_AUDIENCES,
  type WaitlistAudience,
  isWaitlistAudience,
} from "@/lib/waitlist-audiences";

const searchSchema = z.object({
  audience: z
    .enum(["organiser", "sponsor", "referral_partner", "media_partner"])
    .optional(),
});

export const Route = createFileRoute("/waitlist")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Join the waitlist · Inside Global Events 2026" },
      {
        name: "description",
        content:
          "Join the IGE founding waitlist. Role-specific intake for organisers, sponsors, referral partners, and media partners — saved for launch notifications.",
      },
      { property: "og:title", content: "Join the IGE waitlist" },
      {
        property: "og:description",
        content:
          "Tell us your role and we'll collect the right details for founding-member access and launch updates.",
      },
    ],
  }),
  component: WaitlistPage,
});

const benefits: Record<WaitlistAudience, { title: string; desc: string }[]> = {
  organiser: [
    { title: "Early platform access", desc: "First onto the platform before public launch." },
    { title: "Featured listing", desc: "Spotlight in the launch-week newsletter and social push." },
    { title: "Sponsor match priority", desc: "Top of brand recommendations in the IGE Intelligence Engine." },
    { title: "Vetted badge, year one", desc: "I.G.Events vetted badge at no cost for founding organisers." },
    { title: "Beta pricing", desc: "Platform fees locked at founding-member rates for 12 months." },
  ],
  sponsor: [
    { title: "First look at events", desc: "Preview every listed event before the platform opens publicly." },
    { title: "Custom event matching", desc: "Hand-matched to events before AI matching goes live." },
    { title: "Exhibition booth priority", desc: "First choice of exhibition spaces at launch-week events." },
    { title: "Sponsorship rate lock", desc: "Founding-brand rates locked for your first 3 commitments." },
    { title: "Brand profile setup", desc: "White-glove onboarding with the IGE team." },
  ],
  referral_partner: [
    { title: "Premium commission tier", desc: "Founding partners start on the IGB premium rate from day one." },
    { title: "First pick of events", desc: "Generate referral links for launch-week events before anyone else." },
    { title: "Direct deal desk", desc: "Dedicated IGE partnerships contact to close your first deal." },
    { title: "Founding partner badge", desc: "Permanent IGB Founding Partner badge on your profile." },
    { title: "Rate lock", desc: "Commission rates locked at launch terms for 12 months." },
  ],
  media_partner: [
    { title: "Launch-week coverage", desc: "Priority access to flagship events for founding media partners." },
    { title: "Co-marketing slots", desc: "Newsletter, social, and documentary collaboration opportunities." },
    { title: "Verified event pipeline", desc: "Curated events with audience data — not cold PR pitches." },
    { title: "Partner badge", desc: "IGE Media Partner status on your profile from day one." },
    { title: "Direct editorial contact", desc: "Line to the IGE partnerships and content team." },
  ],
};

function WaitlistPage() {
  const search = Route.useSearch();
  const initialAudience = isWaitlistAudience(search.audience) ? search.audience : "organiser";
  const [audience, setAudience] = useState<WaitlistAudience>(initialAudience);
  const [progress, setProgress] = useState<WaitlistProgress>({
    step: 1,
    total: 2,
    label: "Your role",
  });
  const audienceMeta = WAITLIST_AUDIENCES.find((a) => a.id === audience);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--gradient-brand-diag)" }}
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Founding waitlist open
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Join the <span className="text-brand-gradient">IGE waitlist.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Pick your role, answer a few tailored questions, and we&apos;ll save your details for
              founding-member access and launch notifications.
            </p>
            <div className="mt-8">
              <a
                href="mailto:hi@insideglobalevents.com"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4" />
                Email the team
              </a>
            </div>
          </div>
        </section>

        <WaitlistProgressBar {...progress} />

        <section className="mx-auto max-w-4xl px-6 py-10 md:py-14">
          <WaitlistIntake
            initialAudience={initialAudience}
            onAudienceChange={setAudience}
            onProgressChange={setProgress}
            progressive
          />
        </section>

        <section className="mx-auto max-w-3xl border-t border-border px-6 py-14 pb-20">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
              {audienceMeta?.shortLabel ?? "Founding"} · benefits
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              What founding members get.
            </h2>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {benefits[audience].map((b) => (
              <li
                key={b.title}
                className="flex gap-3 rounded-xl border border-border/60 bg-card/40 p-4"
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                <div>
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-sm text-muted-foreground">{b.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
