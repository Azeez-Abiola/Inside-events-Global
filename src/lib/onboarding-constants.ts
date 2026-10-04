/**
 * Shared constants for the IGE onboarding wizard (PRD §3.13).
 * Single source of truth — never duplicate these in per-role forms.
 */

import { EVENT_TYPE_VALUES } from "./event-types";
import { ALL_SUCCESS_METRICS } from "./success-metrics";

export { IGE_EVENT_TYPES, eventTypeDescription, isLegacyEventType } from "./event-types";
export { SUCCESS_METRIC_GROUPS, successMetricGroupsForRole } from "./success-metrics";
export type { EventTypeDef } from "./event-types";
export type { MetricGroup } from "./success-metrics";

// Appendix B — Countries
export const ONBOARDING_COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Côte d'Ivoire",
  "Senegal",
  "Egypt",
  "United Kingdom",
  "France",
  "United States",
  "Canada",
  "United Arab Emirates",
  "Saudi Arabia",
  "Qatar",
  "Other Middle East",
  "Other",
] as const;

// Appendix B — Sectors (used across all roles)
export const ONBOARDING_SECTORS = [
  "FMCG",
  "Banking & Financial Services",
  "Fintech",
  "Telecom",
  "Oil & Gas and Energy",
  "Fashion & Beauty",
  "Hospitality & Tourism",
  "Aviation",
  "Automotive",
  "Health & Wellness",
  "Pharmaceuticals",
  "Technology",
  "Media & Entertainment",
  "Film & Creative Economy",
  "Sports",
  "Government & Public Sector",
  "Education",
  "NGOs & Development",
  "Logistics",
  "Real Estate",
  "Agriculture",
  "Manufacturing",
  "Retail & E-commerce",
  "Other",
] as const;

// Appendix B — Currencies
export const ONBOARDING_CURRENCIES = [
  "NGN (₦)",
  "USD ($)",
  "GBP (£)",
  "EUR (€)",
  "GHS (₵)",
  "KES (KSh)",
  "ZAR (R)",
  "EGP (E£)",
  "AED",
  "SAR",
  "QAR",
] as const;

// Appendix B — How did you hear about IGE?
export const ONBOARDING_HEAR_ABOUT = [
  "Instagram",
  "LinkedIn",
  "WhatsApp",
  "TikTok",
  "Referral from a partner",
  "Referral from an agency or affiliate",
  "PartnerUp Podcast",
  "Google search",
  "Met at an event",
  "Other",
] as const;

/**
 * Appendix B — the 37 event types. Re-exported from the single source of truth
 * so onboarding, the event editor and the marketplace cannot drift apart.
 */
export const EVENT_TYPES = EVENT_TYPE_VALUES;

// Audience age ranges — Organiser Section C
export const AUDIENCE_AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55+"] as const;

// Audience industry / occupation — Organiser Section C
export const AUDIENCE_INDUSTRIES = [
  "Finance",
  "Tech",
  "Creative",
  "Fashion",
  "Health",
  "Government",
  "Entrepreneurs",
  "Students",
  "Diaspora",
  "Other",
] as const;

// Audience geographic spread — Organiser Section C
export const AUDIENCE_GEO = [
  "Local only",
  "National",
  "Pan-African",
  "Diaspora Europe",
  "Diaspora Americas",
  "International",
] as const;

// Booth sizes — Organiser Section D
export const BOOTH_SIZES = ["3×3m", "3×6m", "6×6m", "Custom"] as const;

// Sponsor target geographies — Sponsor Section B
export const TARGET_MARKETS = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Côte d'Ivoire",
  "Senegal",
  "Diaspora UK",
  "Diaspora France",
  "Pan-African",
  "Other",
] as const;

// Sponsor target audience profile — Sponsor Section B
export const SPONSOR_AUDIENCES = [
  "Young professionals 25–35",
  "Entrepreneurs",
  "High net worth",
  "Students",
  "Women in business",
  "Tech community",
  "Creative industries",
  "Diaspora community",
  "General consumer",
  "Other",
] as const;

