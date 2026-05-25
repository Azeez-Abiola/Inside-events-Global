import { createFileRoute, Link } from "@tanstack/react-router";
import { LogOut, Megaphone, Globe2, Handshake, ShieldCheck } from "lucide-react";
import logo from "@/assets/ige-logo.jpeg";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — IGE" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, roles, signOut } = useAuth();
  const primaryRole = roles[0];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="IGE" className="h-8 w-8 rounded-md object-cover" />
            <span className="font-display text-base font-bold">IGE</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary-deep">
            <ShieldCheck className="h-3 w-3" /> Account verified
          </span>
          {primaryRole && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-deep">
              {labelForRole(primaryRole)}
            </span>
          )}
        </div>

        <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">
          Welcome to IGE.
        </h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          You're signed in. Sprint 1 of the build is complete — the rest of your
          workspace (events, sponsorships, referrals) is being built out next.
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          <Card
            icon={Megaphone}
            title="List an event"
            desc="Build a sponsorship pack through the 9-step organiser flow."
            cta="Coming in Sprint 2"
          />
          <Card
            icon={Globe2}
            title="Browse sponsorships"
            desc="Discover IGE-vetted events your buyers attend."
            cta="Coming in Sprint 3"
          />
          <Card
            icon={Handshake}
            title="Refer & earn"
            desc="Generate trackable referral links and earn commission."
            cta="Coming in Sprint 4"
          />
        </div>
      </main>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  desc,
  cta,
}: {
  icon: any;
  title: string;
  desc: string;
  cta: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {cta}
      </div>
    </div>
  );
}

function labelForRole(role: string) {
  switch (role) {
    case "organiser": return "Organiser";
    case "sponsor": return "Sponsor";
    case "referral_partner": return "Referral Partner";
    case "media_partner": return "Media Partner";
    case "abw_admin": return "ABW Admin";
    case "super_admin": return "Super Admin";
    default: return role;
  }
}
