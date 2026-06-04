import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Event Sponsorship FAQ — Vetting, ROI, Commission & Payouts | IGE" },
      { name: "description", content: "Answers to the most common event sponsorship questions: how vetting works, sponsorship ROI, commission rates, payouts, contracts, and referral partner earnings." },
      { name: "keywords", content: "event sponsorship FAQ, sponsorship ROI, sponsorship commission, sponsorship vetting, sponsorship payouts, referral commission" },
      { property: "og:title", content: "Event Sponsorship FAQ — IGE" },
      { property: "og:description", content: "Vetting, ROI, commission, and payouts — answered." },
      { property: "og:url", content: "https://www.insideglobalevents.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "How long does vetting take?", acceptedAnswer: { "@type": "Answer", text: "Most listings and accounts are reviewed within 2 to 5 business days once required documents are submitted." } },
          { "@type": "Question", name: "How much commission does IGE charge?", acceptedAnswer: { "@type": "Answer", text: "IGE charges 10% platform commission on closed sponsorship deals. Sponsors pay no fees." } },
        ],
      }),
    }],
  }),
  component: FAQPage,
});

const sections = [
  {
    title: "For organisers",
    items: [
      { q: "Is listing my event free?", a: "Yes. Creating and submitting an event listing is free. IGE only earns when a sponsorship deal you brokered through the platform reaches payment received." },
      { q: "How long does the vetting process take?", a: "Most organiser accounts and listings are reviewed within 2 to 5 business days, provided you submit company registration, identity, and past event evidence on time." },
      { q: "How and when do I get paid?", a: "Sponsors pay you directly through your connected Stripe or Paystack account. IGE does not custody your funds. Our commission is invoiced after payment is confirmed." },
      { q: "What happens if a deal does not close?", a: "Nothing. You are not charged a commission unless a deal reaches payment received." },
    ],
  },
  {
    title: "For sponsors",
    items: [
      { q: "Do sponsors pay any platform fee?", a: "No. Browsing, messaging organisers, and closing deals on IGE is free for sponsors. You pay the organiser the agreed sponsorship value directly." },
      { q: "How are organisers vetted?", a: "Every organiser is verified for identity, company registration, and past event delivery before they can be listed. See our Trust & Vetting page for the full process." },
      { q: "Can I get audit-ready records?", a: "Yes. Every deal generates a structured record of the agreement, deliverables, invoice, and payment confirmation." },
    ],
  },
  {
    title: "For referral partners",
    items: [
      { q: "How much can I earn?", a: "Accredited partners earn up to 20% of IGE's platform commission on every introduced deal that reaches payment received." },
      { q: "When are payouts made?", a: "Commission payouts run monthly, after the underlying sponsorship payment has settled and any refund window has closed." },
      { q: "How is my referral tracked?", a: "Each partner has a unique referral link and dashboard. Deals introduced via that link are attributed automatically and visible end-to-end." },
      { q: "What is not allowed?", a: "Self-referrals through affiliated entities, fraudulent introductions, and spam outreach. Violations result in forfeited commission and account suspension." },
    ],
  },
];

function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Quick answers for organisers, sponsors, and referral partners. Can&apos;t find what you
          need? <Link to="/contact" className="text-primary hover:underline">Talk to the team</Link>.
        </p>

        <div className="mt-12 space-y-12">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
              <Accordion type="single" collapsible className="mt-4">
                {s.items.map((item, i) => (
                  <AccordionItem key={item.q} value={`${s.title}-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
