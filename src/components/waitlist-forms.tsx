import { useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import type { WaitlistAudience } from "@/lib/waitlist-audiences";
import { toast } from "sonner";

/* -------------------- shared primitives -------------------- */

export function Section({ title, letter, children }: { title: string; letter: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 rounded-xl border border-border/60 bg-card/40 p-5 md:p-6">
      <legend className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep">
        Section {letter} · {title}
      </legend>
      {children}
    </fieldset>
  );
}

export function Row({ children, cols = 2 }: { children: React.ReactNode; cols?: 1 | 2 | 3 }) {
  return <div className={`grid gap-4 ${cols === 1 ? "" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>{children}</div>;
}

export function Field({
  id, label, required, children, hint,
}: { id: string; label: string; required?: boolean; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SelectField({
  id, name, required, options, defaultValue,
}: { id: string; name: string; required?: boolean; options: string[]; defaultValue?: string }) {
  return (
    <select
      id={id}
      name={name}
      required={required}
      defaultValue={defaultValue ?? ""}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="" disabled>Select…</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export function MultiCheck({
  name, options, columns = 2,
}: { name: string; options: string[]; columns?: 1 | 2 | 3 }) {
  return (
    <div className={`grid gap-2 ${columns === 3 ? "md:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : ""}`}>
      {options.map((o) => (
        <label key={o} className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
          <input type="checkbox" name={name} value={o} className="h-4 w-4 rounded border-input" />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

export function YesNo({
  name, options = ["Yes", "No"], required,
}: { name: string; options?: string[]; required?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <label key={o} className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm">
          <input type="radio" name={name} value={o} required={required} className="h-4 w-4" />
          <span>{o}</span>
        </label>
      ))}
    </div>
  );
}

/* -------------------- shared submit helper -------------------- */

const COMMON_KEYS = new Set([
  "full_name", "email", "phone", "company", "role_title", "country",
  "notes", "referral_source", "referred_by", "consent", "launch_updates",
]);

async function submitForm(audience: WaitlistAudience, el: HTMLFormElement) {
  const fd = new FormData(el);
  const all: Record<string, string | string[]> = {};
  for (const key of new Set(Array.from(fd.keys()))) {
    const values = fd.getAll(key).map((v) => String(v));
    all[key] = values.length > 1 ? values : values[0];
  }
  const consent = all["consent"] === "on" || all["consent"] === "true";
  if (!consent) {
    toast.error("Please accept the Terms and Privacy Policy.");
    return false;
  }
  const full_name = String(all["full_name"] ?? "").trim();
  const email = String(all["email"] ?? "").trim();
  if (!full_name || !email) {
    toast.error("Name and email are required.");
    return false;
  }
  const form_data: Record<string, string | string[]> = {};
  for (const [k, v] of Object.entries(all)) {
    if (!COMMON_KEYS.has(k)) form_data[k] = v;
  }
  const { error } = await supabase.from("waitlist_signups").insert({
    audience,
    full_name,
    email,
    phone: (all["phone"] as string) || null,
    company: (all["company"] as string) || null,
    role_title: (all["role_title"] as string) || null,
    country: (all["country"] as string) || null,
    notes: (all["notes"] as string) || null,
    referral_source: (all["referral_source"] as string) || null,
    referred_by: (all["referred_by"] as string) || null,
    consent_given: true,
    form_data,
  });
  if (error) {
    const msg = error.message.includes("idx_waitlist_signups_email_audience")
      ? "You're already on the waitlist for this role with that email."
      : error.message;
    toast.error(msg);
    return false;
  }
  // Notify ops — fire-and-forget; don't block success on email failure.
  try {
    await fetch("/api/public/waitlist-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        name: full_name,
        email,
        company: (all["company"] as string) || null,
        role: (all["role_title"] as string) || null,
        country: (all["country"] as string) || null,
        phone: (all["phone"] as string) || null,
        notes: (all["notes"] as string) || null,
      }),
    });
  } catch {
    // ignore
  }
  return true;
}


function FormShell({
  audience, onDone, children,
}: { audience: WaitlistAudience; onDone: () => void; children: React.ReactNode }) {
  const [submitting, setSubmitting] = useState(false);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const ok = await submitForm(audience, e.currentTarget);
        setSubmitting(false);
        if (ok) {
          toast.success("You're on the waitlist!");
          onDone();
        }
      }}
      className="space-y-6"
    >
      {children}
      <div className="flex flex-col items-center gap-3 pt-2">
        <label className="flex max-w-lg items-start gap-2 text-sm">
          <input type="checkbox" name="consent" required className="mt-1 h-4 w-4" />
          <span>I agree to the I.G.Events <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.</span>
        </label>
        <label className="flex max-w-lg items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="launch_updates" defaultChecked className="mt-1 h-4 w-4" />
          <span>Email me about the IGE launch, founding-member access, and product updates.</span>
        </label>
        <Button type="submit" disabled={submitting} size="lg" className="w-full md:w-auto">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Submitting…" : "Join the waitlist"}
        </Button>
      </div>
    </form>
  );
}