// Activation formats — Sponsor Section B
export const ACTIVATION_FORMATS = [
  "Title/naming rights",
  "Exhibition booth",
  "Hosted session",
  "Product sampling",
  "Brand ambassador",
  "Content creation rights",
  "Digital/social integration",
  "VIP hospitality",
  "Award sponsorship",
  "Community partnership",
] as const;

// Typical investment range — Sponsor Section C
export const INVESTMENT_RANGES = [
  "Under ₦2M",
  "₦2M–₦5M",
  "₦5M–₦10M",
  "₦10M–₦25M",
  "₦25M+",
] as const;

// Matching profile — shared Section (all roles)
export const PARTNERSHIP_GOALS = [
  "Brand awareness / audience reach",
  "Revenue / sponsorship income",
  "Lead generation",
  "Content & audience data",
  "Community building",
  "Market entry",
  "Long-term strategic partnership",
] as const;

/**
 * Appendix C — the Global Success Metrics Library, flattened.
 * Forms should render the grouped library (`successMetricGroupsForRole`) so
 * users see which framework each metric comes from; this flat list is for
 * validation and storage.
 */
export const SUCCESS_METRICS = ALL_SUCCESS_METRICS;

export const ROI_MULTIPLES = [
  "1–2x spend",
  "2–4x spend",
  "4x+ spend",
  "Not primarily ROI-driven",
  "Too early to say",
] as const;

export const MULTI_YEAR_INTEREST = [
  "Yes, actively seeking multi-year deals",
  "Open to it if year one goes well",
  "One-off only for now",
  "Depends on terms",
] as const;

// Wishlist support needs — shared (all roles)
export const WISHLIST_SUPPORT = [
  // §3.2A: the field requires at least one selection, so there has to be an
  // honest way to say you need nothing. Without it people pick at random and
  // IGE acts on support requests nobody made.
  "Nothing right now",
  "Volunteers",
  "Project manager",
  "Videographer",
  "Photographer",
  "Media/press team",
  "Event set-up crew",
  "Stage design",
  "Lighting",
  "Sound/AV",
  "Décor & styling",
  "MC/hosts",
  "Security",
  "Logistics & transport",
  "Legal/contracts",
  "Design & creative assets",
  "Introductions to sponsors",
  "Introductions to organisers",
  "Value-exchange (barter) partners",
  "Other",
] as const;

// Referral Partner — network type
export const REFERRAL_NETWORK_TYPES = [
  "Corporate/brand contacts",
  "Event organiser contacts",
  "Diaspora community",
  "Industry association",
  "Media contacts",
  "Mixed",
] as const;

export const REFERRAL_NETWORK_SIZES = ["Under 100", "100–500", "500–2,000", "2,000+"] as const;

export const REFERRAL_INTROS_PER_QUARTER = ["1–2", "3–5", "6–10", "10+"] as const;

export const REFERRAL_DEAL_RANGES = ["Under ₦2M", "₦2M–₦5M", "₦5M–₦10M", "₦10M+"] as const;

// v6.3/v6.4: commission is 3–15% of the sponsorship value in total, and partner
// shares come out of it (TAB 10, TAB 11 §11.2). The earlier 15/25/35–40 tiers
// predate that decision and promised rates the model no longer offers.
export const REFERRAL_COMMISSION_STRUCTURES = [
  "Connector — 3% or 5% one-time",
  "Champion — 7% or 10% recurring (≤12mo)",
  "Partner — up to 15% for life of contract",
] as const;

// Media Partner — media types
export const MEDIA_TYPES = [
  "Print",
  "Digital/online",
  "Broadcast TV",
  "Radio",
  "Podcast",
  "Social media/influencer",
  "Photography",
  "Documentary",
] as const;

