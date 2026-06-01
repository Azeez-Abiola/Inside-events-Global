import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Megaphone, Globe2, Handshake, Sparkles, MessageSquare } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import {
  BrandWaitlistForm,
  OrganiserWaitlistForm,
  AffiliateWaitlistForm,
  DonePanel,
} from "@/components/waitlist-forms";

export const Route = createFileRoute("/waitlist")({
  head: () => ({
    meta: [
      { title: "Join the waitlist · Inside Global Events" },
      { name: "description", content: "Get founding-member access to Inside Global Events. Waitlist opens for organisers, sponsors, and referral partners ahead of the 1 July launch." },
      { property: "og:title", content: "Join the IGE waitlist" },
      { property: "og:description", content: "Founding-member access, locked-in rates, and priority matching before the 1 July launch." },
    ],
  }),
  component: WaitlistPage,
});

type Audience = "organiser" | "sponsor" | "referral_partner";

const audiences: { id: Audience; label: string; icon: typeof Megaphone; tag: string }[] = [
  { id: "organiser", label: "Event organiser", icon: Megaphone, tag: "Organisers" },
  { id: "sponsor", label: "Brand / sponsor", icon: Globe2, tag: "Sponsors" },
  { id: "referral_partner", label: "Referral partner", icon: Handshake, tag: "Referral partners" },
];

const benefits: Record<Audience, { title: string; desc: string }[]> = {
  organiser: [
    { title: "Early platform access", desc: "First onto the platform on 1 June — before public launch." },
    { title: "Featured listing", desc: "Your event spotlighted in the launch-week newsletter and social push." },
    { title: "Sponsor match priority", desc: "Top of brand recommendations in the IGE Intelligence Engine." },
    { title: "I.G.Events vetted, free year one", desc: "Vetted badge applied at no cost for all founding organiser waitlist members." },
    { title: "Beta pricing", desc: "Platform fees locked at founding-member rates for 12 months." },
    { title: "Founding community", desc: "Direct access to Alero and the IGE partnerships team via WhatsApp group." },
  ],
  sponsor: [
    { title: "First look at events", desc: "Preview every listed event before the platform opens to the public in July." },
    { title: "Custom event matching", desc: "Our team hand-matches brands to events before AI matching goes live." },
    { title: "Exhibition booth priority", desc: "First choice of exhibition spaces at launch-week events before public listing." },
    { title: "Sponsorship rate lock", desc: "Founding-brand rates locked for your first 3 sponsorship commitments." },
    { title: "Brand profile setup", desc: "White-glove onboarding session with the IGE team." },
  ],
  referral_partner: [
    { title: "Premium commission tier", desc: "Founding partners start on the IGB premium commission rate from day one." },
    { title: "First pick of events", desc: "Generate referral links for launch-week events before anyone else." },
    { title: "Direct deal desk", desc: "Dedicated IGE partnerships contact to help you close your first deal." },
    { title: "Founding partner badge", desc: "Permanent IGB Founding Partner badge on your profile." },
    { title: "Rate lock", desc: "Commission rates locked at launch terms for 12 months." },
  ],
};

const LAUNCH_TS = new Date("2026-07-01T00:00:00Z").getTime();

const LAUNCH = new Date("2026-07-01T00:00:00Z").getTime();

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds, done: diff === 0 };
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  const v = value.toString().padStart(2, "0");
  return (
    <div className="rounded-2xl border border-border/60 bg-card/70 px-4 py-5 text-center backdrop-blur md:px-7 md:py-7">
      <div className="font-display text-4xl font-bold tabular-nums text-brand-gradient md:text-6xl">{v}</div>
      <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-xs">{label}</div>
    </div>
  );
}

function WaitlistPage() {
  const [audience, setAudience] = useState<Audience>("organiser");
  const [done, setDone] = useState(false);
  const { days, hours, minutes, seconds } = useCountdown(LAUNCH_TS);

  // Reset done state when switching audience
  function selectAudience(a: Audience) {
    setAudience(a);
    setDone(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        {/* Hero + countdown */}
        <section className="relative overflow-hidden border-b border-border">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl"
            style={{ background: "var(--gradient-brand-diag)" }}
          />
          <div className="relative mx-auto max-w-5xl px-6 py-20 text-center md:py-24">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Founding members only
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">
              Join the <span className="text-brand-gradient">IGE waitlist.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Inside Global Events opens to the public on 1 July. Founding organisers,
              brands, and referral partners get early access, locked-in rates, and
              priority matching.
            </p>

            <div className="mt-10 grid grid-cols-4 gap-3 md:gap-4">
              <CountdownCell value={days} label="Days" />
              <CountdownCell value={hours} label="Hours" />
              <CountdownCell value={minutes} label="Minutes" />
              <CountdownCell value={seconds} label="Seconds" />
            </div>
            <div className="mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Public launch · 1 July
            </div>
            <div className="mt-6">
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-muted"
              >
                <MessageSquare className="h-4 w-4" />
                Talk to the team
              </Link>
            </div>
          </div>
        </section>

        {/* Audience picker */}
        <section className="mx-auto max-w-6xl px-6 pt-16">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {audiences.map((a) => {
              const Active = audience === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => selectAudience(a.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    Active
                      ? "border-transparent bg-brand-gradient text-white shadow-soft"
                      : "border-border bg-card text-foreground hover:bg-muted"
                  }`}
                >
                  <a.icon className="h-4 w-4" />
                  {a.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-3xl px-6 py-10">
          <div className="text-center">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
              {audiences.find((a) => a.id === audience)?.tag} · founding benefits
            </div>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
              What founding members get.
            </h2>
          </div>
          <ul className="mt-8 grid gap-4 md:grid-cols-2">
            {benefits[audience].map((b) => (
              <li key={b.title} className="flex gap-3 rounded-xl border border-border/60 bg-card/40 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" />
                <div>
                  <div className="font-semibold">{b.title}</div>
                  <div className="text-sm text-muted-foreground">{b.desc}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Long-form intake */}
        <section className="mx-auto max-w-4xl px-6 pb-20">
          {done ? (
            <DonePanel onAddAnother={() => setDone(false)} />
          ) : (
            <>
              {audience === "sponsor" && <BrandWaitlistForm onDone={() => setDone(true)} />}
              {audience === "organiser" && <OrganiserWaitlistForm onDone={() => setDone(true)} />}
              {audience === "referral_partner" && <AffiliateWaitlistForm onDone={() => setDone(true)} />}
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