export function DonePanel({
  onAddAnother,
  audienceLabel,
}: {
  onAddAnother: () => void;
  audienceLabel?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-soft">
      <CheckCircle2 className="h-10 w-10 text-primary" />
      <h3 className="font-display text-xl font-bold">You&apos;re on the list.</h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {audienceLabel
          ? `Thanks for joining as a ${audienceLabel.toLowerCase()}. We'll email you before launch with founding-member access and next steps.`
          : "We'll be in touch before launch with your founding-member access and next steps."}
      </p>
      <Button type="button" variant="outline" onClick={onAddAnother}>Submit another</Button>
    </div>
  );
}

/* ============================================================
   BRAND / SPONSOR — 32 fields
============================================================ */

const INDUSTRIES = ["FMCG", "Fintech", "Telecom", "Fashion & Beauty", "Hospitality", "Automotive", "Health & Wellness", "Technology", "Media & Entertainment", "Government", "Education", "Logistics", "Real Estate", "Other"];
const COMPANY_SIZES = ["Startup <50", "SME 50–250", "Mid-Market 250–1000", "Enterprise 1000+"];
const COUNTRIES = ["Nigeria", "Ghana", "Kenya", "South Africa", "Côte d'Ivoire", "Senegal", "UK", "France", "USA", "Other"];
const SPONSOR_REASONS = ["Brand awareness", "Lead generation", "Product launch", "Community engagement", "Audience data", "Content creation", "Market entry", "CSR", "Employee engagement", "Other"];
const EVENT_TYPES = ["Cultural Festival", "Business Summit", "Music", "Fashion Week", "Diaspora Gathering", "Sports", "Tech", "Food", "Awards", "Gala", "Exhibition", "Trade Fair", "Other"];
const EVENT_SIZES = ["Under 500", "500–2,000", "2,000–10,000", "10,000+", "No preference"];
const TARGET_MARKETS = ["Nigeria", "Ghana", "Kenya", "South Africa", "Côte d'Ivoire", "Senegal", "Lagos Diaspora UK", "Lagos Diaspora France", "Pan-African", "Other"];
const AUDIENCES = ["Young professionals 25-35", "Entrepreneurs", "High net worth", "Students", "Women in business", "Tech community", "Creative industries", "Diaspora community", "General consumer", "Other"];
const ACTIVATION_FORMATS = ["Title/Naming rights", "Exhibition booth", "Hosted session", "Product sampling", "Brand ambassador", "Content creation rights", "Digital/Social integration", "VIP hospitality", "Award sponsorship", "Community partnership"];
const BOOTH_SIZES = ["3×3m", "3×6m", "6×6m", "Custom", "Depends on event"];
const INVESTMENT_RANGES = ["Under ₦1M", "₦1M–5M", "₦5M–20M", "₦20M–50M", "₦50M–100M", "Above ₦100M", "Prefer not to say", "Depends on opportunity"];
const SPONSOR_COUNT = ["1–2", "3–5", "6–10", "10+", "TBD"];
const TIMELINE = ["Immediately", "Within 3 months", "Within 6 months", "2027 planning", "Exploratory only"];
const CONTENT_TYPES = ["Video", "Photography", "Social media", "Podcast", "Written reports", "None"];
const REFERRAL_SOURCES = ["Instagram", "LinkedIn", "Referral", "WhatsApp", "Google", "Podcast", "Other"];

