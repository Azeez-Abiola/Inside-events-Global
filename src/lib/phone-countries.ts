/**
 * Country dialling codes for phone fields. Nigeria first (IGE's home market),
 * then the Africa–Europe corridor and the other markets sign-ups come from,
 * then the rest alphabetically. Not exhaustive: a number typed with its own
 * "+" prefix is accepted as-is, so nobody is locked out by this list.
 */
export type PhoneCountry = { iso: string; name: string; dial: string };

export const PHONE_COUNTRIES: PhoneCountry[] = [
  { iso: "NG", name: "Nigeria", dial: "+234" },
  { iso: "GH", name: "Ghana", dial: "+233" },
  { iso: "KE", name: "Kenya", dial: "+254" },
  { iso: "ZA", name: "South Africa", dial: "+27" },
  { iso: "GB", name: "United Kingdom", dial: "+44" },
  { iso: "AE", name: "United Arab Emirates", dial: "+971" },
  { iso: "US", name: "United States", dial: "+1" },
  { iso: "CA", name: "Canada", dial: "+1" },
  { iso: "FR", name: "France", dial: "+33" },
  { iso: "DE", name: "Germany", dial: "+49" },
  { iso: "NL", name: "Netherlands", dial: "+31" },
  { iso: "IE", name: "Ireland", dial: "+353" },
  { iso: "AU", name: "Australia", dial: "+61" },
  { iso: "BE", name: "Belgium", dial: "+32" },
  { iso: "BJ", name: "Benin", dial: "+229" },
  { iso: "BW", name: "Botswana", dial: "+267" },
  { iso: "CM", name: "Cameroon", dial: "+237" },
  { iso: "CI", name: "Côte d'Ivoire", dial: "+225" },
  { iso: "EG", name: "Egypt", dial: "+20" },
  { iso: "ET", name: "Ethiopia", dial: "+251" },
  { iso: "GM", name: "Gambia", dial: "+220" },
  { iso: "IN", name: "India", dial: "+91" },
  { iso: "IT", name: "Italy", dial: "+39" },
  { iso: "MA", name: "Morocco", dial: "+212" },
  { iso: "NA", name: "Namibia", dial: "+264" },
  { iso: "PT", name: "Portugal", dial: "+351" },
  { iso: "QA", name: "Qatar", dial: "+974" },
  { iso: "RW", name: "Rwanda", dial: "+250" },
  { iso: "SA", name: "Saudi Arabia", dial: "+966" },
  { iso: "SN", name: "Senegal", dial: "+221" },
  { iso: "SL", name: "Sierra Leone", dial: "+232" },
  { iso: "ES", name: "Spain", dial: "+34" },
  { iso: "SE", name: "Sweden", dial: "+46" },
  { iso: "CH", name: "Switzerland", dial: "+41" },
  { iso: "TZ", name: "Tanzania", dial: "+255" },
  { iso: "TG", name: "Togo", dial: "+228" },
  { iso: "UG", name: "Uganda", dial: "+256" },
  { iso: "ZM", name: "Zambia", dial: "+260" },
  { iso: "ZW", name: "Zimbabwe", dial: "+263" },
];

/** Timezones that name a country unambiguously, for a sensible default. */
const TZ_TO_ISO: Record<string, string> = {
  "Africa/Lagos": "NG",
  "Africa/Accra": "GH",
  "Africa/Nairobi": "KE",
  "Africa/Johannesburg": "ZA",
  "Europe/London": "GB",
  "Asia/Dubai": "AE",
  "Europe/Paris": "FR",
  "Europe/Berlin": "DE",
  "Europe/Amsterdam": "NL",
  "Europe/Dublin": "IE",
  "Africa/Cairo": "EG",
  "Africa/Kigali": "RW",
  "Africa/Kampala": "UG",
  "Africa/Dar_es_Salaam": "TZ",
  "Africa/Addis_Ababa": "ET",
  "Africa/Casablanca": "MA",
  "Africa/Dakar": "SN",
  "Africa/Abidjan": "CI",
  "Africa/Douala": "CM",
  "Asia/Qatar": "QA",
  "Asia/Riyadh": "SA",
  "Asia/Kolkata": "IN",
  "Europe/Madrid": "ES",
  "Europe/Rome": "IT",
  "Europe/Lisbon": "PT",
};

/** The visitor's likely country from their browser timezone, else Nigeria. */
export function guessPhoneCountry(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TZ_TO_ISO[tz]) return TZ_TO_ISO[tz];
    if (tz?.startsWith("America/")) return "US";
  } catch {
    // Intl unavailable: fall through to the default.
  }
  return "NG";
}

/**
 * The full international number. A number typed with its own "+" prefix wins
 * over the picked country; otherwise the local number's leading zeros (the
 * trunk prefix, as in 0801…) are dropped before the dialling code.
 */
export function toInternationalPhone(iso: string, local: string): string {
  const trimmed = local.trim();
  if (trimmed.startsWith("+")) return `+${trimmed.replace(/\D/g, "")}`;
  const dial = PHONE_COUNTRIES.find((c) => c.iso === iso)?.dial ?? "+234";
  return `${dial}${trimmed.replace(/\D/g, "").replace(/^0+/, "")}`;
}
