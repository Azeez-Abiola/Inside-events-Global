/**
 * Agency details (TAB 3, added in v6.0 for Event Organiser and Brand / Sponsor).
 *
 * "Optional field; answering Yes reveals the Agency Details group below."
 *
 * The shape and option list live apart from the component so both role
 * schemas can type against them without importing React.
 */

export const AGENCY_ANSWERS = [
  "Yes, an agency manages this on our behalf.",
  "No, we manage this ourselves.",
] as const;

export interface AgencyDetailsData {
  works_with_agency: string;
  agency_name: string;
  agency_contact_name: string;
  agency_contact_email: string;
  agency_contact_phone: string;
}

/** Pulls the agency fields out of a saved section, with defaults. */
export function agencyDetailsFrom(initial?: Partial<AgencyDetailsData>): AgencyDetailsData {
  return {
    works_with_agency: initial?.works_with_agency ?? "",
    agency_name: initial?.agency_name ?? "",
    agency_contact_name: initial?.agency_contact_name ?? "",
    agency_contact_email: initial?.agency_contact_email ?? "",
    agency_contact_phone: initial?.agency_contact_phone ?? "",
  };
}

export function worksWithAgency(value: string): boolean {
  return value.startsWith("Yes");
}
