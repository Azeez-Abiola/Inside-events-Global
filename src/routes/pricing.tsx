import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing & Commission · Inside Global Events 2026" },
      { name: "description", content: "How Inside Global Events 2026 earns revenue: listing is free, commission is charged only when a sponsorship deal closes." },
      { property: "og:title", content: "Pricing & Commission · Inside Global Events 2026" },
      { property: "og:description", content: "Transparent commission model for organisers, sponsors, and referral partners." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const tiers = [
    {
      name: "Organisers",
      price: "Zero listing fee",
      desc: "List vetted events at no upfront cost. IGE takes a platform commission only when a sponsorship deal reaches payment received.",
      points: [
        "Free to create and submit a listing",
        "10% platform commission on closed deals",
        "Bring your own Stripe or Paystack account",
        "No charge if a deal does not close",
      ],
    },
    {
      name: "Sponsors",
      price: "Free to browse & deal",
      desc: "No fees for sponsors. You pay the organiser directly through their payment provider for the agreed sponsorship value.",
      points: [
        "Free vetted-organiser access",
        "No platform fee added to your invoice",
        "Pay the organiser directly",
        "Audit-ready deal records",
      ],
      featured: true,
    },
    {
      name: "Referral partners",
      price: "Earn on every closed deal",
      desc: "Accredited partners earn a share of IGE's platform commission for every sponsorship they introduce that reaches payment.",
      points: [
        "Up to 20% of IGE's commission per deal",
        "Paid out of IGE commission, never added on top",
        "Transparent dashboard for tracked deals",
        "Monthly payouts once a deal settles",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-6 py-16">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">Pricing &amp; Commission</h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          IGE is a success-based marketplace. Listing is free. We only earn when a sponsorship deal
          actually closes.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl border p-7 shadow-soft ${
                t.featured ? "border-primary bg-brand-gradient text-white" : "border-border/60 bg-card"
              }`}
            >
              <div className={`text-xs font-semibold uppercase tracking-[0.14em] ${t.featured ? "text-white/80" : "text-primary"}`}>
                {t.name}
              </div>
              <div className="mt-3 font-display text-2xl font-bold">{t.price}</div>
              <p className={`mt-2 text-sm ${t.featured ? "text-white/90" : "text-muted-foreground"}`}>{t.desc}</p>
              <ul className="mt-5 space-y-2.5">
                {t.points.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${t.featured ? "text-white" : "text-primary"}`} />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <section className="mt-16 grid gap-8 rounded-2xl border border-border/60 bg-muted/30 p-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-2xl font-semibold">How commission works</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              When an organiser closes a sponsorship through IGE, the organiser collects the full
              sponsorship value via their connected payment provider. IGE invoices the platform
              commission on that value after payment is confirmed. If a referral partner introduced
              the deal, their share is paid out of IGE&apos;s commission.
            </p>
          </div>
          <div>
            <h2 className="font-display text-2xl font-semibold">No hidden fees</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              No subscription fees, no listing fees, no charge to browse. Payment processing fees
              charged by Stripe or Paystack are passed through at cost and never marked up by IGE.
            </p>
          </div>
        </section>

        <div className="mt-12 text-center">
          <Link to="/signup" className="inline-flex rounded-md bg-brand-gradient px-6 py-3 text-sm font-semibold text-white shadow-soft">
            Get started for free
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
