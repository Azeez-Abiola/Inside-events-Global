/**
 * Global Success Metrics Library (Dev Doc v6.4, Appendix C).
 *
 * Used by the Success metrics field in the shared Matching profile section
 * (TAB 3 §3.6.1, Section F). Metrics are grouped by the framework they come
 * from. IGE references these frameworks; it is not endorsed by them (TAB 21).
 *
 * Appendix C: "Event Organisers and Brand / Sponsors see the full library;
 * other roles see the metrics relevant to them."
 */

import type { OnboardingRole } from "./onboarding-constants";

export interface MetricGroup {
  /** Stable key, used to filter the library per role. */
  key: string;
  /** Framework name, shown as the group heading. */
  framework: string;
  /** What the framework treats as success — shown under the heading. */
  blurb: string;
  metrics: string[];
}

export const SUCCESS_METRIC_GROUPS: MetricGroup[] = [
  {
    key: "ieg_money",
    framework: "IEG (sponsorship.com) — Value for money",
    blurb:
      "The first of IEG's three value pillars: what the sponsorship cost against what it was worth.",
    metrics: [
      "Rights fee versus fair market value",
      "Media value of exposure",
      "Cost per impression",
      "Cost per lead",
      "Cost per engaged attendee",
      "Hospitality value",
      "Value of in-kind exchanged",
      "Renewal cost versus first-year cost",
    ],
  },
  {
    key: "ieg_brand",
    framework: "IEG (sponsorship.com) — Value for brand",
    blurb: "What the sponsorship did for how the brand is known, felt about and talked about.",
    metrics: [
      "Unaided and aided brand awareness lift",
      "Brand favourability and sentiment",
      "Consideration and purchase intent",
      "Brand association with the event's values",
      "Share of voice during the event window",
      "Earned media mentions and tone",
      "Recall of sponsor messaging",
    ],
  },
  {
    key: "ieg_business",
    framework: "IEG (sponsorship.com) — Value for business",
    blurb: "What the sponsorship did commercially: pipeline, revenue and relationships.",
    metrics: [
      "Qualified leads captured",
      "Sales or revenue attributed",
      "Product trial and sampling volume",
      "B2B meetings held and pipeline created",
      "New customers acquired",
      "Customer retention and loyalty",
      "Distribution or partner deals signed",
      "Employee engagement and recruitment",
    ],
  },
  {
    key: "esa",
    framework: "ESA (European Sponsorship Association) — objective-based evaluation",
    blurb: "Judges the partnership against the objectives both sides agreed before it started.",
    metrics: [
      "Objectives agreed before the sponsorship",
      "Return on Objectives achieved",
      "Audience engagement quality",
      "Stakeholder and client hospitality satisfaction",
      "Rights delivered as contracted",
      "Community and CSR outcomes",
      "Sustainable sponsorship practice",
      "Long-term partnership value",
    ],
  },
  {
    key: "ifea",
    framework: "IFEA (International Festivals & Events Association)",
    blurb: "Festival and public-event measures, including impact on the host community.",
    metrics: [
      "Attendance and unique visitors",
      "Visitor spending and economic impact on the host community",
      "Sponsor retention and renewal rate",
      "Community participation and volunteer numbers",
      "Attendee satisfaction",
      "Media exposure for the destination",
      "Year-on-year growth",
    ],
  },
  {
    key: "eic_apex",
    framework: "EIC / APEX (Events Industry Council)",
    blurb: "The events industry's standard operational measures for attendance and satisfaction.",
    metrics: [
      "Registrations versus attendance",
      "Attendee satisfaction or Net Promoter Score",
      "Session attendance and dwell time",
      "Exhibitor and sponsor satisfaction",
      "Leads per exhibitor or sponsor",
      "Appointments and meetings held",
      "Cost per attendee",
      "Content and learning outcomes",
    ],
  },
  {
    key: "iso_20121",
    framework: "ISO 20121 (event sustainability)",
    blurb: "The published international standard for event sustainability management.",
    metrics: [
      "Carbon footprint per attendee",
      "Waste diverted from landfill",
      "Local sourcing share",
      "Accessibility provision",
      "Community benefit",
      "Supplier sustainability compliance",
    ],
  },
  {
    key: "digital",
    framework: "Digital and content (industry standard)",
    blurb: "Reach and engagement across social, video, web and email.",
    metrics: [
      "Social impressions and reach",
      "Engagement rate",
      "Video views and completion rate",
      "Hashtag reach",
      "Website traffic and conversions",
      "Email or app sign-ups",
      "Content pieces delivered",
      "Livestream viewers",
    ],
  },
  {
    key: "organiser_commercial",
    framework: "Organiser commercial health",
    blurb: "Whether the event itself worked as a business.",
    metrics: [
      "Sponsorship target raised",
      "Number of sponsors and partners secured",
      "Sponsor renewal intent",
      "Ticket or registration revenue",
      "Budget versus actual",
      "Deliverables completed on time",
    ],
  },
];

/**
 * Appendix C: Organisers and Sponsors see the full library; other roles see
 * the metrics relevant to them. Referral, Media, Pro and Creative accounts
 * judge a partnership on reach, delivery and the objectives agreed — not on a
 * sponsor's internal brand-lift study or an organiser's P&L.
 */
const GROUPS_BY_ROLE: Record<OnboardingRole, string[] | "all"> = {
  organiser: "all",
  sponsor: "all",
  referral_partner: ["esa", "ieg_business", "digital"],
  media_partner: ["digital", "ieg_brand", "esa"],
  partnerships_pro: ["esa", "ieg_business", "ieg_money", "digital"],
  creative_hub: ["digital", "ieg_brand", "esa"],
  // Admin onboarding has no matching profile, so this is never read — present
  // only so the map stays exhaustive if a new role is added.
  ige_admin: "all",
};

/** The metric groups a given role is shown. */
export function successMetricGroupsForRole(role: OnboardingRole): MetricGroup[] {
  const allowed = GROUPS_BY_ROLE[role] ?? "all";
  if (allowed === "all") return SUCCESS_METRIC_GROUPS;
  return SUCCESS_METRIC_GROUPS.filter((g) => allowed.includes(g.key));
}

/** Every metric in the library, flattened — for validation and storage. */
export const ALL_SUCCESS_METRICS: string[] = SUCCESS_METRIC_GROUPS.flatMap((g) => g.metrics);
