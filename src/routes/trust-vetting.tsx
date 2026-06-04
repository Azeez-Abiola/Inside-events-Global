import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, FileCheck2, Search, UserCheck, AlertTriangle } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/trust-vetting")({
  head: () => ({
    meta: [
      { title: "Sponsorship Trust & Vetting — How IGE Verifies Every Deal" },
      { name: "description", content: "How IGE vets organisers, sponsors, and referral partners. Identity checks, track record review, partner accreditation, and continuous monitoring make IGE the trust layer for B2B event sponsorship." },
      { name: "keywords", content: "vetted event sponsorship, sponsorship due diligence, sponsorship red flags, sponsorship trust, verified sponsors, verified event organisers" },
      { property: "og:title", content: "Sponsorship Trust & Vetting — IGE" },
      { property: "og:description", content: "Every organiser, sponsor, and partner is vetted before any deal is brokered." },
      { property: "og:url", content: "https://www.insideglobalevents.com/trust-vetting" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/trust-vetting" }],
  }),
  component: TrustVettingPage,
});

function TrustVettingPage() {
  const steps = [
    { icon: FileCheck2, title: "Identity & entity verification", desc: "Government ID, company registration, and beneficial ownership are verified for every organiser and sponsor account." },
    { icon: Search, title: "Track record review", desc: "Past events, audience data, sponsor references, and financial standing are reviewed by the IGE vetting desk." },
    { icon: UserCheck, title: "Partner accreditation", desc: "Referral partners complete an accreditation interview and sign a code of conduct before earning commission." },
    { icon: ShieldCheck, title: "Continuous monitoring", desc: "Listings, deals, and partner activity are continuously monitored. Accounts can be suspended at any time for breach of standards." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-6 py-16">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">Trust &amp; Vetting</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Every organiser, sponsor, and referral partner on Inside Global Events 2026 is vetted before they
          can transact. Vetting is what makes the marketplace work.
        </p>

        <section className="mt-12 grid gap-6 md:grid-cols-2">
          {steps.map((s) => (
            <div key={s.title} className="rounded-2xl border border-border/60 bg-card p-6 shadow-soft">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </section>

        <section className="mt-12 space-y-4 text-sm leading-relaxed">
          <h2 className="font-display text-2xl font-semibold">Compliance</h2>
          <p>
            IGE complies with applicable data protection law (including GDPR and the Nigeria Data
            Protection Act) and anti-money-laundering requirements. KYC and KYB records are retained
            for the period required by law.
          </p>
          <p>
            Payments are processed through licensed providers (Stripe, Paystack) on organisers&apos;
            own merchant accounts. IGE does not custody sponsor funds.
          </p>

          <h2 className="font-display text-2xl font-semibold pt-6">Disclaimers</h2>
          <div className="flex gap-3 rounded-lg border border-border/60 bg-muted/40 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-muted-foreground">
              Vetting is a good-faith review based on the information available at the time of
              onboarding. It is not a guarantee of event outcomes, sponsor performance, or financial
              return. Sponsors and organisers remain responsible for their own due diligence on each
              deal.
            </p>
          </div>
        </section>

        <div className="mt-12 rounded-2xl bg-brand-gradient p-8 text-white">
          <h3 className="font-display text-2xl font-semibold">Concerned about a listing or partner?</h3>
          <p className="mt-2 text-sm text-white/90">Report it directly to the IGE trust desk.</p>
          <Link to="/contact" className="mt-4 inline-flex rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-foreground">
            Contact trust desk
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
