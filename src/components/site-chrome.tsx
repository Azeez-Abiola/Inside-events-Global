import { Link } from "@tanstack/react-router";
import logo from "@/assets/ige-logo.jpeg";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo} alt="IGE" className="h-9 w-9 rounded-md object-cover" />
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/organisers" className="transition-colors hover:text-foreground">For Organisers</Link>
          <Link to="/sponsors" className="transition-colors hover:text-foreground">For Sponsors</Link>
          <Link to="/partners" className="transition-colors hover:text-foreground">Referral Partners</Link>
          <Link to="/how-it-works" className="transition-colors hover:text-foreground">How it works</Link>
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
            Get started
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
            <img src={logo} alt="IGE" className="h-8 w-8 rounded-md object-cover" />
            <span className="font-display text-base font-bold tracking-tight">IGE</span>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            The vetted marketplace where B2B event organisers, sponsors, and trusted
            referral partners actually close deals, not just exchange brochures.
          </p>
          <p className="mt-6 text-xs text-muted-foreground">
            An Inside Global Event company · © 2026 IGE
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
          </ul>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground">
            Company
          </div>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li><a href="mailto:partner@insideglobalevents.com" className="hover:text-foreground">About IGE</a></li>
            <li><a href="#" className="hover:text-foreground">Trust &amp; vetting</a></li>
            <li><Link to="/privacy" className="hover:text-foreground">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-foreground">Terms</Link></li>

          </ul>
        </div>
      </div>
    </footer>
  );
}