export const MEDIA_REACH = ["Under 10K", "10K–50K", "50K–250K", "250K–1M", "1M+"] as const;

export const MEDIA_BEATS = [
  "Business",
  "Culture",
  "Entertainment",
  "Lifestyle",
  "Diaspora",
  "Fashion",
  "Tech",
] as const;

export const MEDIA_GEO = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Diaspora UK",
  "Diaspora US",
  "Pan-African",
  "Global",
] as const;

export const MEDIA_ACCREDITATION = [
  "Press pass",
  "Photography access",
  "Backstage/VIP access",
  "Interview access",
  "Livestream rights",
] as const;

/**
 * Media Partner Section D — "Assets you will deliver" (TAB 3 §3.6.4, v6.3).
 * Concrete deliverables, not a vague offer: organisers choose a media partner
 * on exactly this list, and it is what the Deliverables tracker reports against.
 */
export const MEDIA_ASSETS = [
  "60-second highlight video",
  "15 to 30-second reels",
  "Full event recap video",
  "Edited photo gallery (shared drive link)",
  "Raw photo drive",
  "Live social coverage (stories and posts)",
  "Interviews",
  "Feature article",
  "Podcast episode",
  "Newsletter feature",
  "Livestream",
  "Documentary segment",
  "Press release distribution",
  "Radio or TV mention",
  "Other",
] as const;

export const MEDIA_TURNAROUND = [
  "Within 24 hours",
  "Within 48 hours",
  "Within 1 week",
  "Within 2 weeks",
] as const;

export const MEDIA_DELIVERY_METHOD = [
  "Shared drive link (for example Google Drive)",
  "Upload to IGE (Deliverables & Uploads)",
  "Other",
] as const;

export const MEDIA_EXCLUSIVITY = ["Yes", "No", "Depends on the event"] as const;

/**
 * Superseded by MEDIA_ASSETS in v6.3. Kept so applications submitted against
 * the old list still render their saved answers instead of showing blanks.
 */
export const MEDIA_COVERAGE_VALUE = [
  "Reach/impressions",
  "Feature articles",
  "Social amplification",
  "Podcast interview",
  "Documentary segment",
  "Livestream",
] as const;

// Sponsor company sizes
export const COMPANY_SIZES_OB = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"] as const;

// D&I focus — Organiser Section D
export const DIV_INCLUSION_OPTIONS = [
  "Gender-balanced programming",
  "Disability accessibility provisions",
  "Youth inclusion",
  "Local community inclusion",
  "Not currently tracked",
] as const;

// Sustainability — Organiser Section D
export const SUSTAINABILITY_OPTIONS = [
  "Yes, formal practices",
  "Some informal steps",
  "Not yet, open to guidance",
  "Not applicable",
] as const;

// Sponsor events per year
export const EVENTS_PER_YEAR = ["1", "2–3", "4–6", "6+"] as const;

// Sponsor timeline for first commitment
export const COMMITMENT_TIMELINES = [
  "Immediately",
  "Within 30 days",
  "Next quarter",
  "Exploring for later in the year",
] as const;

// Referral brand seniority
export const BRAND_SENIORITY = [
  "C-suite/Founders",
  "VP/Director",
  "Manager level",
  "Mixed",
] as const;

// Referral typical sectors of past deals (same as ONBOARDING_SECTORS)
// Media coverage plan
export const MEDIA_COVERAGE_PLAN = ["Pre-event", "Day-of", "Post-event", "Full cycle"] as const;

// Primary goal for partnership — media/referral "what you offer"
export const VALUE_EXCHANGE = ["Yes", "No", "Depends on the offer"] as const;

// ─── v6.3 Matching profile additions (TAB 3 §3.6.1 Section F) ─────────────────

