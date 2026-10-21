import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarRange,
  Inbox,
  Bookmark,
  Compass,
  BarChart3,
  MessageSquare,
  ShieldCheck,
  Users,
  DollarSign,
  SlidersHorizontal,
  Handshake,
  TrendingUp,
  Newspaper,
  Send,
  Wallet,
  FileText,
  Coins,
  UserCheck,
  UserCircle,
  Radio,
  Mail,
  ScrollText,
  UserCog,
  Contact,
  CalendarDays,
  ClipboardCheck,
  Receipt,
  FileBarChart,
  Target,
  Sparkles,
  GitMerge,
  Clapperboard,
  Home,
  ListChecks,
  PieChart,
  LifeBuoy,
} from "lucide-react";
import { canAccessAdminRoute, isSuperAdmin } from "@/lib/admin-permissions";

export type WorkspaceNavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Deep link into a tab, e.g. { tab: "outreach" } on /dashboard/crm. */
  search?: Record<string, string>;
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
      ...maybe("/dashboard/inbox", "Inbox", Inbox),
      ...maybe("/dashboard/help-gaps", "Help content gaps", LifeBuoy),
      ...maybe("/dashboard/onboarding-vetting", "Onboarding", UserCheck),
      ...maybe("/dashboard/vetting", "Event queue", ShieldCheck),
      { to: "/dashboard/marketplace", label: "Marketplace", icon: Compass },
      ...maybe("/dashboard/match-queue", "Match queue", GitMerge),
      ...maybe("/dashboard/production-queue", "Production queue", Clapperboard),
      ...maybe("/dashboard/home-events", "Home page events", Home),
      ...maybe("/dashboard/newsletter", "Newsletter", Mail),
      ...maybe("/dashboard/users", "Users", Users),
      ...maybe("/dashboard/submissions", "Contact", Users),
      ...maybe("/dashboard/revenue", "Revenue & deals", DollarSign),
      ...maybe("/dashboard/compliance", "Deal compliance", ListChecks),
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
      { to: "/dashboard/readiness", label: "Brand-Readiness Coach", icon: Sparkles },
      { to: "/dashboard/deliverables", label: "Deliverable Matrix", icon: ListChecks },
      { to: "/dashboard/roi", label: "Post-event reports", icon: PieChart },
      { to: "/dashboard/documents", label: "Documents", icon: FileText },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/dashboard/marketplace", label: "Marketplace", icon: Compass },
    );
  } else if (r.has("sponsor")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/discover", label: "Discover", icon: Compass },
      { to: "/marketplace", label: "Marketplace", icon: Compass },
      { to: "/dashboard/pipeline", label: "My deals", icon: TrendingUp },
      { to: "/dashboard/budget", label: "Budget", icon: Wallet },
      { to: "/dashboard/discover-productions", label: "Productions", icon: Clapperboard },
      { to: "/dashboard/commitments", label: "Commitments", icon: Inbox },
      { to: "/dashboard/deliverables", label: "Deliverables & compliance", icon: ListChecks },
      { to: "/dashboard/roi", label: "ROI & Business Case", icon: PieChart },
      { to: "/dashboard/saved", label: "Saved events", icon: Bookmark },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("referral_partner")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/referrals", label: "My referrals", icon: Handshake },
      { to: "/marketplace", label: "Marketplace", icon: Compass },
      { to: "/dashboard/commissions", label: "Commission tracker", icon: Coins },
      { to: "/dashboard/deals", label: "Deal pipeline", icon: TrendingUp },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("media_partner")) {
    items.push(
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/dashboard/explore", label: "Explore", icon: Compass },
      { to: "/marketplace", label: "Marketplace", icon: Compass },
      { to: "/dashboard/saved", label: "Saved", icon: Bookmark },
      { to: "/dashboard/requests", label: "My requests", icon: Send },
      { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
    );
  } else if (r.has("creative_hub")) {
    // §5.6: productions and placements first, then the shared tools.
    items.push(
      { to: "/dashboard", label: "Home", icon: LayoutDashboard },
      { to: "/dashboard/productions", label: "My productions", icon: Clapperboard },
      { to: "/dashboard/crm", search: { tab: "pipeline" }, label: "Sponsor pipeline", icon: TrendingUp },
    );
  } else if (r.has("partnerships_pro")) {
    // §5.5: the Partnerships Pro workspace is the CRM, so its tabs are the nav.
    items.push(
      { to: "/dashboard", label: "Home", icon: LayoutDashboard },
      { to: "/dashboard/crm", search: { tab: "contacts" }, label: "Contacts", icon: Contact },
      {
        to: "/dashboard/crm",
        search: { tab: "companies" },
        label: "Companies & clients",
        icon: Users,
      },
      { to: "/dashboard/crm", search: { tab: "pipeline" }, label: "Pipeline", icon: TrendingUp },
      { to: "/dashboard/crm", search: { tab: "outreach" }, label: "Outreach tracker", icon: Send },
      {
        to: "/dashboard/crm",
        search: { tab: "commission" },
        label: "Commission tracker",
        icon: Coins,
      },
      { to: "/marketplace", label: "Marketplace", icon: Compass },
    );
  } else {
    items.push({ to: "/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  // §4.4.2 makes Contacts and CRM a tool for every public role, so it sits in
  // the shared tail rather than being repeated in each branch. Admins are the
  // exception: they work the platform, not a book of their own contacts.
  if (!isAdmin) {
    // §4.4.1 and §4.4.2 are tools for every public role, so they sit in the
    // shared tail rather than being repeated in each branch.
    // §4.2 Module 1 (v6.3): the Fundraising Tracker is for organisers and
    // every other non-sponsor role; Brand / Sponsor accounts plan with the
    // Marketing Budget instead.
    if (!r.has("sponsor")) {
      items.push({ to: "/dashboard/fundraising", label: "Fundraising", icon: Target });
    }
    items.push({ to: "/dashboard/calendar", label: "Calendar", icon: CalendarDays });
    if (!r.has("partnerships_pro")) {
      items.push({ to: "/dashboard/crm", label: "Contacts & CRM", icon: Contact });
    }
    items.push({ to: "/dashboard/activations", label: "Activations", icon: ClipboardCheck });
    // §4.4.6 (v6.4): Media and Referral Partners get Payments without the
    // vendor tools, so the label says what they will find.
    const paymentsOnly = r.has("media_partner") || r.has("referral_partner");
    items.push({
      to: "/dashboard/payments",
      label: paymentsOnly ? "Payments" : "Vendors & Payments",
      icon: Receipt,
    });
    items.push({ to: "/dashboard/reports", label: "Reports", icon: FileBarChart });
  }
  // TAB 19 §19.5: every public role receives Admin-approved matches.
  if (!isAdmin) items.push({ to: "/dashboard/matches", label: "Matches", icon: Handshake });
  // §4.4.4: the only message channel is a user talking to IGE. Admins answer
  // from the Inbox instead.
  if (!isAdmin) items.push({ to: "/messages", label: "Message IGE", icon: MessageSquare });
  items.push({ to: "/profile", label: "Profile", icon: UserCircle });
  return items;
}
