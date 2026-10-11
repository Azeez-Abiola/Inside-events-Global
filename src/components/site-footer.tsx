import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Instagram, Linkedin } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/brand-logo";
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
      { to: "/", hash: "how", label: "How It Works" },
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

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    {l.to ? (
                      <Link
                        to={l.to}
                        hash={l.hash}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    ) : (
                      <a
                        href={l.href}
                        {...(l.href && !l.href.startsWith("mailto:")
                          ? { target: "_blank", rel: "noreferrer" }
                          : {})}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
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

        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-border bg-muted/30 p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-semibold text-foreground">Newsletter</p>
            <p className="text-sm text-muted-foreground">
              Upcoming events, intelligence reports and what we are building.
            </p>
          </div>
          <form onSubmit={handleSubscribe} className="flex w-full gap-2 md:w-auto">
            <Input
              type="email"
              name="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-lg border-border bg-background md:w-72"
              autoComplete="email"
              required
            />
            <Button
              type="submit"
              disabled={submitting}
              className="h-10 rounded-lg bg-brand-gradient font-semibold text-white"
            >
              {submitting ? "Subscribing…" : "Subscribe"}
            </Button>
          </form>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <p className="text-xs text-muted-foreground">
              Copyright 2026 Inside Global Events, an AlexBoyo World company.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Inside Global Events on LinkedIn"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Linkedin className="h-4 w-4" />
            </a>
            <a
              href={IG_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Inside Global Events on Instagram"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
