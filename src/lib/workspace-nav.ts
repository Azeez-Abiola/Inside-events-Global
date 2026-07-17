import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, CalendarRange, Inbox, Bookmark, Compass, BarChart3, MessageSquare,
  ShieldCheck, Users, DollarSign, SlidersHorizontal, Handshake, TrendingUp, Newspaper, Send, Wallet,
  ClipboardList, FileText, Coins, UserCheck, UserCircle, Radio, Mail, ScrollText, UserCog,
} from "lucide-react";
import { canAccessAdminRoute, isSuperAdmin } from "@/lib/admin-permissions";

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
    const superAdmin = isSuperAdmin([...r]);
    const maybe = (to: string, label: string, icon: LucideIcon) =>
      canAccessAdminRoute([...r], to) ? [{ to, label, icon }] : [];

    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      ...maybe("/dashboard/vetting", "Event queue", ShieldCheck),
      ...maybe("/dashboard/waitlist", "Waitlist", ClipboardList),
      ...maybe("/dashboard/newsletter", "Newsletter", Mail),
      ...maybe("/dashboard/users", "Users", Users),
      ...maybe("/dashboard/submissions", "Contact", Users),
      ...maybe("/dashboard/revenue", "Revenue & deals", DollarSign),
      ...maybe("/dashboard/partners", "Referral partners", UserCheck),
      ...maybe("/dashboard/controls", "Fraud & rates", SlidersHorizontal),
      ...maybe("/dashboard/media-requests", "Media requests", Radio),
      ...maybe("/dashboard/analytics", "Analytics", BarChart3),
    );
    if (superAdmin) {
      items.push(
        { to: "/dashboard/team", label: "Admin team", icon: UserCog },
        { to: "/dashboard/audit", label: "Audit log", icon: ScrollText },
      );
    }
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
  items.push({ to: "/profile", label: "Profile", icon: UserCircle });
  return items;
}