/** Asked of every role: what the person will give back to a partner. */
export const CAN_OFFER_PARTNER = [
  "Cash sponsorship",
  "In-kind products or services",
  "Venue or space",
  "Media exposure and content",
  "Audience access (with consent)",
  "Speaking or stage slots",
  "Expertise or mentorship",
  "Network introductions",
  "Staff or volunteers",
  "Distribution channels",
  "Social amplification",
  "Technology",
  "Other",
] as const;

/**
 * The three IEG value pillars (TAB 8 §8.2). Organisers pick what they can offer
 * a sponsor; sponsors pick the same list read as the return they expect.
 */
export const ROI_PILLARS: { pillar: string; options: string[] }[] = [
  {
    pillar: "Value for money",
    options: [
      "Category exclusivity",
      "Naming rights",
      "Hospitality and VIP passes",
      "Multi-year rates",
    ],
  },
  {
    pillar: "Value for brand",
    options: [
      "Branding placements",
      "Stage and speaking slots",
      "Content and social amplification",
      "Media coverage and PR",
      "Activation space",
      "Sampling",
      "Ambassador or influencer tie-ins",
    ],
  },
  {
    pillar: "Value for business",
    options: [
      "Lead capture with consent",
      "B2B meetings",
      "On-site sales",
      "Audience data and post-event survey",
      "Client hospitality",
      "Employee engagement",
      "CSR or community impact reporting",
    ],
  },
];

/** Flat list of every ROI pillar option, for validation and storage. */
export const ROI_PILLAR_OPTIONS = ROI_PILLARS.flatMap((p) => p.options);

/** Organiser and Sponsor only: what they want from a partner. */
export const WANT_FROM_PARTNER = [
  "Cash",
  "In-kind support",
  "Media coverage",
  "Audience access",
  "Content",
  "Co-creation of the event",
  "Activation partners",
  "Distribution",
  "Other",
] as const;

/** Sponsor only: what the brand can offer an event beyond cash. */
export const OFFER_BEYOND_CASH = [
  "Products or sampling stock",
  "Services",
  "Venue",
  "Media buying or amplification",
  "Staff or volunteers",
  "Technology",
  "Expertise",
  "Other",
] as const;

// ─── v6.3 Wishlist additions: ABW Consulting lead capture (TAB 3 §3.6.1 G) ────

export const ABW_CONSULTING_INTEREST = ["Yes, I'm interested", "Not now"] as const;

export const ABW_SERVICES = [
  "Sponsorship strategy",
  "Partnership strategy",
  "Event planning",
  "Sponsorship deck and proposal",
  "Sponsor sourcing and outreach",
  "Negotiation and closing",
  "Activation planning and execution",
  "Event and partnership management",
  "Brand-Readiness Audit",
  "ROI measurement and reporting",
  "Media and documentary coverage",
  "Training and masterclasses",
  "Fractional partnerships team",
] as const;

/** No prices are shown anywhere — Admin follows up with a meeting (TAB 11). */
export const ABW_PAYMENT_PREFERENCE = [
  "Monthly retainer",
  "One-off fee",
  "Annual fee",
  "Not sure yet, let's discuss",
] as const;

// ─── Partnerships Pro (TAB 3 §3.6.5) ──────────────────────────────────────────

export const PRO_EXPERIENCE_YEARS = ["Under 2", "2–5", "5–10", "10+"] as const;

export const PRO_PROFESSIONAL_TYPES = [
  "Affiliate",
  "In-house partnerships executive",
  "Independent partnerships consultant",
  "Agency partnerships lead",
  "Business development manager",
  "Sponsorship sales",
  "Other",
] as const;

export const PRO_CLIENT_TYPES = [
  "Brand Sponsors",
  "Event Organisers",
  "Agencies",
  "Creators and productions",
  "Institutions (schools, NGOs, government)",
  "Corporate partners",
  "Media partners",
  "Referral partners",
] as const;

export const PRO_PARTNERSHIP_TYPES = [
  "Event sponsorship",
  "Brand partnerships",
  "Co-marketing",
  "CSR partnerships",
  "Product placement",
  "Distribution partnerships",
  "Affiliate and referral",
  "Institutional partnerships",
  "Other",
] as const;

