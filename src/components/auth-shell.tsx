import { ReactNode, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

// Slideshow images (served from /public/events). Itsekiri banner intentionally excluded.
const SLIDES = [
  "/events/portrait-young-handsome-african-american-businessman-suit-near-new-year-tree-decorations.jpg",
  "/events/stylish-african-american-gentleman-elegant-black-jacket-glasses-holding-retro-walking-stick-as-cane-flask-tippling-cane-with-golden-diamond-ball-handle-speaking-mobile-phone.jpg",
  "/events/bellboy-providing-coffee-cup-guest-sitting-lounge-area-hotel-offering-excellent-luxury-services-with-drink-from-bar-woman-tourist-receiving-beverage-lobby-handheld-shot.jpg",
  "/events/dentistry-students-team-doing-research-with-plastic-human-jaw-model.jpg",
  "/events/young-man-having-fun-party.jpg",
  "/events/signin.jpg",
];

export function AuthSlideshow() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div aria-hidden className="absolute inset-0">
      {SLIDES.map((src, i) => (
        <div
          key={src}
          className="absolute inset-0 transition-all duration-[1200ms] ease-in-out"
          style={{
            backgroundImage: `url("${src}")`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            opacity: i === index ? 1 : 0,
            transform: i === index ? "translateX(0) scale(1.05)" : "translateX(6%) scale(1)",
          }}
        />
      ))}
      {/* Purple brand gradient sits ON TOP of the photos */}
      <div className="absolute inset-0 bg-brand-gradient-diag opacity-80" />
      {/* Bottom vignette for text legibility */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(26,16,40,0.65) 0%, transparent 55%)" }}
      />
    </div>
  );
}

/** A miniature IGE dashboard for the brand panel: HTML, so it never goes stale. */
function DashboardPreview() {
  const rows = [
    // Sample figures for illustration only — not real events.
    ["Your annual summit", "Summit", "78%"],
    ["Founders networking mixer", "Networking", "54%"],
    ["Health & wellness expo", "Industry expo", "31%"],
  ];
  return (
    <div className="relative rounded-2xl bg-white p-4 text-[#1a1325] shadow-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">Dashboard</p>
        <span className="rounded-full bg-[#efe8f8] px-2 py-0.5 text-[10px] font-medium text-[#6b3fa0]">This quarter</span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-black/5 p-3">
          <p className="text-[10px] text-[#5b5468]">Sponsorship raised</p>
          <p className="mt-1 text-lg font-semibold">₦48.2m</p>
          <p className="text-[10px] font-medium text-[#0e8a62]">+23% this month</p>
        </div>
        <div className="rounded-xl border border-black/5 p-3">
          <p className="text-[10px] text-[#5b5468]">Matched sponsors</p>
          <p className="mt-1 text-lg font-semibold">12</p>
          <p className="text-[10px] font-medium text-[#0e8a62]">4 meetings booked</p>
        </div>
      </div>
      <p className="mt-4 text-[11px] font-semibold">Funding progress</p>
      <ul className="mt-2 space-y-2.5">
        {rows.map(([name, type, pct]) => (
          <li key={name} className="flex items-center gap-3 text-[11px]">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#efe8f8] text-[10px] font-semibold text-[#6b3fa0]">
              {name[0]}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium">{name}</span>
              <span className="block text-[10px] text-[#5b5468]">{type}</span>
            </span>
            <span className="h-1.5 w-20 overflow-hidden rounded-full bg-[#efe8f8]">
              <span className="block h-full rounded-full bg-[#6b3fa0]" style={{ width: pct }} />
            </span>
            <span className="w-8 text-right font-medium">{pct}</span>
          </li>
        ))}
      </ul>
      {/* Floating card, as in the reference's overlapping "Add member" panel. */}
      <div className="absolute -right-6 -top-6 hidden w-44 rounded-xl bg-white p-3 shadow-xl xl:block">
        <p className="text-[10px] font-semibold text-[#5b5468]">New match approved</p>
        <p className="mt-1 text-xs font-semibold">Fintech brand · Lagos</p>
        <span className="mt-2 inline-flex rounded-full bg-[#e3f4ed] px-2 py-0.5 text-[10px] font-medium text-[#0e8a62]">
          92% fit · Book meeting
        </span>
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f1eff8] p-3 sm:p-6 lg:p-10">
      {/* Faint grid and a soft brand glow behind the card. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(107,63,160,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(107,63,160,0.06)_1px,transparent_1px)] [background-size:64px_64px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(70%_80%_at_50%_100%,rgba(14,138,98,0.14),transparent_70%)]"
      />

      <div className="relative mx-auto max-w-[1240px] rounded-[36px] bg-white/60 p-2 shadow-[0_30px_80px_-40px_rgba(26,19,37,0.35)] ring-1 ring-black/5 backdrop-blur">
        <div className="grid min-h-[min(820px,calc(100vh-5rem))] overflow-hidden rounded-[30px] bg-white lg:grid-cols-[1fr_1.05fr]">
          {/* Left: form */}
          <div className="flex flex-col px-6 py-8 sm:px-12 sm:py-10">
            <div className="flex items-center justify-between">
              <Link to="/" aria-label="Inside Global Events — Home" className="flex items-center gap-2.5">
                <BrandLogo size="sm" />
                <span className="text-sm font-semibold tracking-tight text-[#1a1325]">Inside Global Events</span>
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#5b5468] transition-colors hover:bg-black/5 hover:text-[#1a1325]"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Back to home</span>
              </Link>
            </div>

            <div className="auth-form mx-auto my-auto w-full max-w-md py-10">
              <h1 className="text-3xl font-semibold tracking-tight text-[#1a1325] sm:text-[34px]">{title}</h1>
              {subtitle ? <p className="mt-2 text-[15px] text-[#5b5468]">{subtitle}</p> : null}
              <div className="mt-8">{children}</div>
              {footer ? <div className="mt-8 text-sm text-[#5b5468]">{footer}</div> : null}
            </div>

            <p className="text-center text-xs text-[#8a8496]">
              © {new Date().getFullYear()} Inside Global Events. All rights reserved.
            </p>
          </div>

          {/* Right: brand panel */}
          <div className="relative m-2 hidden flex-col overflow-hidden rounded-[26px] bg-[#6b3fa0] p-12 text-white lg:flex">
            <div aria-hidden className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[#8b5fc4] opacity-40 blur-3xl" />
            <div aria-hidden className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-[#0e8a62] opacity-40 blur-3xl" />
            <div className="relative">
              <h2 className="max-w-md text-[34px] font-semibold leading-tight tracking-tight">
                The vetted way to fund and fill your events
              </h2>
              <p className="mt-3 max-w-sm text-[15px] text-white/75">
                Vetted events, matched sponsors and tracked deals across the Africa–Europe corridor.
              </p>
            </div>
            <div className="relative mx-auto mt-10 w-full max-w-md">
              <DashboardPreview />
            </div>
            <div className="relative mt-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pt-12 text-sm font-semibold text-white/55">
              {["Lagos", "Nairobi", "Accra", "Warri", "London"].map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function GoogleButton({
  onClick,
  loading,
  label = "Continue with Google",
}: {
  onClick: () => void;
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-60"
    >
      <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden>
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.43.34-2.1V7.07H2.18A10.99 10.99 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.83z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.3 9.14 5.38 12 5.38z"
        />
      </svg>
      {loading ? "Redirecting…" : label}
    </button>
  );
}

export function Divider({ text = "or" }: { text?: string }) {
  return (
    <div className="flex items-center gap-3 py-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
      <div className="h-px flex-1 bg-border" />
      <span>{text}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
