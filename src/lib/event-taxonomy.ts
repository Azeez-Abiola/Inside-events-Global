// Shared taxonomies for IGE event submission form

export const EVENT_TYPES = [
  "Conference / Summit / Business Forum",
  "Trade Show / Expo",
  "Industry Awards",
  "Gala Dinner / Fundraiser",
  "Networking Mixer",
  "Hackathon / Pitch Competition",
  "Workshop / Masterclass",
  "Roundtable / Boardroom",
  "Music Festival / Concert",
  "Cultural Festival",
  "Art Exhibition",
  "Film Festival / Premiere",
  "Fashion Show / Showcase",
  "Sports Tournament",
  "Charity / Non-Profit Gala",
  "Government / Public Sector Forum",
  "Diaspora / Community Gathering",
  "Religious / Faith-Based Event",
  "Health & Wellness Summit",
  "Education / EdTech Forum",
  "Tech Conference",
  "Fintech / Banking Summit",
  "Real Estate / PropTech Expo",
  "Energy / Power Summit",
  "Agriculture / AgriTech Event",
  "Food & Beverage Event",
  "Travel & Tourism Expo",
  "Automotive / Mobility Event",
  "Telecoms / ICT Forum",
  "Media / Creator Conference",
  "Beauty / Lifestyle Event",
  "Real-time Sports Viewing",
  "Investor / VC Day",
  "Product Launch",
  "Brand Activation",
  "Pop-up Experience",
  "Other",
];

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

export const PAYMENT_TERMS = [
  "50% upfront + 50% on event day",
  "100% upfront",
  "Custom",
];

export const CURRENCIES = ["NGN", "USD", "GBP", "EUR"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const SECTOR_EXPERTISE = PRIMARY_SECTORS;

export const COMPANY_SIZES = [
  "1–10",
  "11–50",
  "51–200",
  "201–500",
  "501–1000",
  "1000+",
];

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