export const PRO_DEALS_PER_QUARTER = ["1–2", "3–5", "6–10", "10+"] as const;
export const PRO_INTROS_PER_MONTH = ["1–3", "4–8", "9–15", "15+"] as const;

/** Sets the default format of the Weekly Activity Report (TAB 4 §4.4.3). */
export const PRO_REPORTS_TO = ["Myself", "A manager", "Clients directly", "Both"] as const;

export const PRO_CONTACT_TYPES = [
  "Decision maker",
  "Influencer",
  "Gatekeeper",
  "Agency contact",
  "Organiser contact",
  "Brand contact",
  "Media contact",
  "Vendor",
  "Other",
] as const;

/** Editable later from the CRM — this is only the starting pipeline. */
export const PRO_DEFAULT_PIPELINE_STAGES = [
  "Lead",
  "Contacted",
  "Meeting held",
  "Proposal sent",
  "Negotiating",
  "Won",
  "Paid",
  "Delivered",
  "Lost",
] as const;

// ─── Creative Hub (TAB 3 §3.6.6) ──────────────────────────────────────────────

/** Picked before the wizard starts; shown as a badge throughout the profile. */
export const CREATIVE_TYPES = [
  "Filmmaker",
  "Film/TV Producer",
  "Music Video Director",
  "Skit Maker",
  "Artist/Gallery",
  "Influencer",
  "Content Creator",
  "Photographer",
  "Podcast Host",
  "Stand-up Comedian",
  "Fashion Designer",
  "Recording Artist",
  "Author/Writer",
  "Animator/Motion Designer",
  "Theatre/Live Performance",
  "Documentary Maker",
] as const;

/**
 * Appendix B — Creative types (Creative Hub picker).
 * Kept as an alias so older imports keep resolving to the canonical list.
 */
export const ONBOARDING_CREATIVE_TYPES = CREATIVE_TYPES;

export const CREATIVE_FOLLOWING_BANDS = [
  "Under 10K",
  "10K–50K",
  "50K–250K",
  "250K–1M",
  "1M+",
] as const;

export const CREATIVE_PLATFORMS = [
  "YouTube",
  "Instagram",
  "TikTok",
  "Cinema/theatrical",
  "Streaming platform",
  "Gallery/physical space",
  "Live performance",
] as const;

export const CREATIVE_AVG_VIEWS = ["Under 10K", "10K–100K", "100K–500K", "500K+"] as const;

export const CREATIVE_PROJECT_TYPES = [
  "Product placement",
  "Full brand integration",
  "Sponsored series",
  "Single project funding",
  "Gallery/exhibition sponsorship",
  "Tour/event sponsorship",
] as const;

export const CREATIVE_BUDGET_NGN = ["Under ₦1M", "₦1M–₦5M", "₦5M–₦15M", "₦15M+"] as const;

export const CREATIVE_BUDGET_USD = ["Under $2.5K", "$2.5K–$10K", "$10K–$50K", "$50K+"] as const;

export const CREATIVE_TIMELINE = [
  "Ready now",
  "Within 30 days",
  "Next quarter",
  "Exploring",
] as const;

export const CREATIVE_FORMATS = [
  "Feature film",
  "TV series",
  "Web series",
  "Short film",
  "Documentary",
  "Music video",
  "Album or single",
  "Podcast",
  "Stage play",
  "Exhibition",
  "Social content series",
  "Other",
] as const;

export const CREATIVE_PRODUCTION_STAGES = [
  "Development",
  "Pre-production",
  "In production",
  "Post-production",
  "Released",
] as const;

export const CREATIVE_PLACEMENTS = [
  "Product placement on screen",
  "Brand integration in storyline",
  "Title or presenting sponsor",
  "Co-branded content",
  "Premiere or launch event sponsorship",
  "Merchandise",
  "Other",
] as const;

