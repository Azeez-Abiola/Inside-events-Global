import { Field, SelectField } from "@/components/signup/profile-fields";
import { InfoTip } from "@/components/info-tip";
import { AGENCY_ANSWERS, worksWithAgency, type AgencyDetailsData } from "@/lib/agency-details";

/**
 * Agency details (TAB 3, added in v6.0 for Event Organiser and Brand / Sponsor).
 *
 * "Optional field; answering Yes reveals the Agency Details group below."
 *
 * The four sub-fields are hidden rather than cleared when the answer flips
 * back to No, per §3.9: "Conditional fields hide/disable rather than delete
 * entered values." Someone who mis-clicks does not lose what they typed.
 */

export function AgencyDetailsFields({
  value,
  onChange,
  question,
}: {
  value: AgencyDetailsData;
  onChange: (patch: Partial<AgencyDetailsData>) => void;
  /** Wording differs slightly between organiser ("this event") and sponsor. */
  question: string;
}) {
  const show = worksWithAgency(value.works_with_agency);

  return (
    <>
      <div>
        <div className="mb-1 flex items-center text-sm font-medium text-foreground">
          {question}
          <InfoTip tip="field.agency" />
        </div>
        <SelectField
          label=""
          value={value.works_with_agency}
          onChange={(v) => onChange({ works_with_agency: v })}
          options={[...AGENCY_ANSWERS]}
        />
      </div>

      {show && (
        <div className="space-y-5 rounded-xl border border-border bg-muted/20 p-4">
          <p className="text-xs text-muted-foreground">
            Admin keeps the agency in the loop on anything that needs their sign-off. All optional.
          </p>
          <Field
            label="Agency name"
            value={value.agency_name}
            onChange={(v: string) => onChange({ agency_name: v })}
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Agency contact person"
              value={value.agency_contact_name}
              onChange={(v: string) => onChange({ agency_contact_name: v })}
            />
            <Field
              label="Agency contact email"
              type="email"
              value={value.agency_contact_email}
              onChange={(v: string) => onChange({ agency_contact_email: v })}
            />
          </div>
          <Field
            label="Agency contact phone"
            value={value.agency_contact_phone}
            onChange={(v: string) => onChange({ agency_contact_phone: v })}
            placeholder="+234…"
          />
        </div>
      )}
    </>
  );
}
