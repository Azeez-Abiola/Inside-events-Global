/**
 * Shared chrome for the public pages, following the EvenTum concept in IGE's
 * palette: a soft purple arch behind the nav with a thin rule under it, dot
 * separators between links, an outlined pill CTA, firework sparkles, and
 * white pentagon badges for event icons. Always light; dark mode is for the
 * dashboard only.
 */
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X, type LucideIcon } from "lucide-react";
import { BrandWordmark } from "@/components/brand-logo";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export const INK = "#1a1325";

const NAV_LINKS = [
  { to: "/marketplace", label: "Events" },
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact us" },
] as const;

export const pill =
  "inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5";

/**
 * The purple arch the nav sits in: a wide ellipse whose tint fades to white,
 * leaving the page's pale grey showing in the curved top corners.
 */
export function ArchBackdrop({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="absolute left-1/2 top-[-55%] h-[150%] w-[118%] -translate-x-1/2 rounded-[50%] bg-[linear-gradient(180deg,#ebe1f7_0%,#f5effb_45%,#ffffff_85%)] [mask-image:linear-gradient(180deg,#000_55%,transparent_92%)]" />
    </div>
  );
}

/** A firework burst, drawn as rays around a centre, as in the concept's hero. */
export function Firework({ className }: { className?: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => (i * 360) / 12);
  return (
    <svg
      aria-hidden
      viewBox="0 0 100 160"
      className={cn("pointer-events-none absolute", className)}
    >
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none">
        {rays.map((deg, i) => (
          <line
            key={deg}
            x1="50"
            y1={i % 2 ? 36 : 32}
            x2="50"
            y2={i % 2 ? 24 : 14}
            transform={`rotate(${deg} 50 50)`}
          />
        ))}
        <path d="M50 64 C 54 100, 60 130, 66 158" opacity="0.6" />
      </g>
      <circle cx="50" cy="50" r="2.5" fill="currentColor" />
    </svg>
  );
}

/** A white pentagon badge holding an event icon (the concept's category marker). */
export function PentagonIcon({
  icon: Icon,
  className,
  iconClassName,
}: {
  icon: LucideIcon;
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span
      className={cn(
        "relative inline-flex h-16 w-16 items-center justify-center bg-white [clip-path:polygon(50%_0%,100%_38%,82%_100%,18%_100%,0%_38%)]",
        className,
      )}
    >
      <Icon className={cn("mt-1.5 h-7 w-7", iconClassName)} strokeWidth={2.2} />
    </span>
  );
}

/**
 * Pinned to the top. Over the hero it is transparent so the arch shows
 * through; once the page scrolls it turns into a frosted white bar and
 * tightens up. The spacer keeps the page from jumping under it.
 */
