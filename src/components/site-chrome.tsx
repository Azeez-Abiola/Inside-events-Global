import { Link } from "@tanstack/react-router";
import { BrandLogo } from "@/components/brand-logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteFooter } from "@/components/site-footer";

export { SiteFooter };

export const SITE_BRAND_NAME = "Inside Global Events";

const NAV: { to: string; label: string; hash?: string }[] = [
  { to: "/", hash: "how", label: "How It Works" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/organisers", label: "For Organisers" },
  { to: "/sponsors", label: "For Sponsors" },
  { to: "/partners", label: "For Professionals" },
  { to: "/services", label: "IGE Services" },
  { to: "/knowledge-base", label: "Intelligence" },
];

export function SiteHeader({ showAuthLinks = true }: { showAuthLinks?: boolean }) {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <BrandLogo />
          <span className="font-display italic font-semibold text-brand-gradient text-base sm:text-lg">
            {SITE_BRAND_NAME}
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {/* §1.1: How It Works, Marketplace, the audience pages, IGE Services,
              Intelligence. No Pricing — IGE is free to use until May 2027. */}
          <nav className="hidden items-center gap-5 text-sm font-medium text-muted-foreground lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.label}
                to={n.to}
                hash={n.hash}
                className="transition-colors hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          {showAuthLinks ? (
            <>
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
                Join IGE
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}
