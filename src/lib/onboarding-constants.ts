/**
 * Shared constants for the IGE onboarding wizard (PRD §3.13).
 * Single source of truth — never duplicate these in per-role forms.
 */

// §3.13 — Countries
export const ONBOARDING_COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Côte d'Ivoire",
  "Senegal",
  "United Kingdom",
  "France",
  "United States",
  "Canada",
  "UAE",
  "Other",
] as const;

// §3.13 — Sectors (used across all roles)
export const ONBOARDING_SECTORS = [
  "FMCG",
  "Fintech",
  "Telecom",
  "Fashion & Beauty",
  "Hospitality",
  "Automotive",
  "Health & Wellness",
  "Technology",
  "Media & Entertainment",
  "Government",
  "Education",
  "Logistics",
  "Real Estate",
  "Other",
] as const;

// §3.13 — Currencies
export const ONBOARDING_CURRENCIES = [
  "NGN (₦)",
  "USD ($)",
  "GBP (£)",
  "EUR (€)",
  "GHS (₵)",
  "KES (KSh)",
  "ZAR (R)",
] as const;

// §3.13 — How did you hear about IGE?
export const ONBOARDING_HEAR_ABOUT = [
  "Instagram",
  "LinkedIn",
  "Referral from a partner",
  "PartnerUp Podcast",
  "Google search",
  "Met at an event",
  "Other",
] as const;

// §3.13 — Creative types (Creative Hub only)
export const ONBOARDING_CREATIVE_TYPES = [
  "Filmmaker",
  "Music Video Director",
  "Skit Maker",
  "Artist / Gallery",
  "Influencer / Creator",
  "Photographer",
  "Podcast Host",
  "Stand-up Comedian",
  "Fashion Designer",
  "Recording Artist",
  "Author / Writer",
  "Animator / Motion Designer",
  "Theatre / Live Performance",
  "Documentary Maker",
] as const;

// Event types — shared across Organiser and Sponsor
export const EVENT_TYPES = [
  "Cultural Festival",
  "Business Summit",
  "Music",
  "Fashion Week",
  "Diaspora Gathering",
  "Sports",
  "Tech",
  "Food",
  "Awards",
  "Gala",
  "Exhibition",
  "Trade Fair",
  "Other",
] as const;

// Audience age ranges — Organiser Section C
export const AUDIENCE_AGE_RANGES = [
  "18–24",
  "25–34",
  "35–44",
  "45–54",
  "55+",
] as const;

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
export const BOOTH_SIZES = [
  "3×3m",
  "3×6m",
  "6×6m",
  "Custom",
] as const;

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

export const SUCCESS_METRICS = [
  "Attendance/reach numbers",
  "Sales/leads generated",
  "Media impressions",
  "Social engagement",
  "Post-event survey data",
  "Brand sentiment",
  "Repeat attendee/sponsor rate",
  "ROI vs spend",
] as const;

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

export const REFERRAL_NETWORK_SIZES = [
  "Under 100",
  "100–500",
  "500–2,000",
  "2,000+",
] as const;

export const REFERRAL_INTROS_PER_QUARTER = [
  "1–2",
  "3–5",
  "6–10",
  "10+",
] as const;

export const REFERRAL_DEAL_RANGES = [
  "Under ₦2M",
  "₦2M–₦5M",
  "₦5M–₦10M",
  "₦10M+",
] as const;

export const REFERRAL_COMMISSION_STRUCTURES = [
  "Connector — 15% one-time",
  "Champion — 25% recurring (≤12mo)",
  "Partner — 35–40% for life of contract",
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

export const MEDIA_REACH = [
  "Under 10K",
  "10K–50K",
  "50K–250K",
  "250K–1M",
  "1M+",
] as const;

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

export const MEDIA_COVERAGE_VALUE = [
  "Reach/impressions",
  "Feature articles",
  "Social amplification",
  "Podcast interview",
  "Documentary segment",
  "Livestream",
] as const;

// Sponsor company sizes
export const COMPANY_SIZES_OB = [
  "1–10",
  "11–50",
  "51–200",
  "201–1,000",
  "1,000+",
] as const;

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
export const MEDIA_COVERAGE_PLAN = [
  "Pre-event",
  "Day-of",
  "Post-event",
  "Full cycle",
] as const;

// Primary goal for partnership — media/referral "what you offer"
export const VALUE_EXCHANGE = ["Yes", "No", "Depends on the offer"] as const;

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
  key: string;       // e.g. "a"
  title: string;     // e.g. "Organiser details"
  subtitle?: string;
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
        { key: "f", title: "Matching profile", subtitle: "These fields directly power your match score." },
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
        { key: "e", title: "Matching profile", subtitle: "These fields directly power your match score." },
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
        { key: "e", title: "Matching profile", subtitle: "These fields directly power your match score." },
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
        { key: "e", title: "Matching profile", subtitle: "These fields directly power your match score." },
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
  organiser:        { label: "Event Organiser",   icon: "🎪", desc: "I run events and want sponsors." },
  sponsor:          { label: "Brand / Sponsor",   icon: "🏢", desc: "I have a budget to sponsor events." },
  referral_partner: { label: "Referral Partner",  icon: "🤝", desc: "I want to earn by connecting sponsors to events." },
  media_partner:    { label: "Media Partner",     icon: "📡", desc: "I cover, film, or document events." },
  partnerships_pro: { label: "Partnerships Pro",  icon: "🌍", desc: "ABW affiliate managing multiple clients." },
  creative_hub:     { label: "Creative Hub",      icon: "🎬", desc: "Connect your creative project with brand sponsors." },
  ige_admin:        { label: "IGE Admin",         icon: "⚡", desc: "Platform oversight — invite-only." },
};
