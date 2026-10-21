import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, CheckCircle2, Instagram, Linkedin, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { SiteFooter } from "@/components/site-chrome";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";
import { PageHero, PentagonIcon, pill } from "@/components/landing/public-chrome";

const HI_EMAIL = "hi@insideglobalevents.com";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact IGE — Talk to the Event Sponsorship Team" },
      {
        name: "description",
        content:
          "Contact Inside Global Events about sponsorship opportunities, listing your event, partnerships or vetting.",
      },
      { property: "og:title", content: "Contact IGE — Event Sponsorship Marketplace" },
      {
        property: "og:description",
        content: "Talk to the IGE team about sponsorships, partnerships and trust enquiries.",
      },
      { property: "og:url", content: "https://www.insideglobalevents.com/contact" },
    ],
    links: [{ rel: "canonical", href: "https://www.insideglobalevents.com/contact" }],
  }),
  component: ContactPage,
});

const TOPICS = [
  "Listing an event",
  "Sponsoring an event",
  "Becoming a referral or media partner",
  "Vetting and trust",
  "Something else",
];

const contactSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.string().trim().email("Enter a valid email").max(255),
  company: z.string().trim().max(150).optional(),
  subject: z.string().trim().min(1, "Choose a topic").max(150),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000),
});

const CHANNELS = [
  { icon: Mail, label: "Email the team", value: HI_EMAIL, href: `mailto:${HI_EMAIL}` },
  {
    icon: Instagram,
    label: "Instagram",
    value: "@insideglobalevents",
    href: "https://www.instagram.com/insideglobalevents",
  },
  {
    icon: Linkedin,
    label: "LinkedIn",
    value: "Inside Global Events",
    href: "https://www.linkedin.com/company/inside-global-events",
  },
];

const field =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-3 text-sm text-[#1a1325] placeholder:text-[#8a8496] focus:border-[#6b3fa0] focus:outline-none focus:ring-4 focus:ring-[#6b3fa0]/10";

function ContactPage() {
  const revealRef = useScrollReveal() as React.RefObject<HTMLDivElement>;
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const parsed = contactSchema.safeParse(Object.fromEntries(new FormData(form).entries()));
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check your details");
      return;
    }
    setSubmitting(true);
    try {
      // Lands in the Admin Inbox and emails the team (TAB 6 §6.10).
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, source: "email_admin" }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Could not send your message");
      }
      setSent(true);
      form.reset();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send your message. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div ref={revealRef} className="min-h-screen bg-white font-sans text-[#1a1325]">
      <PageHero
        eyebrow="Contact us"
        title="Let's talk about your next event"
        subtitle="Listing an event, sponsoring one, or joining as a partner: send us a note and the IGE team will reply within one business day."
      />

      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-20 lg:grid-cols-[1fr_1.5fr]">
        <div className="flex flex-col gap-4">
          {CHANNELS.map((c, i) => (
            <a
              key={c.label}
              data-reveal
              data-delay={String(i + 1)}
              href={c.href}
              {...(c.href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noreferrer" })}
              className="group flex items-center gap-4 rounded-[24px] bg-[#faf8fd] p-5 transition-transform hover:-translate-y-0.5"
            >
              <PentagonIcon
                icon={c.icon}
                className="h-12 w-12 shrink-0 bg-[#e6dcf4]"
                iconClassName="mt-1 h-5 w-5 text-[#6b3fa0]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-xs text-[#5b5468]">{c.label}</span>
                <span className="block truncate font-semibold">{c.value}</span>
              </span>
              <ArrowUpRight className="h-4 w-4 text-[#6b3fa0] transition-transform group-hover:rotate-45" />
            </a>
          ))}
          <div
            data-reveal
            data-delay="4"
            className="relative overflow-hidden rounded-[24px] bg-[#6b3fa0] p-6 text-white"
          >
            <div
              aria-hidden
              className="absolute -bottom-12 -right-10 h-40 w-40 rounded-full bg-[#0e8a62]/50 blur-2xl"
            />
            <p className="relative text-lg font-semibold">Want IGE to run it for you?</p>
            <p className="relative mt-1.5 text-sm text-white/80">
              Sponsorship sales, production and partnerships, handled by the IGE team.
            </p>
            <Link to="/services" className={`${pill} relative mt-5 bg-white text-[#4a2c73]`}>
              IGE Services <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div
          data-reveal
          data-delay="2"
          className="rounded-[28px] border border-black/5 bg-white p-6 shadow-[0_20px_60px_-30px_rgba(26,19,37,0.3)] sm:p-10"
        >
          {sent ? (
            <div className="flex h-full flex-col items-center justify-center py-16 text-center">
              <CheckCircle2 className="h-12 w-12 text-[#0e8a62]" />
              <p className="mt-4 text-xl font-semibold">Message sent</p>
              <p className="mt-2 max-w-sm text-sm text-[#5b5468]">
                Thanks for reaching out. We've emailed you a copy and will reply within one business
                day.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-sm font-semibold text-[#6b3fa0] hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2" noValidate>
              <label className="grid gap-1.5 text-sm font-medium">
                Name
                <input name="name" autoComplete="name" required className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Email
                <input name="email" type="email" autoComplete="email" required className={field} />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Company <span className="sr-only">(optional)</span>
                <input
                  name="company"
                  autoComplete="organization"
                  placeholder="Optional"
                  className={field}
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium">
                Topic
                <select name="subject" required defaultValue="" className={field}>
                  <option value="" disabled>
                    Choose a topic
                  </option>
                  {TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium sm:col-span-2">
                Message
                <textarea name="message" rows={6} required className={`${field} resize-y`} />
              </label>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`${pill} bg-[#6b3fa0] text-white shadow-[0_12px_30px_-10px_rgba(107,63,160,0.7)] disabled:opacity-60`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Sending…
                    </>
                  ) : (
                    <>
                      Send message <ArrowUpRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
