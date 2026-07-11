export type DashboardMeta = {
  title: string;
  subtitle?: string;
  breadcrumbs: { label: string; to?: string }[];
};

const ADMIN_SECTIONS: Record<string, DashboardMeta> = {
  overview: {
    title: "Dashboard",
    subtitle: "Platform overview — vetting, revenue, and partner activity at a glance.",
    breadcrumbs: [{ label: "Dashboard" }],
  },
  vetting: {
    title: "Event queue",
    subtitle: "Review submitted listings, request revisions, and approve events for the marketplace.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Event queue" }],
  },
  submissions: {
    title: "Contact messages",
    subtitle: "Inbound contact form submissions from the public site.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Contact" }],
  },
  waitlist: {
    title: "Waitlist",
    subtitle: "Monitor founding waitlist signups by role. Click any row for full intake details.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Waitlist" }],
  },
  revenue: {
    title: "Revenue & deals",
    subtitle: "GMV, deal pipeline, commission payouts, and pending inquiries.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Revenue & deals" }],
  },
  partners: {
    title: "Referral partners",
    subtitle: "Partner links, conversions, and commissions owed.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Referral partners" }],
  },
  controls: {
    title: "Fraud & rates",
    subtitle: "Fraud flags, commission configuration, and platform controls.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Fraud & rates" }],
  },
  analytics: {
    title: "Analytics",
    subtitle: "Platform metrics, GMV trends, and pipeline breakdowns.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Analytics" }],
  },
  "media-requests": {
    title: "Media requests",
    subtitle: "Review coverage and press credential requests from media partners.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Media requests" }],
  },
  users: {
    title: "User management",
    subtitle: "View platform accounts, roles, and suspend users who breach standards.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Users" }],
  },
};

const PATH_META: Record<string, DashboardMeta> = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Your sponsorship workspace.",
    breadcrumbs: [{ label: "Dashboard" }],
  },
  "/dashboard/vetting": ADMIN_SECTIONS.vetting,
  "/dashboard/waitlist": ADMIN_SECTIONS.waitlist,
  "/dashboard/submissions": ADMIN_SECTIONS.submissions,
  "/dashboard/revenue": ADMIN_SECTIONS.revenue,
  "/dashboard/partners": ADMIN_SECTIONS.partners,
  "/dashboard/controls": ADMIN_SECTIONS.controls,
  "/dashboard/analytics": ADMIN_SECTIONS.analytics,
  "/dashboard/media-requests": ADMIN_SECTIONS["media-requests"],
  "/dashboard/users": ADMIN_SECTIONS.users,
  "/profile": {
    title: "Profile",
    subtitle: "Account details, role profile, and security.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Profile" }],
  },
  "/dashboard/documents": {
    title: "Documents",
    subtitle: "Sponsorship decks, banners, and floor plans.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Documents" }],
  },
  "/dashboard/pipeline": {
    title: "Pipeline",
    subtitle: "Sponsorship inquiries and deal progress.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Pipeline" }],
  },
  "/dashboard/discover": {
    title: "Discover",
    subtitle: "Recommended and referral-shared events.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Discover" }],
  },
  "/dashboard/referrals": {
    title: "My referrals",
    subtitle: "Vouch links and sharing tools.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "My referrals" }],
  },
  "/dashboard/commissions": {
    title: "Commission tracker",
    subtitle: "Earned, pending, and paid commissions.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Commission tracker" }],
  },
  "/dashboard/deals": {
    title: "Deal pipeline",
    subtitle: "Attributed deals and commission status.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Deal pipeline" }],
  },
  "/messages": {
    title: "Messages",
    subtitle: "Conversations with sponsors, organisers, and partners.",
    breadcrumbs: [{ label: "Dashboard", to: "/dashboard" }, { label: "Messages" }],
  },
};

export function getAdminSectionMeta(section: string): DashboardMeta {
  return ADMIN_SECTIONS[section] ?? ADMIN_SECTIONS.overview;
}

export function getDashboardMeta(pathname: string): DashboardMeta | null {
  if (PATH_META[pathname]) return PATH_META[pathname];
  const match = Object.keys(PATH_META)
    .filter((p) => p !== "/dashboard")
    .sort((a, b) => b.length - a.length)
    .find((p) => pathname === p || pathname.startsWith(p + "/"));
  return match ? PATH_META[match] : null;
}

export function greetingName(email?: string | null, metadata?: Record<string, unknown>) {
  const full = metadata?.full_name ?? metadata?.name;
  if (typeof full === "string" && full.trim()) return full.trim().split(" ")[0];
  if (!email) return "there";
  return email.split("@")[0].replace(/[._]/g, " ").split(" ")[0] || "there";
}

export function roleLabel(roles: string[]) {
  if (roles.includes("super_admin") || roles.includes("abw_admin")) return "Admin";
  if (roles.includes("organiser")) return "Organiser";
  if (roles.includes("sponsor")) return "Sponsor";
  if (roles.includes("referral_partner")) return "Referral partner";
  if (roles.includes("media_partner")) return "Media partner";
  return "Member";
}
