import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/ige-logo.jpeg";

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
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        {/* Left: brand panel */}
        <div className="relative hidden overflow-hidden bg-brand-gradient-diag p-12 text-white lg:flex lg:flex-col">
          <Link to="/" className="flex items-center gap-3" aria-label="Inside Global Events — Home">
            <img src={logo} alt="" aria-hidden="true" className="h-10 w-10 rounded-md object-cover" />
            <div className="uppercase tracking-[0.18em] opacity-90 text-lg font-sans font-extrabold">
              Inside Global Events
            </div>
          </Link>

          <div className="mt-auto">
            <blockquote className="font-display text-3xl font-bold leading-tight">
              “The first marketplace where B2B sponsorships is vetted.”
            </blockquote>
            <div className="mt-6 text-sm opacity-80">
              Inside Global Events
            </div>
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full opacity-30 blur-3xl"
            style={{
              background:
                "radial-gradient(circle, oklch(0.55 0.14 162 / 0.9), transparent 70%)",
            }}
          />
        </div>

        {/* Right: form */}
        <div className="flex flex-col px-6 py-10 sm:px-12">
          <Link to="/" className="flex items-center gap-2.5 lg:hidden" aria-label="Inside Global Events — Home">
            <img src={logo} alt="" aria-hidden="true" className="h-9 w-9 rounded-md object-cover" />
            <span className="font-display text-base font-bold">Inside Global Events</span>
          </Link>

          <div className="m-auto w-full max-w-md">
            <h1 className="font-display text-3xl font-bold tracking-tight">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
            <div className="mt-8">{children}</div>
            {footer ? (
              <div className="mt-8 text-sm text-muted-foreground">{footer}</div>
            ) : null}
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
