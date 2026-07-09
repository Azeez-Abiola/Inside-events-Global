import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, CalendarRange, Inbox, Bookmark, Compass, BarChart3, MessageSquare,
  ShieldCheck, Users, DollarSign, SlidersHorizontal, Handshake, TrendingUp, Newspaper, Send, Wallet,
  FileText, Coins, UserCheck,
} from "lucide-react";

export type WorkspaceNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export function getWorkspaceNav(roles: string[]): WorkspaceNavItem[] {
  const r = new Set(roles);
  const isAdmin = r.has("abw_admin") || r.has("super_admin");
  const items: WorkspaceNavItem[] = [];

  if (isAdmin) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/vetting", label: "Event queue", icon: ShieldCheck },
      { to: "/dashboard/submissions", label: "Submissions", icon: Users },
      { to: "/dashboard/revenue", label: "Revenue & deals", icon: DollarSign },
      { to: "/dashboard/partners", label: "Referral partners", icon: UserCheck },
      { to: "/dashboard/controls", label: "Fraud & rates", icon: SlidersHorizontal },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("organiser")) {
    items.push(
      { to: "/dashboard", label: "My events", icon: CalendarRange },
      { to: "/dashboard/pipeline", label: "Pipeline", icon: TrendingUp },
      { to: "/dashboard/documents", label: "Documents", icon: FileText },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("sponsor")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/discover", label: "Discover", icon: Compass },
      { to: "/dashboard/pipeline", label: "My deals", icon: TrendingUp },
      { to: "/dashboard/budget", label: "Budget", icon: Wallet },
      { to: "/dashboard/commitments", label: "Commitments", icon: Inbox },
      { to: "/dashboard/saved", label: "Saved events", icon: Bookmark },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("referral_partner")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/referrals", label: "My referrals", icon: Handshake },
      { to: "/dashboard/commissions", label: "Commission tracker", icon: Coins },
      { to: "/dashboard/deals", label: "Deal pipeline", icon: TrendingUp },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("media_partner")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/explore", label: "Explore", icon: Compass },
      { to: "/dashboard/saved", label: "Saved", icon: Bookmark },
      { to: "/dashboard/requests", label: "My requests", icon: Send },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else {
    items.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  items.push({ to: "/messages", label: "Messages", icon: MessageSquare });
  return items;
}
