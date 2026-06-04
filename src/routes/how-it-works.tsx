import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

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
      { property: "og:description", content: "From signup to signed sponsorship in days, not quarters." },
      { property: "og:url", content: "https://www.insideglobalevents.com/how-it-works" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/how-it-works" }],
  }),
  component: HowItWorksPage,
});

function HowItWorksPage() {
  const steps = [
    {
      n: "01",
      title: "Sign up & verify",
      desc:
        "Pick your side: organiser, sponsor, or referral partner. Verify with your work email or LinkedIn so the marketplace stays clean.",
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
        "Every event passes IGE manual vetting before going live. No ghost listings, no fake attendance numbers, no surprises.",
    },
    {
      n: "04",
      title: "Connect & commit",
      desc:
        "Verified sponsors message organisers directly. Commit through structured forms, pay securely, and partners get paid commission on close.",
    },
  ];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
          How it works
        </div>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight md:text-6xl">
          From signup to signed sponsorship, <span className="text-brand-gradient">in days, not quarters.</span>
        </h1>

        <ol className="mt-14 grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <li key={s.n} className="rounded-2xl border border-border bg-card p-7">
              <div className="font-display text-sm font-bold text-brand-gradient">
                {s.n}
              </div>
              <h2 className="mt-3 font-display text-xl font-bold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {s.desc}
              </p>
            </li>
          ))}
        </ol>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 rounded-md bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5"
          >
            Create your account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/marketplace"
            className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            Browse events
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
