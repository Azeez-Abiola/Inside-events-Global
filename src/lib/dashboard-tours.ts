export type DashboardTourRole =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "abw_admin"
  | "super_admin";

export type DashboardTourStep = {
  target: string;
  title: string;
  body: string;
};

/** Stable data-tour id for a workspace nav path */
export function navTourTarget(to: string): string {
  return `nav-${to.replace(/\//g, "-").replace(/^-/, "")}`;
}

export function getDashboardTourRole(roles: string[]): DashboardTourRole | null {
  if (roles.includes("super_admin")) return "super_admin";
  if (roles.includes("abw_admin")) return "abw_admin";
  if (roles.includes("organiser")) return "organiser";
  if (roles.includes("sponsor")) return "sponsor";
  if (roles.includes("referral_partner")) return "referral_partner";
  if (roles.includes("media_partner")) return "media_partner";
  return null;
}

const welcome: DashboardTourStep = {
  target: "main-content",
  title: "Welcome to your workspace",
  body: "This quick tour highlights the pages you'll use most. Everything else stays blurred until you're done.",
};

const messages: DashboardTourStep = {
  target: "nav-messages",
  title: "Messages",
  body: "Talk to organisers, sponsors, and partners in one place. New replies show up here and in notifications.",
};

const profile: DashboardTourStep = {
  target: "nav-profile",
  title: "Profile & settings",
  body: "Update your details, role profile, and password. You can replay this tour anytime from Profile.",
};

const notifications: DashboardTourStep = {
  target: "header-notifications",
  title: "Notifications",
  body: "Deal updates, messages, and platform alerts land here so nothing slips through.",
};

export const DASHBOARD_TOUR_STEPS: Record<DashboardTourRole, DashboardTourStep[]> = {
  organiser: [
    welcome,
    { target: navTourTarget("/dashboard"), title: "My events", body: "Create, edit, and submit events for IGE vetting. Track status from draft to live." },
    { target: navTourTarget("/dashboard/pipeline"), title: "Pipeline", body: "Follow sponsor interest and deals tied to your events through to close." },
    { target: navTourTarget("/dashboard/documents"), title: "Documents", body: "Keep sponsorship decks, contracts, and shared files organised per event." },
    { target: navTourTarget("/dashboard/analytics"), title: "Analytics", body: "See views, inquiries, and performance signals for your listings." },
    messages,
    notifications,
    profile,
  ],
  sponsor: [
    welcome,
    { target: navTourTarget("/dashboard"), title: "Dashboard", body: "Your home base for active deals, saved events, and recent activity." },
    { target: navTourTarget("/dashboard/discover"), title: "Discover", body: "Browse vetted B2B events matched to your sector, audience, and budget." },
    { target: navTourTarget("/dashboard/pipeline"), title: "My deals", body: "Track sponsorship conversations and commitments through the pipeline." },
    { target: navTourTarget("/dashboard/budget"), title: "Budget", body: "Plan annual sponsorship spend and compare opportunities side by side." },
    { target: navTourTarget("/dashboard/saved"), title: "Saved events", body: "Shortlist events you want to revisit before committing." },
    messages,
    notifications,
    profile,
  ],
  referral_partner: [
    welcome,
    { target: navTourTarget("/dashboard"), title: "Dashboard", body: "Overview of referrals, commissions, and deals you've introduced." },
    { target: navTourTarget("/dashboard/referrals"), title: "My referrals", body: "Generate trackable links and see who signed up through you." },
    { target: navTourTarget("/dashboard/commissions"), title: "Commission tracker", body: "Monitor earned and pending commission as deals close." },
    { target: navTourTarget("/dashboard/deals"), title: "Deal pipeline", body: "Follow referred sponsorships from intro to payout." },
    { target: navTourTarget("/dashboard/analytics"), title: "Analytics", body: "See trends across your referral network over time." },
    messages,
    notifications,
    profile,
  ],
  media_partner: [
    welcome,
    { target: navTourTarget("/dashboard"), title: "Dashboard", body: "Your hub for coverage requests, saved events, and partnership activity." },
    { target: navTourTarget("/dashboard/explore"), title: "Explore", body: "Discover vetted events worth covering, cross-promoting, or partnering on." },
    { target: navTourTarget("/dashboard/saved"), title: "Saved", body: "Bookmark events you are researching or planning to pitch." },
    { target: navTourTarget("/dashboard/requests"), title: "My requests", body: "Track media partnership requests you've sent to organisers." },
    messages,
    notifications,
    profile,
  ],
  abw_admin: [
    welcome,
    { target: navTourTarget("/dashboard"), title: "Admin dashboard", body: "Platform overview: vetting queue, revenue, and operational KPIs at a glance." },
    { target: navTourTarget("/dashboard/vetting"), title: "Event queue", body: "Review submitted events — approve, request revisions, or reject." },
    { target: navTourTarget("/dashboard/waitlist"), title: "Waitlist", body: "Invite or reject founding waitlist signups by role." },
    { target: navTourTarget("/dashboard/submissions"), title: "Contact & complaints", body: "Respond to inbound contact and deactivated-account complaints." },
    { target: navTourTarget("/dashboard/revenue"), title: "Revenue & deals", body: "Monitor the sponsorship pipeline and deal status across the platform." },
    messages,
    notifications,
    profile,
  ],
  super_admin: [
    welcome,
    { target: navTourTarget("/dashboard"), title: "Admin dashboard", body: "Full platform overview with vetting, revenue, and partner activity." },
    { target: navTourTarget("/dashboard/vetting"), title: "Event queue", body: "Manual vetting before any event goes live on the marketplace." },
    { target: navTourTarget("/dashboard/users"), title: "Users", body: "View all accounts and deactivate users who breach platform standards." },
    { target: navTourTarget("/dashboard/team"), title: "Admin team", body: "Invite sub-admins, resend credentials, and manage platform staff access." },
    { target: navTourTarget("/dashboard/audit"), title: "Audit log", body: "See who signed in and what sensitive actions were taken, with timestamps." },
    { target: navTourTarget("/dashboard/controls"), title: "Fraud & rates", body: "Commission rates, FX controls, and fraud flag resolution." },
    messages,
    notifications,
    profile,
  ],
};

/** Keep only steps whose targets exist in the DOM (permission-gated nav items). */
export function resolveTourSteps(role: DashboardTourRole): DashboardTourStep[] {
  if (typeof document === "undefined") return DASHBOARD_TOUR_STEPS[role];
  return DASHBOARD_TOUR_STEPS[role].filter((step) => {
    if (step.target === "main-content") return true;
    return !!document.querySelector(`[data-tour="${step.target}"]`);
  });
}
