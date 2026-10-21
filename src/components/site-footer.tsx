import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Instagram, Linkedin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { BrandWordmark } from "@/components/brand-logo";
import { subscribeNewsletter } from "@/lib/newsletter.functions";

const HI_EMAIL = "hi@insideglobalevents.com";
const IG_URL = "https://www.instagram.com/insideglobalevents";
const LINKEDIN_URL = "https://www.linkedin.com/company/inside-global-events";

// TAB 1 §1.13 (v6.2–6.4): four columns plus a newsletter strip. The Partner
// Of strip is deliberately not built yet.
const PODCAST_URL = "https://www.youtube.com/@alexboyoworld";
const TRIBE_FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSeNzRDQHA4zjwDYgf_bbZDDpiD_WA2LQY-_hy5T6ZteNE-G_w/viewform";
const ABW_URL = "https://alexboyoworld.com";

type FooterLink = { label: string; to?: string; hash?: string; href?: string };

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Platform",
    links: [
      { to: "/how-it-works", label: "How It Works" },
      { to: "/marketplace", label: "Marketplace (sign in required)" },
      { to: "/past-events", label: "Past Events" },
      { to: "/organisers", label: "For Organisers" },
      { to: "/sponsors", label: "For Sponsors" },
      { to: "/partners", label: "For Professionals" },
      { to: "/services", label: "IGE Services" },
      { to: "/login", label: "Sign In" },
      { to: "/signup", label: "Join IGE" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: TRIBE_FORM_URL, label: "Join the ABW PartnerUp Tribe" },
      { href: PODCAST_URL, label: "PartnerUp Podcast" },
      { href: IG_URL, label: "Follow us on Instagram" },
      { href: LINKEDIN_URL, label: "Follow us on LinkedIn" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "About" },
      { to: "/services", label: "IGE Services" },
      { href: ABW_URL, label: "AlexBoyo World (sister company)" },
      { href: `mailto:${HI_EMAIL}?subject=Careers%20at%20IGE`, label: "Careers" },
      { to: "/contact", label: "Contact" },
      { href: `mailto:${HI_EMAIL}`, label: "Email Admin" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/terms", label: "Terms" },
      { to: "/privacy", label: "Privacy" },
      { to: "/privacy", hash: "ndpr-gdpr", label: "NDPR and GDPR" },
    ],
  },
];

export function SiteFooter() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const subscribe = useServerFn(subscribeNewsletter);

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await subscribe({ data: { email: trimmed, source: "homepage" } });
      toast.success("You're subscribed — watch your inbox for IGE updates.");
      setEmail("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not subscribe. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const link = "text-sm text-white/60 transition-colors hover:text-white";
  return (
    <footer className="bg-[#14101b] text-white">
      <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
        <div>
          <p className="text-2xl font-semibold tracking-tight">Stay sponsorship-ready</p>
          <p className="mt-2 max-w-xs text-sm text-white/60">
            Upcoming events, intelligence reports and what we are building.
          </p>
          <form
            onSubmit={handleSubscribe}
            className="mt-6 flex max-w-sm items-center gap-2 border-b border-white/15 pb-2"
          >
            <input
              type="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email"
              aria-label="Your email"
              autoComplete="email"
              className="flex-1 bg-transparent text-sm text-white placeholder:text-white/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={submitting}
              aria-label="Subscribe"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6b3fa0] text-white transition-colors hover:bg-[#7d4fb5] disabled:opacity-60"
            >
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
              {col.title}
            </p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.to ? (
                    <Link to={l.to} hash={l.hash} className={link}>
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      {...(l.href && !l.href.startsWith("mailto:")
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                      className={link}
                    >
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <BrandWordmark onDark />
            <p className="text-xs text-white/50">
              © {new Date().getFullYear()} Inside Global Events, an AlexBoyo World company.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Inside Global Events on LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Inside Global Events on Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 text-white/60 transition-colors hover:border-white/40 hover:text-white"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
