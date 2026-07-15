import type { LucideIcon } from "lucide-react";
import { Link } from "@tanstack/react-router";

type SidebarCta = {
  title: string;
  description: string;
  cta: string;
  to: string;
};

function getSidebarCta(roles: string[]): SidebarCta {
  const r = new Set(roles);
  if (r.has("abw_admin") || r.has("super_admin")) {
    return {
      title: "Admin queue",
      description: "Review pending events and waitlist signups from your workspace.",
      cta: "Open event queue",
      to: "/dashboard/vetting",
    };
  }
  if (r.has("organiser")) {
    return {
      title: "Grow your listing",
      description: "Complete event details and tiers to move through vetting faster.",
      cta: "My events",
      to: "/dashboard",
    };
  }
  if (r.has("sponsor")) {
    return {
      title: "Find your next event",
      description: "Browse vetted B2B events and track deals in your pipeline.",
      cta: "Discover events",
      to: "/dashboard/discover",
    };
  }
  if (r.has("referral_partner")) {
    return {
      title: "Earn commissions",
      description: "Share vouch links and track attributed deals as they close.",
      cta: "My referrals",
      to: "/dashboard/referrals",
    };
  }
  if (r.has("media_partner")) {
    return {
      title: "Request coverage",
      description: "Explore listed events and submit press credential requests.",
      cta: "Explore events",
      to: "/dashboard/explore",
    };
  }
  return {
    title: "Complete your profile",
    description: "Keep your account details current so the IGE team can support you.",
    cta: "Open profile",
    to: "/profile",
  };
}

export function SidebarInsightCard({ roles }: { roles: string[] }) {
  const { title, description, cta, to } = getSidebarCta(roles);

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-4 shadow-card dark:border-primary/35 dark:bg-card">
      <p className="text-xs font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      <Link
        to={to}
        className="mt-3 inline-flex w-full items-center justify-center rounded-xl bg-brand-gradient py-2 text-xs font-bold text-white shadow-soft transition-opacity hover:opacity-95"
      >
        {cta}
      </Link>
    </div>
  );
}
