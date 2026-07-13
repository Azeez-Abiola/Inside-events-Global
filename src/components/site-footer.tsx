import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Instagram, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const HI_EMAIL = "hi@insideglobalevents.com";
const IG_URL = "https://www.instagram.com/insideglobalevents";
const LINKEDIN_URL = "https://www.linkedin.com/company/inside-global-events";

const NEWSLETTER_EMAIL_KEY = "ige:footer-newsletter-email";

export function SiteFooter() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Enter a valid work email.");
      return;
    }
    setSubmitting(true);
    try {
      sessionStorage.setItem(NEWSLETTER_EMAIL_KEY, trimmed);
    } catch {
      /* ignore */
    }
    toast.success("Almost there — pick your role on the waitlist to finish.");
    navigate({ to: "/waitlist" });
    setSubmitting(false);
  }

  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              <span className="text-primary">Inside</span>{" "}
              <span className="text-secondary">Global Events</span>
            </p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
              Event sponsorship intelligence, built for the next generation of global partnerships.
            </p>
          </div>

          <div className="lg:pt-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">
              Stay in the loop
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Join our newsletter for updates as we open access.
            </p>
            <form onSubmit={handleSubscribe} className="mt-4 flex max-w-md flex-col gap-2 sm:flex-row">
              <Input
                type="email"
                name="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 flex-1 rounded-lg border-border bg-muted/40"
                autoComplete="email"
                required
              />
              <Button
                type="submit"
                disabled={submitting}
                className="h-11 shrink-0 rounded-lg bg-primary px-6 font-semibold hover:bg-primary-deep"
              >
                Subscribe
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-foreground">Contact</p>
          <a
            href={`mailto:${HI_EMAIL}`}
            className="mt-3 inline-block text-sm font-medium text-secondary hover:underline"
          >
            {HI_EMAIL}
          </a>
          <div className="mt-4 flex items-center gap-3">
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

      <div className="border-t border-border/60">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Inside Global Events. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="hover:text-foreground">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export { NEWSLETTER_EMAIL_KEY };