export type OnboardingRole =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "partnerships_pro"
  | "creative_hub"
  | "ige_admin";

export type OnboardingStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "rejected"
  | "changes_requested";

export interface SectionDef {
  key: string; // e.g. "a"
  title: string; // e.g. "Organiser details"
  subtitle?: string;
  /**
   * Resolved from onboarding_section_config, falling back to
   * DEFERRABLE_SECTIONS. Undefined means "not resolved yet" — render it as
   * compulsory until the config says otherwise.
   */
  compulsory?: boolean;
}

// ─── Progressive onboarding (TAB 3 §3.2A) ─────────────────────────────────────

/**
 * Fallback for the onboarding_section_config table. The table is the source of
 * truth so ABW can move a section without a release; this map only applies when
 * the table has no row for a section, so a missing row degrades to "compulsory"
 * rather than silently letting someone skip something that matters.
 *
 * Keyed by section id per role because the letters differ: Verification & trust
 * is H for Event Organisers and G for everyone else.
 */
export const DEFERRABLE_SECTIONS: Record<OnboardingRole, string[]> = {
  organiser: ["h"],
  sponsor: ["g"],
  referral_partner: ["g"],
  media_partner: ["g"],
  partnerships_pro: ["g"],
  creative_hub: ["g"],
  ige_admin: [],
};

export type SectionProgress = "not_started" | "complete" | "skipped";

export type OnboardingProgress = "compulsory_incomplete" | "compulsory_complete" | "fully_complete";

/** What stays locked until Verification & trust is complete (TAB 3 §3.2A). */
export interface LockedFeature {
  key: string;
  label: string;
  unlocksWhen: string;
}

export const VERIFICATION_LOCKED_FEATURES: LockedFeature[] = [
  {
    key: "verified_badge",
    label: "Verified badge on your profile and published listings",
    unlocksWhen: "Registration number and document uploaded and checked by IGE",
  },
  {
    key: "featured_eligibility",
    label: "Eligibility to be Featured by IGE",
    unlocksWhen: "Verification complete",
  },
  {
    key: "payments",
    label: "Receiving sponsor payments, payouts and commission through IGE",
    unlocksWhen: "Verification complete",
  },
  {
    key: "contracts",
    label: "In-platform contract generation and e-signature",
    unlocksWhen: "Verification complete",
  },
  {
    key: "verified_reports",
    label: "Investment Reports and Business Cases carrying the IGE Verified mark",
    unlocksWhen: "Verification complete",
  },
];

/**
 * Account-level onboarding state from what has actually been filled in.
 * A skipped deferrable section keeps someone at compulsory_complete: they reach
 * the dashboard, but the profile-completion bar still has something to say.
 */
export function deriveOnboardingProgress(
  sections: { key: string; compulsory: boolean }[],
  sectionStatus: Record<string, SectionProgress>,
): OnboardingProgress {
  const isDone = (k: string) => sectionStatus[k] === "complete";
  const compulsoryDone = sections.filter((s) => s.compulsory).every((s) => isDone(s.key));
  if (!compulsoryDone) return "compulsory_incomplete";
  return sections.every((s) => isDone(s.key)) ? "fully_complete" : "compulsory_complete";
}

/** Sections still outstanding, for the dashboard completion bar. */
export function outstandingSections(
  sections: { key: string; title: string; compulsory: boolean }[],
  sectionStatus: Record<string, SectionProgress>,
): { key: string; title: string; compulsory: boolean }[] {
  return sections.filter((s) => sectionStatus[s.key] !== "complete");
}