export function BrandWaitlistForm({ onDone }: { onDone: () => void }) {
  return (
    <FormShell audience="sponsor" onDone={onDone}>
      <Section letter="A" title="Brand details">
        <Row>
          <Field id="company" label="Brand / company name" required><Input id="company" name="company" required maxLength={150} /></Field>
          <Field id="full_name" label="Your full name" required><Input id="full_name" name="full_name" required maxLength={100} /></Field>
        </Row>
        <Row>
          <Field id="role_title" label="Your job title" required><Input id="role_title" name="role_title" required maxLength={150} /></Field>
          <Field id="email" label="Email address" required><Input id="email" name="email" type="email" required maxLength={255} /></Field>
        </Row>
        <Row>
          <Field id="phone" label="Phone number" required><Input id="phone" name="phone" type="tel" required maxLength={40} /></Field>
          <Field id="industry" label="Industry / sector" required><SelectField id="industry" name="industry" required options={INDUSTRIES} /></Field>
        </Row>
        <Row>
          <Field id="company_size" label="Company size"><SelectField id="company_size" name="company_size" options={COMPANY_SIZES} /></Field>
          <Field id="country" label="Primary HQ country" required><SelectField id="country" name="country" required options={COUNTRIES} /></Field>
        </Row>
        <Field id="countries_operation" label="Countries of operation" required>
          <MultiCheck name="countries_operation" options={COUNTRIES} columns={3} />
        </Field>
        <Row>
          <Field id="website" label="Company website"><Input id="website" name="website" type="url" placeholder="https://" /></Field>
          <Field id="linkedin_url" label="LinkedIn company page"><Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/company/…" /></Field>
        </Row>
      </Section>

      <Section letter="B" title="Sponsorship interests">
        <Field id="sponsored_before" label="Has your brand sponsored events before?" required>
          <YesNo name="sponsored_before" options={["Yes", "No", "We've explored it"]} required />
        </Field>
        <Field id="recent_event" label="If yes — most recent event sponsored">
          <Input id="recent_event" name="recent_event" maxLength={200} />
        </Field>
        <Field id="sponsor_reasons" label="Primary reasons for considering event sponsorship" required>
          <MultiCheck name="sponsor_reasons" options={SPONSOR_REASONS} columns={2} />
        </Field>
        <Field id="event_types_interest" label="Event types you're interested in sponsoring" required>
          <MultiCheck name="event_types_interest" options={EVENT_TYPES} columns={3} />
        </Field>
        <Field id="event_size_pref" label="Preferred event size" required>
          <MultiCheck name="event_size_pref" options={EVENT_SIZES} columns={3} />
        </Field>
        <Field id="target_markets" label="Target markets for activation" required>
          <MultiCheck name="target_markets" options={TARGET_MARKETS} columns={2} />
        </Field>
        <Field id="audience_profile" label="Target audience profile" required>
          <MultiCheck name="audience_profile" options={AUDIENCES} columns={2} />
        </Field>
        <Field id="activation_formats" label="Preferred sponsorship activation formats" required>
          <MultiCheck name="activation_formats" options={ACTIVATION_FORMATS} columns={2} />
        </Field>
        <Field id="booth_interest" label="Interested in booking exhibition spaces?" required>
          <YesNo name="booth_interest" options={["Yes — tell me more", "No", "Maybe depending on event"]} required />
        </Field>
        <Field id="booth_size_pref" label="If yes — preferred booth size">
          <MultiCheck name="booth_size_pref" options={BOOTH_SIZES} columns={3} />
        </Field>
      </Section>

      <Section letter="C" title="Investment & timeline">
        <Row>
          <Field id="investment_range" label="Typical investment range per event" required>
            <SelectField id="investment_range" name="investment_range" required options={INVESTMENT_RANGES} />
          </Field>
          <Field id="events_2026" label="How many events to sponsor in 2026?">
            <SelectField id="events_2026" name="events_2026" options={SPONSOR_COUNT} />
          </Field>
        </Row>
        <Row>
          <Field id="budget_status" label="Dedicated sponsorship budget for 2026?">
            <SelectField id="budget_status" name="budget_status" options={["Yes", "No", "In planning"]} />
          </Field>
          <Field id="commitment_timeline" label="Preferred timeline for first commitment" required>
            <SelectField id="commitment_timeline" name="commitment_timeline" required options={TIMELINE} />
          </Field>
        </Row>
      </Section>

      <Section letter="D" title="Media & documentary">
        <Field id="documentary_interest" label="Interested in being featured in an I.G.Events documentary?">
          <YesNo name="documentary_interest" options={["Yes — as sponsoring brand", "Yes — as brand story subject", "No", "Tell me more"]} />
        </Field>
        <Field id="content_types" label="Does your brand produce event content?">
          <MultiCheck name="content_types" options={CONTENT_TYPES} columns={3} />
        </Field>
        <Field id="coproduce_content" label="Open to co-producing content with I.G.Events?">
          <YesNo name="coproduce_content" options={["Yes", "No", "Depends"]} />
        </Field>
      </Section>

      <Section letter="E" title="Referral & consent">
        <Row>
          <Field id="referral_source" label="How did you hear about I.G.Events?">
            <SelectField id="referral_source" name="referral_source" options={REFERRAL_SOURCES} />
          </Field>
          <Field id="referred_by" label="Who referred you?">
            <Input id="referred_by" name="referred_by" maxLength={150} />
          </Field>
        </Row>
        <Field id="event_in_mind" label="Specific event or organiser already in mind?">
          <Textarea id="event_in_mind" name="event_in_mind" rows={3} maxLength={1000} />
        </Field>
        <Field id="notes" label="Anything else you'd like us to know?">
          <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
        </Field>
      </Section>
    </FormShell>
  );
}

