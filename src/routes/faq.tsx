import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader, SiteFooter } from "@/components/site-chrome";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { HELP_ARTICLES } from "@/lib/help-center";
import { recordHelpFeedback } from "@/lib/help-feedback.functions";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Event Sponsorship FAQ — Vetting, ROI, Matching & Payouts | IGE" },
      { name: "description", content: "Answers to the most common event sponsorship questions: how vetting works, sponsorship ROI, how matching works, payouts, and referral partner earnings." },
      { name: "keywords", content: "event sponsorship FAQ, sponsorship ROI, sponsorship commission, sponsorship vetting, sponsorship payouts, referral commission" },
      { property: "og:title", content: "Event Sponsorship FAQ — IGE" },
      { property: "og:description", content: "Vetting, ROI, matching, and payouts — answered." },
      { property: "og:url", content: "https://www.insideglobalevents.com/faq" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/faq" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: HELP_ARTICLES.map((a) => ({ "@type": "Question", name: a.q, acceptedAnswer: { "@type": "Answer", text: a.a } })),
      }),
    }],
  }),
  component: FAQPage,
});

// One source of truth with the Live Chat assistant (TAB 17 §17.3–17.4).
const sections = [...new Set(HELP_ARTICLES.map((a) => a.category))].map((title) => ({
  title,
  items: HELP_ARTICLES.filter((a) => a.category === title),
}));

function FAQPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-6 py-16">
        <Link to="/" className="text-sm text-primary hover:underline">← Home</Link>
        <h1 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-5xl">Frequently asked questions</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Quick answers for organisers, sponsors, partners and creators. Signed in? Use the chat bubble for instant help. Can&apos;t find what you
          need?{" "}
          <a href="mailto:hi@insideglobalevents.com" className="text-primary hover:underline">
            Email hi@insideglobalevents.com
          </a>
          .
        </p>

        <div className="mt-12 space-y-12">
          {sections.map((s) => (
            <section key={s.title}>
              <h2 className="font-display text-2xl font-semibold">{s.title}</h2>
              <Accordion type="single" collapsible className="mt-4">
                {s.items.map((item, i) => (
                  <AccordionItem key={item.q} value={`${s.title}-${i}`}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {item.a}
                      <WasThisHelpful articleId={item.id} />
                    </AccordionContent>
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

/** "Was this helpful?" on every answer (TAB 17 §17.3). */
function WasThisHelpful({ articleId }: { articleId: string }) {
  const record = useServerFn(recordHelpFeedback);
  const [answered, setAnswered] = useState(false);
  if (answered) return <p className="mt-3 text-xs text-muted-foreground">Thanks for the feedback.</p>;
  const vote = (helpful: boolean) => {
    setAnswered(true);
    void record({ data: { article_id: articleId, helpful, source: "faq" } }).catch(() => {});
  };
  return (
    <div className="mt-3 flex items-center gap-2 text-xs">
      Was this helpful?
      <button type="button" aria-label="Yes, helpful" onClick={() => vote(true)} className="rounded p-1 hover:bg-muted">
        <ThumbsUp className="h-3.5 w-3.5" />
      </button>
      <button type="button" aria-label="No, not helpful" onClick={() => vote(false)} className="rounded p-1 hover:bg-muted">
        <ThumbsDown className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