export function getSectionsForRole(role: OnboardingRole): SectionDef[] {
  switch (role) {
    case "organiser":
      return [
        { key: "a", title: "Organiser details" },
        { key: "b", title: "Event details" },
        { key: "c", title: "Audience data" },
        { key: "d", title: "Sponsorship packages" },
        { key: "e", title: "Media & documentary" },
        {
          key: "f",
          title: "Matching profile",
          subtitle: "These fields directly power your match score.",
        },
        { key: "g", title: "Wishlist & support needed" },
        { key: "h", title: "Verification & trust" },
        { key: "i", title: "Referral & consent" },
      ];
    case "sponsor":
      return [
        { key: "a", title: "Brand / Sponsor details" },
        { key: "b", title: "Sponsorship interests" },
        { key: "c", title: "Investment & timeline" },
        { key: "d", title: "Media & documentary" },
        {
          key: "e",
          title: "Matching profile",
          subtitle: "These fields directly power your match score.",
        },
        { key: "f", title: "Wishlist & support needed" },
        { key: "g", title: "Verification & trust" },
        { key: "h", title: "Referral & consent" },
      ];
    case "referral_partner":
      return [
        { key: "a", title: "Referral Partner details" },
        { key: "b", title: "Network & reach" },
        { key: "c", title: "Sponsorship experience" },
        { key: "d", title: "Goals with I.G.E" },
        {
          key: "e",
          title: "Matching profile",
          subtitle: "These fields directly power your match score.",
        },
        { key: "f", title: "Wishlist & support needed" },
        { key: "g", title: "Verification & trust" },
        { key: "h", title: "Referral & consent" },
      ];
    case "media_partner":
      return [
        { key: "a", title: "Media Partner details" },
        { key: "b", title: "Coverage profile" },
        { key: "c", title: "Accreditation & needs" },
        { key: "d", title: "Partnership goals" },
        {
          key: "e",
          title: "Matching profile",
          subtitle: "These fields directly power your match score.",
        },
        { key: "f", title: "Wishlist & support needed" },
        { key: "g", title: "Verification & trust" },
        { key: "h", title: "Referral & consent" },
      ];
    case "partnerships_pro":
      return [
        { key: "a", title: "Professional details" },
        { key: "b", title: "Client portfolio" },
        { key: "c", title: "Commission & goals" },
        { key: "d", title: "CRM setup" },
        {
          key: "e",
          title: "Matching profile",
          subtitle: "These fields directly power your match score.",
        },
        { key: "f", title: "Wishlist & support needed" },
        { key: "g", title: "Verification & trust" },
        { key: "h", title: "Referral & consent" },
      ];
    case "creative_hub":
      return [
        { key: "a", title: "Creative profile" },
        { key: "b", title: "Work & reach" },
        { key: "c", title: "Sponsorship fit" },
        { key: "d", title: "Production & placement details" },
        {
          key: "e",
          title: "Matching profile",
          subtitle: "These fields directly power your match score.",
        },
        { key: "f", title: "Wishlist & support needed" },
        { key: "g", title: "Verification & trust" },
        { key: "h", title: "Referral & consent" },
      ];
    default:
      return [
        { key: "a", title: "Details" },
        { key: "b", title: "Referral & consent" },
      ];
  }
}

export const ROLE_DISPLAY: Record<OnboardingRole, { label: string; icon: string; desc: string }> = {
  organiser: { label: "Event Organiser", icon: "🎪", desc: "I run events and want sponsors." },
  sponsor: { label: "Brand / Sponsor", icon: "🏢", desc: "I have a budget to sponsor events." },
  referral_partner: {
    label: "Referral Partner",
    icon: "🤝",
    desc: "I want to earn by connecting sponsors to events.",
  },
  media_partner: { label: "Media Partner", icon: "📡", desc: "I cover, film, or document events." },
  partnerships_pro: {
    label: "Partnerships Pro",
    icon: "🌍",
    desc: "ABW affiliate managing multiple clients.",
  },
  creative_hub: {
    label: "Creative Hub",
    icon: "🎬",
    desc: "Connect your creative project with brand sponsors.",
  },
  ige_admin: { label: "IGE Admin", icon: "⚡", desc: "Platform oversight — invite-only." },
};