/* ============================================================
   ORGANISER — 58 fields
============================================================ */

const VENUE_STATUS = ["Yes", "No", "In negotiation"];
const RECURRING = ["Annual", "Biannual", "Quarterly", "No"];
const AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55+"];
const GENDER_SPLIT = ["Majority Female", "Majority Male", "Balanced", "Mixed"];
const INCOME = ["Mass Market", "Middle Income", "Upper Middle", "High Net Worth", "Mixed"];
const OCCUPATIONS = ["Finance", "Tech", "Creative", "Fashion", "Health", "Government", "Entrepreneurs", "Students", "Diaspora", "Other"];
const GEOGRAPHIC = ["Local only", "National", "Pan-African", "Diaspora Europe", "Diaspora Americas", "International"];
const PROSPECTUS = ["Yes", "No", "In development"];

export function OrganiserWaitlistForm({ onDone }: { onDone: () => void }) {
  return (
    <FormShell audience="organiser" onDone={onDone}>
      <Section letter="A" title="Organiser details">
        <Row>
          <Field id="full_name" label="Full name" required><Input id="full_name" name="full_name" required maxLength={100} /></Field>
          <Field id="role_title" label="Job title / role" required><Input id="role_title" name="role_title" required maxLength={150} /></Field>
        </Row>
        <Row>
          <Field id="company" label="Organisation name" required><Input id="company" name="company" required maxLength={150} /></Field>
          <Field id="email" label="Email address" required><Input id="email" name="email" type="email" required maxLength={255} /></Field>
        </Row>
        <Row>
          <Field id="phone" label="Phone number (WhatsApp preferred)" required><Input id="phone" name="phone" type="tel" required maxLength={40} /></Field>
          <Field id="country" label="Country of operation" required><SelectField id="country" name="country" required options={COUNTRIES} /></Field>
        </Row>
        <Row>
          <Field id="linkedin_url" label="LinkedIn profile URL"><Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" /></Field>
          <Field id="instagram" label="Instagram handle"><Input id="instagram" name="instagram" placeholder="@handle" maxLength={80} /></Field>
        </Row>
      </Section>

      <Section letter="B" title="Event details">
        <Row>
          <Field id="event_name" label="Event name" required><Input id="event_name" name="event_name" required maxLength={200} /></Field>
          <Field id="event_tagline" label="Event tagline (max 150 chars)" required><Input id="event_tagline" name="event_tagline" required maxLength={150} /></Field>
        </Row>
        <Field id="event_type" label="Event type" required>
          <MultiCheck name="event_type" options={EVENT_TYPES} columns={3} />
        </Field>
        <Row>
          <Field id="event_start_date" label="Event start date" required><Input id="event_start_date" name="event_start_date" type="date" required /></Field>
          <Field id="event_end_date" label="Event end date" required><Input id="event_end_date" name="event_end_date" type="date" required /></Field>
        </Row>
        <Row>
          <Field id="event_city" label="Event city" required><Input id="event_city" name="event_city" required maxLength={120} /></Field>
          <Field id="event_country" label="Event country" required><SelectField id="event_country" name="event_country" required options={COUNTRIES} /></Field>
        </Row>
        <Row>
          <Field id="event_venue" label="Event venue name" required><Input id="event_venue" name="event_venue" required maxLength={200} /></Field>
          <Field id="venue_confirmed" label="Is venue confirmed?" required><SelectField id="venue_confirmed" name="venue_confirmed" required options={VENUE_STATUS} /></Field>
        </Row>
        <Row>
          <Field id="recurring" label="Is this event recurring?"><SelectField id="recurring" name="recurring" options={RECURRING} /></Field>
          <Field id="first_held_year" label="Year first held"><Input id="first_held_year" name="first_held_year" type="number" min={1900} max={2030} /></Field>
        </Row>
        <Field id="event_description" label="Event description (max 500 words)" required>
          <Textarea id="event_description" name="event_description" rows={5} maxLength={5000} required />
        </Field>
      </Section>

      <Section letter="C" title="Audience data">
        <Row>
          <Field id="expected_attendance" label="Expected attendance (this edition)" required><Input id="expected_attendance" name="expected_attendance" type="number" min={0} required /></Field>
          <Field id="past_attendance" label="Past attendance (most recent edition)"><Input id="past_attendance" name="past_attendance" type="number" min={0} /></Field>
        </Row>
        <Field id="age_range" label="Primary audience age range" required>
          <MultiCheck name="age_range" options={AGE_RANGES} columns={3} />
        </Field>
        <Row>
          <Field id="gender_split" label="Primary audience gender split" required><SelectField id="gender_split" name="gender_split" required options={GENDER_SPLIT} /></Field>
          <Field id="income_level" label="Primary audience income level" required><SelectField id="income_level" name="income_level" required options={INCOME} /></Field>
        </Row>
        <Field id="audience_occupation" label="Primary audience industry / occupation" required>
          <MultiCheck name="audience_occupation" options={OCCUPATIONS} columns={3} />
        </Field>
        <Field id="audience_geo" label="Audience geographic spread" required>
          <MultiCheck name="audience_geo" options={GEOGRAPHIC} columns={2} />
        </Field>
        <Field id="audience_survey_data" label="Audience survey data from past edition?">
          <YesNo name="audience_survey_data" options={["Yes — happy to share", "No"]} />
        </Field>
      </Section>

      <Section letter="D" title="Sponsorship packages">
        <Field id="prospectus_status" label="Do you have a current sponsorship prospectus?" required>
          <SelectField id="prospectus_status" name="prospectus_status" required options={PROSPECTUS} />
        </Field>

        {[
          { key: "title", name: "Title sponsor" },
          { key: "gold", name: "Gold sponsor" },
          { key: "silver", name: "Silver sponsor" },
          { key: "bronze", name: "Bronze / community sponsor" },
        ].map((t) => (
          <div key={t.key} className="rounded-lg border border-border/50 p-4 space-y-3">
            <div className="text-sm font-semibold">{t.name}</div>
            <Row>
              <Field id={`${t.key}_name`} label="Package name"><Input id={`${t.key}_name`} name={`${t.key}_package_name`} /></Field>
              <Field id={`${t.key}_amount`} label="Investment amount"><Input id={`${t.key}_amount`} name={`${t.key}_investment_amount`} type="number" min={0} /></Field>
            </Row>
            <Row>
              <Field id={`${t.key}_slots`} label="Slots available"><Input id={`${t.key}_slots`} name={`${t.key}_slots`} type="number" min={0} /></Field>
              <Field id={`${t.key}_currency`} label="Currency"><SelectField id={`${t.key}_currency`} name={`${t.key}_currency`} options={["NGN", "USD", "EUR", "GBP"]} /></Field>
            </Row>
            <Field id={`${t.key}_deliverables`} label="Deliverables"><Textarea id={`${t.key}_deliverables`} name={`${t.key}_deliverables`} rows={3} /></Field>
          </div>
        ))}

        <Field id="booth_available" label="Exhibition booths available?"><YesNo name="booth_available" /></Field>
        <Row>
          <Field id="booth_count" label="Number of booths"><Input id="booth_count" name="booth_count" type="number" min={0} /></Field>
          <Field id="booth_price" label="Price per booth"><Input id="booth_price" name="booth_price" type="number" min={0} /></Field>
        </Row>
        <Field id="booth_sizes" label="Booth sizes">
          <MultiCheck name="booth_sizes" options={["3×3m", "3×6m", "6×6m", "Custom"]} columns={3} />
        </Field>
        <Row>
          <Field id="in_kind" label="In-kind sponsorship accepted?"><SelectField id="in_kind" name="in_kind" options={["Yes", "No", "Negotiable"]} /></Field>
          <div />
        </Row>
        <Field id="sponsor_categories" label="Sponsor categories actively sought" required>
          <MultiCheck name="sponsor_categories" options={INDUSTRIES} columns={3} />
        </Field>
      </Section>

      <Section letter="E" title="Media & documentary">
        <Field id="documentary_interest" label="Open to I.G.Events filming a documentary?" required>
          <YesNo name="documentary_interest" options={["Yes", "No", "Tell me more"]} required />
        </Field>
        <Field id="has_footage" label="Have existing event footage to share?">
          <YesNo name="has_footage" />
        </Field>
        <Field id="event_photos_url" label="Link to event photos (Drive / Dropbox)" hint="Uploads coming soon — paste a shareable link for now.">
          <Input id="event_photos_url" name="event_photos_url" type="url" placeholder="https://" />
        </Field>
        <Field id="prospectus_url" label="Link to sponsorship deck / prospectus" hint="PDF link (Drive / Dropbox / Notion).">
          <Input id="prospectus_url" name="prospectus_url" type="url" placeholder="https://" />
        </Field>
        <Row>
          <Field id="event_website" label="Event website URL"><Input id="event_website" name="event_website" type="url" /></Field>
          <Field id="event_instagram" label="Event Instagram handle"><Input id="event_instagram" name="event_instagram" placeholder="@event" /></Field>
        </Row>
      </Section>

      <Section letter="F" title="Referral & consent">
        <Row>
          <Field id="referral_source" label="How did you hear about I.G.Events?">
            <SelectField id="referral_source" name="referral_source" options={REFERRAL_SOURCES} />
          </Field>
          <Field id="referred_by" label="Who referred you?">
            <Input id="referred_by" name="referred_by" maxLength={150} />
          </Field>
        </Row>
        <Field id="notes" label="Anything else you'd like us to know?">
          <Textarea id="notes" name="notes" rows={4} maxLength={1000} />
        </Field>
      </Section>
    </FormShell>
  );
}

