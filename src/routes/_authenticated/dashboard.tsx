import { createFileRoute, Link } from "@tanstack/react-router";
import { Megaphone, Globe2, Handshake, ShieldCheck, CalendarRange } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — IGE" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { roles } = useAuth();
  const primaryRole = roles[0];
  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");

  return (
    <AppShell>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-medium text-secondary-deep">
          <ShieldCheck className="h-3 w-3" /> Account verified
        </span>
        {primaryRole && (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary-deep">
            {labelForRole(primaryRole)}
          </span>
        )}
      </div>

      <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Welcome back.</h1>
      <p className="mt-2 max-w-xl text-muted-foreground">
        IGE is the trust layer for global event sponsorships. Pick where to start.
      </p>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {roles.includes("organiser") && (
          <ActionCard to="/events" icon={Megaphone} title="My events" desc="Build sponsorship packs and track vetting status." cta="Manage events" />
        )}
        {(roles.includes("sponsor") || roles.includes("referral_partner")) && (
          <ActionCard to="/marketplace" icon={Globe2} title="Browse sponsorships" desc="Discover IGE-vetted events your buyers attend." cta="Open marketplace" />
        )}
        {roles.includes("referral_partner") && (
          <ActionCard to="/referrals" icon={Handshake} title="Refer & earn" desc="Generate trackable links and earn commission." cta="Open referrals" />
        )}
        {isAdmin && (
          <ActionCard to="/admin/vetting" icon={ShieldCheck} title="Vetting queue" desc="Review submitted events and approve, reject, or request revisions." cta="Open queue" />
        )}
        <ActionCard to="/dashboard" icon={CalendarRange} title="Notifications" desc="Updates on your events and deals will appear here." cta="Coming soon" disabled />
      </div>
    </AppShell>
  );
}

function ActionCard({
  icon: Icon, title, desc, cta, to, disabled,
}: { icon: any; title: string; desc: string; cta: string; to: string; disabled?: boolean }) {
  const inner = (
    <div className={`rounded-2xl border border-border bg-card p-6 transition-all ${disabled ? "opacity-60" : "hover:-translate-y-0.5 hover:shadow-soft"}`}>
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{cta}</div>
    </div>
  );
  return disabled ? inner : <Link to={to}>{inner}</Link>;
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
