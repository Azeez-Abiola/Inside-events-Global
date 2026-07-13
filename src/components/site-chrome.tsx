import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { SiteFooter } from "@/components/site-footer";

export { SiteFooter };

export const SITE_BRAND_NAME = "Inside Global Events";

export function SiteHeader({ showAuthLinks = false }: { showAuthLinks?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/welcome" className="flex items-center gap-2.5">
          <BrandLogo />
          <span className="font-display italic font-semibold text-brand-gradient text-base sm:text-lg">
            {SITE_BRAND_NAME}
          </span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/waitlist" className="transition-colors hover:text-foreground">Join waitlist</Link>
          <Link to="/about" className="transition-colors hover:text-foreground">About</Link>
          <Link to="/how-it-works" className="transition-colors hover:text-foreground">How it works</Link>
        </nav>

        {showAuthLinks ? (
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
        ) : null}
      </div>
    </header>
  );
}

