// Shared taxonomies for IGE event submission form

/**
 * The 37 IGE event types (Appendix B). Re-exported from the single source of
 * truth — the sector-flavoured list this file used to carry was replaced in
 * v6.4, and legacy values on existing listings are mapped by the
 * 20261004091000_event_type_taxonomy migration.
 */
export {
  EVENT_TYPE_VALUES as EVENT_TYPES,
  IGE_EVENT_TYPES,
  eventTypeDescription,
} from "./event-types";

export const COUNTRIES = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "Algeria",
  "Angola",
  "Botswana",
  "Cameroon",
  "Côte d'Ivoire",
  "Egypt",
  "Ethiopia",
  "France",
  "Germany",
  "Morocco",
  "Rwanda",
  "Senegal",
  "Tanzania",
  "Tunisia",
  "Uganda",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Zambia",
  "Zimbabwe",
  "Other",
];

export const PRIMARY_SECTORS = [
  "Fintech",
  "Banking",
  "FMCG",
  "Telecoms",
  "Energy",
  "Real Estate",
  "Fashion",
  "Entertainment",
  "Technology",
  "Healthcare",
  "Education",
  "Government",
  "Diaspora / Culture",
  "Other",
];

export const PRIMARY_AUDIENCES = [
  "Founders / CEOs",
  "CMOs / Marketing Directors",
  "CFOs",
  "Tech Professionals",
  "Government Officials",
  "Diaspora Community",
  "General Consumer",
  "Other",
];

export const SENIORITY = ["C-Suite", "Senior Manager", "Manager", "Mixed"];

export const GEOGRAPHIC_MIX = [
  "Nigeria",
  "West Africa",
  "Pan-Africa",
  "UK Diaspora",
  "France Diaspora",
  "Europe",
  "North America",
  "Other",
];

export const EXPOSURE_CHANNELS = [
  "Stage branding",
  "Event website",
  "Social media",
  "Email newsletter",
  "On-site signage",
  "Program / agenda booklet",
  "Photo / video coverage",
  "Live stream branding",
  "Other",
];

export const PAYMENT_TERMS = ["50% upfront + 50% on event day", "100% upfront", "Custom"];

export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SECTOR_EXPERTISE = PRIMARY_SECTORS;

export const COMPANY_SIZES = ["1–10", "11–50", "51–200", "201–500", "501–1000", "1000+"];

export const STATUS_BADGE: Record<
  string,
  { label: string; tone: "gray" | "amber" | "red" | "emerald" | "dark" }
> = {
  draft: { label: "Draft", tone: "gray" },
  submitted: { label: "Submitted", tone: "gray" },
  under_review: { label: "Under review", tone: "amber" },
  revision_requested: { label: "Revision requested", tone: "red" },
  approved: { label: "Approved", tone: "emerald" },
  listed: { label: "Listed", tone: "emerald" },
  closed: { label: "Closed", tone: "dark" },
  archived: { label: "Archived", tone: "dark" },
  rejected: { label: "Rejected", tone: "red" },
};