export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="relative z-50 h-[77px]">
      <header
        className={cn(
          "fixed inset-x-0 top-0 transition-[background-color,box-shadow,backdrop-filter] duration-300",
          scrolled || open
            ? "bg-white/85 shadow-[0_8px_30px_-12px_rgba(26,19,37,0.18)] backdrop-blur-md"
            : "bg-transparent",
        )}
      >
        <div
          className={cn(
            "mx-auto flex max-w-6xl items-center justify-between px-6 transition-[height] duration-300",
            scrolled ? "h-16" : "h-[76px]",
          )}
        >
          <Link to="/" aria-label="Inside Global Events — Home">
            <BrandWordmark tile />
          </Link>
          <nav className="hidden items-center gap-5 text-sm text-[#6e667c] md:flex">
            {NAV_LINKS.map((l, i) => (
              <Fragment key={l.to}>
                {i > 0 && <span aria-hidden className="h-1 w-1 rounded-full bg-[#6b3fa0]/25" />}
                <Link
                  to={l.to}
                  className="transition-colors hover:text-[#1a1325]"
                  activeProps={{ className: "font-medium text-[#1a1325]" }}
                >
                  {l.label}
                </Link>
              </Fragment>
            ))}
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="hidden text-sm font-medium text-[#1a1325] hover:text-[#6b3fa0] sm:inline"
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              onClick={() => trackEvent("signup_cta_click", { source: "public_nav" })}
              className={`${pill} whitespace-nowrap border border-[#6b3fa0]/50 max-sm:hidden bg-white/70 px-4 py-2 text-[#1a1325] shadow-[0_6px_20px_-8px_rgba(107,63,160,0.45)]`}
            >
              Get started <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-[#1a1325] hover:bg-black/5 md:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {/* The thin rule under the nav, fading out at both ends. */}
        <div
          className={cn(
            "mx-auto h-px max-w-6xl bg-[linear-gradient(90deg,transparent,rgba(107,63,160,0.35)_15%,rgba(107,63,160,0.35)_85%,transparent)] transition-opacity duration-300",
            scrolled && "opacity-0",
          )}
        />
        {open && (
          <nav className="mx-4 mb-3 mt-2 flex flex-col rounded-2xl border border-black/5 bg-white p-2 shadow-lg md:hidden">
            {[
              ...NAV_LINKS,
              { to: "/login", label: "Sign in" } as const,
              { to: "/signup", label: "Get started" } as const,
            ].map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-[#1a1325] hover:bg-[#f5effb]"
              >
                {l.label}
              </Link>
            ))}
          </nav>
        )}
      </header>
    </div>
  );
}

/**
 * The top of an inner public page: the arch, the nav, and a centred heading.
 * Matches the landing hero so every page opens the same way.
 */
export function PageHero({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-[#f7f6fa]">
      <ArchBackdrop />
      <Firework className="left-[9%] top-44 hidden h-28 w-16 text-[#6b3fa0]/25 md:block" />
      <Firework className="right-[10%] top-36 hidden h-24 w-14 text-[#0e8a62]/30 md:block" />
      <PublicNav />
      <div className="relative z-10 mx-auto max-w-3xl px-6 pb-20 pt-16 text-center md:pb-24 md:pt-20">
        {eyebrow && (
          <span
            data-reveal
            className="inline-flex rounded-full border border-[#6b3fa0]/15 bg-white/80 px-3.5 py-1 text-xs font-medium text-[#6b3fa0] shadow-sm"
          >
            {eyebrow}
          </span>
        )}
        <h1
          data-reveal
          data-delay="1"
          className="mt-5 text-4xl font-semibold tracking-tight text-[#1a1325] md:text-[52px] md:leading-[1.1]"
        >
          {title}
        </h1>
        {subtitle && (
          <p
            data-reveal
            data-delay="2"
            className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-[#6e667c]"
          >
            {subtitle}
          </p>
        )}
        {children && (
          <div data-reveal data-delay="3">
            {children}
          </div>
        )}
      </div>
    </section>
  );
}

/** The purple closing call to action shared by the inner public pages. */
export function CtaBand({
  title = "Ready to fund and fill your next event?",
  body = "Join organisers, sponsors and partners already working inside IGE. Zero listing fees, vetted from day one.",
}: {
  title?: string;
  body?: string;
}) {
  return (
    <section className="px-6 py-24">
      <div
        data-reveal
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] bg-[#6b3fa0] px-8 py-14 text-white md:px-14 md:py-16"
      >
        <div
          aria-hidden
          className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-[#0e8a62]/50 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute -right-6 -top-6 h-40 w-40 bg-[radial-gradient(rgba(255,255,255,0.25)_3px,transparent_3.5px)] [background-size:18px_18px]"
        />
        <Firework className="bottom-6 right-[18%] hidden h-28 w-16 text-white/20 md:block" />
        <div className="relative max-w-2xl">
          <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-4 text-base text-white/80">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              onClick={() => trackEvent("signup_cta_click", { source: "cta_band" })}
              className={`${pill} bg-white text-[#4a2c73]`}
            >
              Get started <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/contact" className={`${pill} border border-white/30 bg-white/10 text-white`}>
              Talk to the team
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
