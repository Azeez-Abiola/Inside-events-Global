import { Link } from "@tanstack/react-router";
import logo from "@/assets/ige-logo.jpeg";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="IGE"
            className="h-9 w-9 rounded-md object-cover mix-blend-multiply dark:mix-blend-screen"
          />
          <span className="font-display italic font-semibold text-brand-gradient text-base sm:text-lg">
            Inside Global Events 2026
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/marketplace" className="transition-colors hover:text-foreground">Marketplace</Link>
          <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
          <Link to="/how-it-works" className="transition-colors hover:text-foreground">How it works</Link>
          <Link to="/knowledge-base" className="transition-colors hover:text-foreground">Knowledge base</Link>
        </nav>

        <div className="flex items-center gap-2">
          <Link
            to="/login"
            className="hidden rounded-md px-3 py-2 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5"
          >
            Sign up
          </Link>
        </div>

      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img src={logo} alt="" aria-hidden="true" className="h-8 w-8 rounded-md object-cover" />
            <span className="font-display text-base font-bold tracking-tight">Inside Global Events 2026</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The vetted marketplace where B2B event organisers, sponsors, and trusted
            referral partners actually close deals, not just exchange brochures.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            Inside Global Events 2026
          </p>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            Platform
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/organisers" className="hover:text-foreground">For Organisers</Link></li>
            <li><Link to="/sponsors" className="hover:text-foreground">For Sponsors</Link></li>
            <li><Link to="/partners" className="hover:text-foreground">Referral Partners</Link></li>
            <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
            <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            Company
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><Link to="/about" className="hover:text-foreground">About IGE</Link></li>
            <li><Link to="/trust-vetting" className="hover:text-foreground">Trust &amp; vetting</Link></li>
            <li><Link to="/knowledge-base" className="hover:text-foreground">Knowledge base</Link></li>
            <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            <li><Link to="/waitlist" className="hover:text-foreground">Join the waitlist</Link></li>
            <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>

          </ul>
        </div>

      </div>
    </footer>
  );
}
