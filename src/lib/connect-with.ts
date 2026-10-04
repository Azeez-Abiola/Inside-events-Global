/**
 * "Looking to connect with" — the IGE user types an event owner can ask to be
 * matched to (TAB 3 §3.6.1 Section B, shown on cards per TAB 1 §1.5).
 *
 * Lives apart from the form component so the marketplace card and the My
 * Events table can label a value without importing a React component.
 */
export const CONNECT_WITH_OPTIONS: { value: string; label: string }[] = [
  { value: "sponsor", label: "Brand / Sponsor" },
  { value: "organiser", label: "Event Organiser" },
  { value: "media_partner", label: "Media Partner" },
  { value: "referral_partner", label: "Referral Partner" },
  { value: "partnerships_pro", label: "Partnerships Pro" },
  { value: "creative_hub", label: "Creative Hub" },
];

/** Falls back to the raw value so an unknown type shows as itself, not blank. */
export function connectWithLabel(value: string): string {
  return CONNECT_WITH_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
