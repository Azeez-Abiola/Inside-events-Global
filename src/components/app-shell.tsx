import { ReactNode } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { LogOut, LayoutDashboard, CalendarRange, ShieldCheck, Handshake, Globe2 } from "lucide-react";
import logo from "@/assets/ige-logo.jpeg";
import { useAuth } from "@/lib/auth-context";

export function AppShell({ children }: { children: ReactNode }) {
  const { user, roles, signOut } = useAuth();
  const loc = useLocation();
  const isAdmin = roles.includes("abw_admin") || roles.includes("super_admin");
  const isOrganiser = roles.includes("organiser");
  const isSponsor = roles.includes("sponsor");
  const isReferral = roles.includes("referral_partner");

  const nav: { to: string; label: string; icon: any; show: boolean }[] = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, show: true },
    { to: "/events", label: "My events", icon: CalendarRange, show: isOrganiser },
    { to: "/browse", label: "Browse events", icon: Globe2, show: isSponsor || isReferral },
    { to: "/admin/vetting", label: "Vetting queue", icon: ShieldCheck, show: isAdmin },
    { to: "/referrals", label: "Referrals", icon: Handshake, show: isReferral },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="IGE" className="h-8 w-8 rounded-md object-cover" />
              <span className="font-display text-base font-bold">IGE</span>
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.filter((n) => n.show).map((n) => {
                const active = loc.pathname === n.to || loc.pathname.startsWith(n.to + "/");
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      active ? "bg-brand-soft text-primary-deep" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <n.icon className="h-3.5 w-3.5" />
                    {n.label}
                  </Link>
                );
              })}
            </nav>
          </div>
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
      <main className="mx-auto max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    submitted: "bg-muted text-foreground",
    under_review: "bg-amber-100 text-amber-900",
    revision_requested: "bg-red-100 text-red-900",
    approved: "bg-emerald-100 text-emerald-900",
    listed: "bg-emerald-100 text-emerald-900",
    rejected: "bg-red-100 text-red-900",
    closed: "bg-foreground/10 text-foreground",
    archived: "bg-foreground/10 text-foreground",
  };
  const label = status.replace(/_/g, " ");
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${map[status] ?? "bg-muted"}`}>
      {label}
    </span>
  );
}