/* ============================================================
   AFFILIATE / REFERRAL PARTNER — 28 fields
============================================================ */

const NETWORK_TYPES = ["Corporate / In-house", "Agency", "Personal brand", "Community leader", "Consultant", "Other"];
const NETWORK_SIZES = ["<100", "100–500", "500–2,000", "2,000–10,000", "10,000+"];
const SECTORS = INDUSTRIES;
const SENIORITY = ["C-suite", "Marketing leads", "Mid-management", "Mixed"];
const PAYOUT_CURRENCY = ["NGN", "USD", "EUR", "GBP"];
const COMMISSION_PREF = ["Standard", "Premium", "Custom"];
const DEAL_RANGES = ["Under ₦5M", "₦5M–20M", "₦20M–50M", "₦50M+", "Mixed"];
const INTROS_PER_QUARTER = ["1–3", "4–10", "11–20", "20+"];

export function AffiliateWaitlistForm({ onDone }: { onDone: () => void }) {
  return (
    <FormShell audience="referral_partner" onDone={onDone}>
      <Section letter="A" title="Partner details">
        <Row>
          <Field id="full_name" label="Full name" required><Input id="full_name" name="full_name" required maxLength={100} /></Field>
          <Field id="role_title" label="Job title" required><Input id="role_title" name="role_title" required maxLength={150} /></Field>
        </Row>
        <Row>
          <Field id="company" label="Company / organisation"><Input id="company" name="company" maxLength={150} /></Field>
          <Field id="email" label="Email address" required><Input id="email" name="email" type="email" required maxLength={255} /></Field>
        </Row>
        <Row>
          <Field id="phone" label="Phone number" required><Input id="phone" name="phone" type="tel" required maxLength={40} /></Field>
          <Field id="country" label="Country" required><SelectField id="country" name="country" required options={COUNTRIES} /></Field>
        </Row>
        <Row>
          <Field id="linkedin_url" label="LinkedIn profile URL"><Input id="linkedin_url" name="linkedin_url" type="url" placeholder="https://linkedin.com/in/…" /></Field>
          <Field id="instagram" label="Instagram handle"><Input id="instagram" name="instagram" placeholder="@handle" maxLength={80} /></Field>
        </Row>
      </Section>

      <Section letter="B" title="Network & reach">
        <Field id="network_type" label="Type of network" required>
          <SelectField id="network_type" name="network_type" required options={NETWORK_TYPES} />
        </Field>
        <Row>
          <Field id="network_size" label="Network size estimate" required>
            <SelectField id="network_size" name="network_size" required options={NETWORK_SIZES} />
          </Field>
          <Field id="brand_seniority" label="Brand seniority you have access to" required>
            <SelectField id="brand_seniority" name="brand_seniority" required options={SENIORITY} />
          </Field>
        </Row>
        <Field id="sectors_expertise" label="Sectors of expertise" required>
          <MultiCheck name="sectors_expertise" options={SECTORS} columns={3} />
        </Field>
        <Field id="geographies_covered" label="Geographies covered" required>
          <MultiCheck name="geographies_covered" options={COUNTRIES} columns={3} />
        </Field>
        <Field id="languages" label="Languages spoken">
          <Input id="languages" name="languages" placeholder="English, French, Yoruba…" maxLength={200} />
        </Field>
      </Section>

      <Section letter="C" title="Sponsorship experience">
        <Field id="prior_deals" label="Have you facilitated a sponsorship deal before?" required>
          <YesNo name="prior_deals" options={["Yes", "No", "Informally"]} required />
        </Field>
        <Row>
          <Field id="largest_deal_value" label="Largest deal value">
            <Input id="largest_deal_value" name="largest_deal_value" placeholder="e.g. ₦25M / $30k" maxLength={80} />
          </Field>
          <Field id="deals_last_12m" label="Deals closed in last 12 months">
            <Input id="deals_last_12m" name="deals_last_12m" type="number" min={0} />
          </Field>
        </Row>
        <Field id="past_deal_sectors" label="Typical sectors of past deals">
          <MultiCheck name="past_deal_sectors" options={SECTORS} columns={3} />
        </Field>
        <Field id="reference_contact" label="Reference contact (optional)">
          <Input id="reference_contact" name="reference_contact" placeholder="Name + email / phone" maxLength={250} />
        </Field>
      </Section>

      <Section letter="D" title="Goals with I.G.E">
        <Row>
          <Field id="intros_per_quarter" label="Introductions per quarter" required>
            <SelectField id="intros_per_quarter" name="intros_per_quarter" required options={INTROS_PER_QUARTER} />
          </Field>
          <Field id="target_deal_range" label="Target deal-size range" required>
            <SelectField id="target_deal_range" name="target_deal_range" required options={DEAL_RANGES} />
          </Field>
        </Row>
        <Row>
          <Field id="payout_currency" label="Preferred payout currency" required>
            <SelectField id="payout_currency" name="payout_currency" required options={PAYOUT_CURRENCY} />
          </Field>
          <Field id="commission_pref" label="Commission structure preference" required>
            <SelectField id="commission_pref" name="commission_pref" required options={COMMISSION_PREF} />
          </Field>
        </Row>
        <Field id="exclusivity" label="Open to exclusivity in a sector?">
          <YesNo name="exclusivity" options={["Yes", "No", "Depends"]} />
        </Field>
      </Section>

      <Section letter="E" title="Referral & consent">
        <Row>
          <Field id="referral_source" label="How did you hear about I.G.Events?">
            <SelectField id="referral_source" name="referral_source" options={REFERRAL_SOURCES} />
          </Field>
          <Field id="referred_by" label="Who referred you?">
            <Input id="referred_by" name="referred_by" maxLength={150} />
          </Field>
        </Row>
        <Field id="notes" label="Anything else you'd like us to know?">
          <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
        </Field>
      </Section>
    </FormShell>
  );
}

