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

const PLATFORM_LINKS = [
  { to: "/how-it-works" as const, label: "How it Works" },
  { to: "/marketplace" as const, label: "Marketplace" },
  { to: "/pricing" as const, label: "Pricing" },
  // { to: "/knowledge-base" as const, label: "Intelligence" },
];

const COMPANY_LINKS = [
  { to: "/about" as const, label: "About" },
  { href: "https://www.instagram.com/insideglobalevents", label: "PartnerUp Podcast", external: true },
  { href: `mailto:${HI_EMAIL}?subject=Careers%20at%20IGE`, label: "Careers", external: true },
  { href: `mailto:${HI_EMAIL}`, label: "Contact", external: true },
];

const LEGAL_LINKS = [
  { to: "/terms" as const, label: "Terms" },
  { to: "/privacy" as const, label: "Privacy" },
  { to: "/privacy" as const, label: "NDPR / GDPR" },
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
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Platform</p>
            <ul className="mt-4 space-y-2.5">
              {PLATFORM_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Company</p>
            <ul className="mt-4 space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  {"to" in l && l.to ? (
                    <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {l.label}
                    </Link>
                  ) : (
                    <a
                      href={l.href}
                      {...(l.external && !l.href.startsWith("mailto:")
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

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Legal</p>
            <ul className="mt-4 space-y-2.5">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Newsletter</p>
            <p className="mt-3 text-sm text-muted-foreground">
              Marketplace updates and featured events.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex flex-col gap-2">
              <Input
                type="email"
                name="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-lg border-border bg-muted/40"
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
      </div>

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <p className="text-xs text-muted-foreground">
              © 2026 Inside Global Events, an AlexBoyo World company.
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