/* ============================================================
   MEDIA PARTNER
============================================================ */

const MEDIA_OUTLET_TYPES = ["Newsletter", "Podcast", "Magazine / publication", "Blog", "TV / Radio", "Social creator", "Agency", "Other"];
const MEDIA_REACH = ["Under 5k", "5k–25k", "25k–100k", "100k–500k", "500k+", "Varies by channel"];
const MEDIA_REQUEST_TYPES = ["Event coverage", "Speaker interviews", "Cross-promotion", "Documentary / film", "Social amplification", "Newsletter feature", "Podcast episode"];
const CONTENT_FOCUS = ["Business & finance", "Culture & lifestyle", "Tech", "Fashion & beauty", "Sports", "Government & policy", "Diaspora", "Entertainment", "Other"];

export function MediaWaitlistForm({ onDone }: { onDone: () => void }) {
  return (
    <FormShell audience="media_partner" onDone={onDone}>
      <Section letter="A" title="Outlet & contact">
        <Row>
          <Field id="full_name" label="Full name" required><Input id="full_name" name="full_name" required maxLength={100} /></Field>
          <Field id="role_title" label="Job title / role" required><Input id="role_title" name="role_title" required maxLength={150} /></Field>
        </Row>
        <Row>
          <Field id="company" label="Outlet / publication name" required><Input id="company" name="company" required maxLength={150} /></Field>
          <Field id="email" label="Email address" required><Input id="email" name="email" type="email" required maxLength={255} /></Field>
        </Row>
        <Row>
          <Field id="phone" label="Phone number"><Input id="phone" name="phone" type="tel" maxLength={40} /></Field>
          <Field id="country" label="Primary country" required><SelectField id="country" name="country" required options={COUNTRIES} /></Field>
        </Row>
        <Row>
          <Field id="outlet_type" label="Outlet type" required><SelectField id="outlet_type" name="outlet_type" required options={MEDIA_OUTLET_TYPES} /></Field>
          <Field id="audience_reach" label="Typical audience reach" required><SelectField id="audience_reach" name="audience_reach" required options={MEDIA_REACH} /></Field>
        </Row>
        <Row>
          <Field id="website" label="Website URL"><Input id="website" name="website" type="url" placeholder="https://" /></Field>
          <Field id="social_url" label="Primary social / channel URL"><Input id="social_url" name="social_url" type="url" placeholder="https://" /></Field>
        </Row>
      </Section>

      <Section letter="B" title="Coverage focus">
        <Field id="content_focus" label="Content focus / sectors" required>
          <MultiCheck name="content_focus" options={CONTENT_FOCUS} columns={3} />
        </Field>
        <Field id="geographies_covered" label="Geographies you cover" required>
          <MultiCheck name="geographies_covered" options={COUNTRIES} columns={3} />
        </Field>
        <Field id="event_types_interest" label="Event types you want to cover" required>
          <MultiCheck name="event_types_interest" options={EVENT_TYPES} columns={3} />
        </Field>
        <Field id="partnership_types" label="Partnership formats you offer" required>
          <MultiCheck name="partnership_types" options={MEDIA_REQUEST_TYPES} columns={2} />
        </Field>
        <Field id="prior_event_media" label="Have you partnered with events before?" required>
          <YesNo name="prior_event_media" options={["Yes", "No", "Occasionally"]} required />
        </Field>
        <Field id="recent_event_coverage" label="If yes — most recent event covered">
          <Input id="recent_event_coverage" name="recent_event_coverage" maxLength={200} />
        </Field>
      </Section>

      <Section letter="C" title="Goals with I.G.E">
        <Field id="events_per_quarter" label="Events you could cover per quarter">
          <SelectField id="events_per_quarter" name="events_per_quarter" options={["1–2", "3–5", "6–10", "10+"]} />
        </Field>
        <Field id="documentary_interest" label="Interested in I.G.Events documentary collaborations?">
          <YesNo name="documentary_interest" options={["Yes", "No", "Tell me more"]} />
        </Field>
        <Field id="notes" label="Anything else you'd like us to know?">
          <Textarea id="notes" name="notes" rows={3} maxLength={1000} />
        </Field>
      </Section>

      <Section letter="D" title="Referral">
        <Row>
          <Field id="referral_source" label="How did you hear about I.G.Events?">
            <SelectField id="referral_source" name="referral_source" options={REFERRAL_SOURCES} />
          </Field>
          <Field id="referred_by" label="Who referred you?">
            <Input id="referred_by" name="referred_by" maxLength={150} />
          </Field>
        </Row>
      </Section>
    </FormShell>
  );
}

/* keep Checkbox import alive (avoid tree-shake removal warning if unused) */
void Checkbox;
