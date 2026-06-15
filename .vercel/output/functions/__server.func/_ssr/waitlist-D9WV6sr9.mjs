import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { e as SiteHeader, d as SiteFooter } from "./router-4-w4Upb_.mjs";
import { B as Button } from "./button-DA2gxxPy.mjs";
import { I as Input, T as Textarea, L as Label } from "./textarea-Dzow4DnH.mjs";
import { C as Checkbox$1, a as CheckboxIndicator } from "../_libs/radix-ui__react-checkbox.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { s as supabase } from "./client-BhermGBt.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import "../_libs/seroval.mjs";
import { a4 as Sparkles, R as MessageSquare, P as Megaphone, E as Earth, H as Handshake, m as CircleCheck, K as LoaderCircle, j as Check } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./server-Dl4ga8RB.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DnNqQzIF.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "./client.server-U_pH-Evd.mjs";
import "../_libs/lovable.dev__email-js.mjs";
import "../_libs/react-email__render.mjs";
import "../_libs/prettier.mjs";
import "../_libs/html-to-text.mjs";
import "../_libs/selderee__plugin-htmlparser2.mjs";
import "../_libs/selderee.mjs";
import "../_libs/parseley.mjs";
import "../_libs/leac.mjs";
import "../_libs/peberminta.mjs";
import "../_libs/domhandler.mjs";
import "../_libs/domelementtype.mjs";
import "../_libs/htmlparser2.mjs";
import "../_libs/entities.mjs";
import "../_libs/deepmerge.mjs";
import "../_libs/dom-serializer.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/react-email__hr.mjs";
import "../_libs/react-email__link.mjs";
import "../_libs/react-email__button.mjs";
import "../_libs/zod.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/class-variance-authority.mjs";
import "../_libs/clsx.mjs";
import "../_libs/radix-ui__react-label.mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/tailwind-merge.mjs";
const Checkbox = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Checkbox$1,
  {
    ref,
    className: cn(
      "grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary shadow cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    ),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(CheckboxIndicator, { className: cn("grid place-content-center text-current"), children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) })
  }
));
Checkbox.displayName = Checkbox$1.displayName;
function Section({ title, letter, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { className: "space-y-5 rounded-xl border border-border/60 bg-card/40 p-5 md:p-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("legend", { className: "px-2 text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep", children: [
      "Section ",
      letter,
      " · ",
      title
    ] }),
    children
  ] });
}
function Row({ children, cols = 2 }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `grid gap-4 ${cols === 1 ? "" : cols === 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`, children });
}
function Field({
  id,
  label,
  required,
  children,
  hint
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Label, { htmlFor: id, children: [
      label,
      " ",
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: "*" })
    ] }),
    children,
    hint && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: hint })
  ] });
}
function SelectField({
  id,
  name,
  required,
  options,
  defaultValue
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "select",
    {
      id,
      name,
      required,
      defaultValue: defaultValue ?? "",
      className: "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", disabled: true, children: "Select…" }),
        options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o, children: o }, o))
      ]
    }
  );
}
function MultiCheck({
  name,
  options,
  columns = 2
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `grid gap-2 ${columns === 3 ? "md:grid-cols-3" : columns === 2 ? "md:grid-cols-2" : ""}`, children: options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", name, value: o, className: "h-4 w-4 rounded border-input" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: o })
  ] }, o)) });
}
function YesNo({
  name,
  options = ["Yes", "No"],
  required
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "radio", name, value: o, required, className: "h-4 w-4" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: o })
  ] }, o)) });
}
const COMMON_KEYS = /* @__PURE__ */ new Set([
  "full_name",
  "email",
  "phone",
  "company",
  "role_title",
  "country",
  "notes",
  "referral_source",
  "referred_by",
  "consent"
]);
async function submitForm(audience, el) {
  const fd = new FormData(el);
  const all = {};
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
  const form_data = {};
  for (const [k, v] of Object.entries(all)) {
    if (!COMMON_KEYS.has(k)) form_data[k] = v;
  }
  const { error } = await supabase.from("waitlist_signups").insert({
    audience,
    full_name,
    email,
    phone: all["phone"] || null,
    company: all["company"] || null,
    role_title: all["role_title"] || null,
    country: all["country"] || null,
    notes: all["notes"] || null,
    referral_source: all["referral_source"] || null,
    referred_by: all["referred_by"] || null,
    consent_given: true,
    form_data
  });
  if (error) {
    toast.error(error.message);
    return false;
  }
  try {
    await fetch("/api/public/waitlist-notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        audience,
        name: full_name,
        email,
        company: all["company"] || null,
        role: all["role_title"] || null,
        country: all["country"] || null,
        phone: all["phone"] || null,
        notes: all["notes"] || null
      })
    });
  } catch {
  }
  return true;
}
function FormShell({
  audience,
  onDone,
  children
}) {
  const [submitting, setSubmitting] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      onSubmit: async (e) => {
        e.preventDefault();
        setSubmitting(true);
        const ok = await submitForm(audience, e.currentTarget);
        setSubmitting(false);
        if (ok) {
          toast.success("You're on the waitlist!");
          onDone();
        }
      },
      className: "space-y-6",
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 pt-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-2 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", name: "consent", required: true, className: "mt-1 h-4 w-4" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
              "I agree to the I.G.Events ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/terms", className: "underline", children: "Terms" }),
              " and ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/privacy", className: "underline", children: "Privacy Policy" }),
              "."
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Button, { type: "submit", disabled: submitting, size: "lg", className: "w-full md:w-auto", children: [
            submitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : null,
            submitting ? "Submitting…" : "Join the waitlist"
          ] })
        ] })
      ]
    }
  );
}
function DonePanel({ onAddAnother }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-soft", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "h-10 w-10 text-primary" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-display text-xl font-bold", children: "You're on the list." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "max-w-sm text-sm text-muted-foreground", children: "We'll be in touch before 1 July with your founding-member access and next steps." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { type: "button", variant: "outline", onClick: onAddAnother, children: "Add another" })
  ] });
}
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
function BrandWaitlistForm({ onDone }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FormShell, { audience: "sponsor", onDone, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "A", title: "Brand details", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "company", label: "Brand / company name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "company", name: "company", required: true, maxLength: 150 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "full_name", label: "Your full name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "full_name", name: "full_name", required: true, maxLength: 100 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "role_title", label: "Your job title", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "role_title", name: "role_title", required: true, maxLength: 150 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "email", label: "Email address", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", name: "email", type: "email", required: true, maxLength: 255 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "phone", label: "Phone number", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "phone", name: "phone", type: "tel", required: true, maxLength: 40 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "industry", label: "Industry / sector", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "industry", name: "industry", required: true, options: INDUSTRIES }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "company_size", label: "Company size", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "company_size", name: "company_size", options: COMPANY_SIZES }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "country", label: "Primary HQ country", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "country", name: "country", required: true, options: COUNTRIES }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "countries_operation", label: "Countries of operation", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "countries_operation", options: COUNTRIES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "website", label: "Company website", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "website", name: "website", type: "url", placeholder: "https://" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "linkedin_url", label: "LinkedIn company page", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "linkedin_url", name: "linkedin_url", type: "url", placeholder: "https://linkedin.com/company/…" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "B", title: "Sponsorship interests", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "sponsored_before", label: "Has your brand sponsored events before?", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "sponsored_before", options: ["Yes", "No", "We've explored it"], required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "recent_event", label: "If yes — most recent event sponsored", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "recent_event", name: "recent_event", maxLength: 200 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "sponsor_reasons", label: "Primary reasons for considering event sponsorship", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "sponsor_reasons", options: SPONSOR_REASONS, columns: 2 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_types_interest", label: "Event types you're interested in sponsoring", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "event_types_interest", options: EVENT_TYPES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_size_pref", label: "Preferred event size", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "event_size_pref", options: EVENT_SIZES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "target_markets", label: "Target markets for activation", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "target_markets", options: TARGET_MARKETS, columns: 2 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "audience_profile", label: "Target audience profile", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "audience_profile", options: AUDIENCES, columns: 2 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "activation_formats", label: "Preferred sponsorship activation formats", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "activation_formats", options: ACTIVATION_FORMATS, columns: 2 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "booth_interest", label: "Interested in booking exhibition spaces?", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "booth_interest", options: ["Yes — tell me more", "No", "Maybe depending on event"], required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "booth_size_pref", label: "If yes — preferred booth size", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "booth_size_pref", options: BOOTH_SIZES, columns: 3 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "C", title: "Investment & timeline", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "investment_range", label: "Typical investment range per event", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "investment_range", name: "investment_range", required: true, options: INVESTMENT_RANGES }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "events_2026", label: "How many events to sponsor in 2026?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "events_2026", name: "events_2026", options: SPONSOR_COUNT }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "budget_status", label: "Dedicated sponsorship budget for 2026?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "budget_status", name: "budget_status", options: ["Yes", "No", "In planning"] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "commitment_timeline", label: "Preferred timeline for first commitment", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "commitment_timeline", name: "commitment_timeline", required: true, options: TIMELINE }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "D", title: "Media & documentary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "documentary_interest", label: "Interested in being featured in an I.G.Events documentary?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "documentary_interest", options: ["Yes — as sponsoring brand", "Yes — as brand story subject", "No", "Tell me more"] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "content_types", label: "Does your brand produce event content?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "content_types", options: CONTENT_TYPES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "coproduce_content", label: "Open to co-producing content with I.G.Events?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "coproduce_content", options: ["Yes", "No", "Depends"] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "E", title: "Referral & consent", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "referral_source", label: "How did you hear about I.G.Events?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "referral_source", name: "referral_source", options: REFERRAL_SOURCES }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "referred_by", label: "Who referred you?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "referred_by", name: "referred_by", maxLength: 150 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_in_mind", label: "Specific event or organiser already in mind?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "event_in_mind", name: "event_in_mind", rows: 3, maxLength: 1e3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "notes", label: "Anything else you'd like us to know?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "notes", name: "notes", rows: 3, maxLength: 1e3 }) })
    ] })
  ] });
}
const VENUE_STATUS = ["Yes", "No", "In negotiation"];
const RECURRING = ["Annual", "Biannual", "Quarterly", "No"];
const AGE_RANGES = ["18–24", "25–34", "35–44", "45–54", "55+"];
const GENDER_SPLIT = ["Majority Female", "Majority Male", "Balanced", "Mixed"];
const INCOME = ["Mass Market", "Middle Income", "Upper Middle", "High Net Worth", "Mixed"];
const OCCUPATIONS = ["Finance", "Tech", "Creative", "Fashion", "Health", "Government", "Entrepreneurs", "Students", "Diaspora", "Other"];
const GEOGRAPHIC = ["Local only", "National", "Pan-African", "Diaspora Europe", "Diaspora Americas", "International"];
const PROSPECTUS = ["Yes", "No", "In development"];
function OrganiserWaitlistForm({ onDone }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FormShell, { audience: "organiser", onDone, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "A", title: "Organiser details", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "full_name", label: "Full name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "full_name", name: "full_name", required: true, maxLength: 100 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "role_title", label: "Job title / role", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "role_title", name: "role_title", required: true, maxLength: 150 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "company", label: "Organisation name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "company", name: "company", required: true, maxLength: 150 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "email", label: "Email address", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", name: "email", type: "email", required: true, maxLength: 255 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "phone", label: "Phone number (WhatsApp preferred)", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "phone", name: "phone", type: "tel", required: true, maxLength: 40 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "country", label: "Country of operation", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "country", name: "country", required: true, options: COUNTRIES }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "linkedin_url", label: "LinkedIn profile URL", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "linkedin_url", name: "linkedin_url", type: "url", placeholder: "https://linkedin.com/in/…" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "instagram", label: "Instagram handle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "instagram", name: "instagram", placeholder: "@handle", maxLength: 80 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "B", title: "Event details", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_name", label: "Event name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_name", name: "event_name", required: true, maxLength: 200 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_tagline", label: "Event tagline (max 150 chars)", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_tagline", name: "event_tagline", required: true, maxLength: 150 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_type", label: "Event type", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "event_type", options: EVENT_TYPES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_start_date", label: "Event start date", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_start_date", name: "event_start_date", type: "date", required: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_end_date", label: "Event end date", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_end_date", name: "event_end_date", type: "date", required: true }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_city", label: "Event city", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_city", name: "event_city", required: true, maxLength: 120 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_country", label: "Event country", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "event_country", name: "event_country", required: true, options: COUNTRIES }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_venue", label: "Event venue name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_venue", name: "event_venue", required: true, maxLength: 200 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "venue_confirmed", label: "Is venue confirmed?", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "venue_confirmed", name: "venue_confirmed", required: true, options: VENUE_STATUS }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "recurring", label: "Is this event recurring?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "recurring", name: "recurring", options: RECURRING }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "first_held_year", label: "Year first held", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "first_held_year", name: "first_held_year", type: "number", min: 1900, max: 2030 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_description", label: "Event description (max 500 words)", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "event_description", name: "event_description", rows: 5, maxLength: 5e3, required: true }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "C", title: "Audience data", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "expected_attendance", label: "Expected attendance (this edition)", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "expected_attendance", name: "expected_attendance", type: "number", min: 0, required: true }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "past_attendance", label: "Past attendance (most recent edition)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "past_attendance", name: "past_attendance", type: "number", min: 0 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "age_range", label: "Primary audience age range", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "age_range", options: AGE_RANGES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "gender_split", label: "Primary audience gender split", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "gender_split", name: "gender_split", required: true, options: GENDER_SPLIT }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "income_level", label: "Primary audience income level", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "income_level", name: "income_level", required: true, options: INCOME }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "audience_occupation", label: "Primary audience industry / occupation", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "audience_occupation", options: OCCUPATIONS, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "audience_geo", label: "Audience geographic spread", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "audience_geo", options: GEOGRAPHIC, columns: 2 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "audience_survey_data", label: "Audience survey data from past edition?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "audience_survey_data", options: ["Yes — happy to share", "No"] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "D", title: "Sponsorship packages", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "prospectus_status", label: "Do you have a current sponsorship prospectus?", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "prospectus_status", name: "prospectus_status", required: true, options: PROSPECTUS }) }),
      [
        { key: "title", name: "Title sponsor" },
        { key: "gold", name: "Gold sponsor" },
        { key: "silver", name: "Silver sponsor" },
        { key: "bronze", name: "Bronze / community sponsor" }
      ].map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-lg border border-border/50 p-4 space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: t.name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: `${t.key}_name`, label: "Package name", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: `${t.key}_name`, name: `${t.key}_package_name` }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: `${t.key}_amount`, label: "Investment amount", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: `${t.key}_amount`, name: `${t.key}_investment_amount`, type: "number", min: 0 }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: `${t.key}_slots`, label: "Slots available", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: `${t.key}_slots`, name: `${t.key}_slots`, type: "number", min: 0 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: `${t.key}_currency`, label: "Currency", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: `${t.key}_currency`, name: `${t.key}_currency`, options: ["NGN", "USD", "EUR", "GBP"] }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: `${t.key}_deliverables`, label: "Deliverables", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: `${t.key}_deliverables`, name: `${t.key}_deliverables`, rows: 3 }) })
      ] }, t.key)),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "booth_available", label: "Exhibition booths available?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "booth_available" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "booth_count", label: "Number of booths", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "booth_count", name: "booth_count", type: "number", min: 0 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "booth_price", label: "Price per booth", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "booth_price", name: "booth_price", type: "number", min: 0 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "booth_sizes", label: "Booth sizes", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "booth_sizes", options: ["3×3m", "3×6m", "6×6m", "Custom"], columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "in_kind", label: "In-kind sponsorship accepted?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "in_kind", name: "in_kind", options: ["Yes", "No", "Negotiable"] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", {})
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "sponsor_categories", label: "Sponsor categories actively sought", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "sponsor_categories", options: INDUSTRIES, columns: 3 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "E", title: "Media & documentary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "documentary_interest", label: "Open to I.G.Events filming a documentary?", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "documentary_interest", options: ["Yes", "No", "Tell me more"], required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "has_footage", label: "Have existing event footage to share?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "has_footage" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_photos_url", label: "Link to event photos (Drive / Dropbox)", hint: "Uploads coming soon — paste a shareable link for now.", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_photos_url", name: "event_photos_url", type: "url", placeholder: "https://" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "prospectus_url", label: "Link to sponsorship deck / prospectus", hint: "PDF link (Drive / Dropbox / Notion).", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "prospectus_url", name: "prospectus_url", type: "url", placeholder: "https://" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_website", label: "Event website URL", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_website", name: "event_website", type: "url" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "event_instagram", label: "Event Instagram handle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "event_instagram", name: "event_instagram", placeholder: "@event" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "F", title: "Referral & consent", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "referral_source", label: "How did you hear about I.G.Events?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "referral_source", name: "referral_source", options: REFERRAL_SOURCES }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "referred_by", label: "Who referred you?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "referred_by", name: "referred_by", maxLength: 150 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "notes", label: "Anything else you'd like us to know?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "notes", name: "notes", rows: 4, maxLength: 1e3 }) })
    ] })
  ] });
}
const NETWORK_TYPES = ["Corporate / In-house", "Agency", "Personal brand", "Community leader", "Consultant", "Other"];
const NETWORK_SIZES = ["<100", "100–500", "500–2,000", "2,000–10,000", "10,000+"];
const SECTORS = INDUSTRIES;
const SENIORITY = ["C-suite", "Marketing leads", "Mid-management", "Mixed"];
const PAYOUT_CURRENCY = ["NGN", "USD", "EUR", "GBP"];
const COMMISSION_PREF = ["Standard", "Premium", "Custom"];
const DEAL_RANGES = ["Under ₦5M", "₦5M–20M", "₦20M–50M", "₦50M+", "Mixed"];
const INTROS_PER_QUARTER = ["1–3", "4–10", "11–20", "20+"];
function AffiliateWaitlistForm({ onDone }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(FormShell, { audience: "referral_partner", onDone, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "A", title: "Partner details", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "full_name", label: "Full name", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "full_name", name: "full_name", required: true, maxLength: 100 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "role_title", label: "Job title", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "role_title", name: "role_title", required: true, maxLength: 150 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "company", label: "Company / organisation", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "company", name: "company", maxLength: 150 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "email", label: "Email address", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "email", name: "email", type: "email", required: true, maxLength: 255 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "phone", label: "Phone number", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "phone", name: "phone", type: "tel", required: true, maxLength: 40 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "country", label: "Country", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "country", name: "country", required: true, options: COUNTRIES }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "linkedin_url", label: "LinkedIn profile URL", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "linkedin_url", name: "linkedin_url", type: "url", placeholder: "https://linkedin.com/in/…" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "instagram", label: "Instagram handle", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "instagram", name: "instagram", placeholder: "@handle", maxLength: 80 }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "B", title: "Network & reach", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "network_type", label: "Type of network", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "network_type", name: "network_type", required: true, options: NETWORK_TYPES }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "network_size", label: "Network size estimate", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "network_size", name: "network_size", required: true, options: NETWORK_SIZES }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "brand_seniority", label: "Brand seniority you have access to", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "brand_seniority", name: "brand_seniority", required: true, options: SENIORITY }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "sectors_expertise", label: "Sectors of expertise", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "sectors_expertise", options: SECTORS, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "geographies_covered", label: "Geographies covered", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "geographies_covered", options: COUNTRIES, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "languages", label: "Languages spoken", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "languages", name: "languages", placeholder: "English, French, Yoruba…", maxLength: 200 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "C", title: "Sponsorship experience", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "prior_deals", label: "Have you facilitated a sponsorship deal before?", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "prior_deals", options: ["Yes", "No", "Informally"], required: true }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "largest_deal_value", label: "Largest deal value", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "largest_deal_value", name: "largest_deal_value", placeholder: "e.g. ₦25M / $30k", maxLength: 80 }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "deals_last_12m", label: "Deals closed in last 12 months", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "deals_last_12m", name: "deals_last_12m", type: "number", min: 0 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "past_deal_sectors", label: "Typical sectors of past deals", children: /* @__PURE__ */ jsxRuntimeExports.jsx(MultiCheck, { name: "past_deal_sectors", options: SECTORS, columns: 3 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "reference_contact", label: "Reference contact (optional)", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "reference_contact", name: "reference_contact", placeholder: "Name + email / phone", maxLength: 250 }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "D", title: "Goals with I.G.E", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "intros_per_quarter", label: "Introductions per quarter", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "intros_per_quarter", name: "intros_per_quarter", required: true, options: INTROS_PER_QUARTER }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "target_deal_range", label: "Target deal-size range", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "target_deal_range", name: "target_deal_range", required: true, options: DEAL_RANGES }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "payout_currency", label: "Preferred payout currency", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "payout_currency", name: "payout_currency", required: true, options: PAYOUT_CURRENCY }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "commission_pref", label: "Commission structure preference", required: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "commission_pref", name: "commission_pref", required: true, options: COMMISSION_PREF }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "exclusivity", label: "Open to exclusivity in a sector?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(YesNo, { name: "exclusivity", options: ["Yes", "No", "Depends"] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { letter: "E", title: "Referral & consent", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Row, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "referral_source", label: "How did you hear about I.G.Events?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { id: "referral_source", name: "referral_source", options: REFERRAL_SOURCES }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "referred_by", label: "Who referred you?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Input, { id: "referred_by", name: "referred_by", maxLength: 150 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { id: "notes", label: "Anything else you'd like us to know?", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Textarea, { id: "notes", name: "notes", rows: 3, maxLength: 1e3 }) })
    ] })
  ] });
}
const audiences = [{
  id: "organiser",
  label: "Event organiser",
  icon: Megaphone,
  tag: "Organisers"
}, {
  id: "sponsor",
  label: "Brand / sponsor",
  icon: Earth,
  tag: "Sponsors"
}, {
  id: "referral_partner",
  label: "Referral partner",
  icon: Handshake,
  tag: "Referral partners"
}];
const benefits = {
  organiser: [{
    title: "Early platform access",
    desc: "First onto the platform on 1 June — before public launch."
  }, {
    title: "Featured listing",
    desc: "Your event spotlighted in the launch-week newsletter and social push."
  }, {
    title: "Sponsor match priority",
    desc: "Top of brand recommendations in the IGE Intelligence Engine."
  }, {
    title: "I.G.Events vetted, free year one",
    desc: "Vetted badge applied at no cost for all founding organiser waitlist members."
  }, {
    title: "Beta pricing",
    desc: "Platform fees locked at founding-member rates for 12 months."
  }, {
    title: "Founding community",
    desc: "Direct access to Alero and the IGE partnerships team via WhatsApp group."
  }],
  sponsor: [{
    title: "First look at events",
    desc: "Preview every listed event before the platform opens to the public in July."
  }, {
    title: "Custom event matching",
    desc: "Our team hand-matches brands to events before AI matching goes live."
  }, {
    title: "Exhibition booth priority",
    desc: "First choice of exhibition spaces at launch-week events before public listing."
  }, {
    title: "Sponsorship rate lock",
    desc: "Founding-brand rates locked for your first 3 sponsorship commitments."
  }, {
    title: "Brand profile setup",
    desc: "White-glove onboarding session with the IGE team."
  }],
  referral_partner: [{
    title: "Premium commission tier",
    desc: "Founding partners start on the IGB premium commission rate from day one."
  }, {
    title: "First pick of events",
    desc: "Generate referral links for launch-week events before anyone else."
  }, {
    title: "Direct deal desk",
    desc: "Dedicated IGE partnerships contact to help you close your first deal."
  }, {
    title: "Founding partner badge",
    desc: "Permanent IGB Founding Partner badge on your profile."
  }, {
    title: "Rate lock",
    desc: "Commission rates locked at launch terms for 12 months."
  }]
};
const LAUNCH_TS = (/* @__PURE__ */ new Date("2026-07-01T00:00:00Z")).getTime();
function useCountdown(target) {
  const [now, setNow] = reactExports.useState(() => Date.now());
  reactExports.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 864e5);
  const hours = Math.floor(diff % 864e5 / 36e5);
  const minutes = Math.floor(diff % 36e5 / 6e4);
  const seconds = Math.floor(diff % 6e4 / 1e3);
  return {
    days,
    hours,
    minutes,
    seconds,
    done: diff === 0
  };
}
function CountdownCell({
  value,
  label
}) {
  const v = value.toString().padStart(2, "0");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border/60 bg-card/70 px-4 py-5 text-center backdrop-blur md:px-7 md:py-7", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-4xl font-bold tabular-nums text-brand-gradient md:text-6xl", children: v }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground md:text-xs", children: label })
  ] });
}
function WaitlistPage() {
  const [audience, setAudience] = reactExports.useState("organiser");
  const [done, setDone] = reactExports.useState(false);
  const {
    days,
    hours,
    minutes,
    seconds
  } = useCountdown(LAUNCH_TS);
  function selectAudience(a) {
    setAudience(a);
    setDone(false);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "relative overflow-hidden border-b border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { "aria-hidden": true, className: "pointer-events-none absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full opacity-30 blur-3xl", style: {
          background: "var(--gradient-brand-diag)"
        } }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mx-auto max-w-5xl px-6 py-20 text-center md:py-24", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-3.5 w-3.5 text-primary" }),
            " Founding members only"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl", children: [
            "Join the ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-brand-gradient", children: "IGE waitlist." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mx-auto mt-5 max-w-2xl text-lg text-muted-foreground", children: "Inside Global Events 2026 opens to the public on 1 July. Founding organisers, brands, and referral partners get early access, locked-in rates, and priority matching." }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-10 grid grid-cols-4 gap-3 md:gap-4", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCell, { value: days, label: "Days" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCell, { value: hours, label: "Hours" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCell, { value: minutes, label: "Minutes" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(CountdownCell, { value: seconds, label: "Seconds" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-xs uppercase tracking-[0.18em] text-muted-foreground", children: "Public launch · 1 July" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/contact", className: "inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-4 py-2 text-sm font-medium text-foreground backdrop-blur transition-colors hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "h-4 w-4" }),
            "Talk to the team"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-6xl px-6 pt-16", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap items-center justify-center gap-2", children: audiences.map((a) => {
        const Active = audience === a.id;
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => selectAudience(a.id), className: `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${Active ? "border-transparent bg-brand-gradient text-white shadow-soft" : "border-border bg-card text-foreground hover:bg-muted"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(a.icon, { className: "h-4 w-4" }),
          a.label
        ] }, a.id);
      }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mx-auto max-w-3xl px-6 py-10", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-semibold uppercase tracking-[0.18em] text-secondary-deep", children: [
            audiences.find((a) => a.id === audience)?.tag,
            " · founding benefits"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl", children: "What founding members get." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-8 grid gap-4 md:grid-cols-2", children: benefits[audience].map((b) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3 rounded-xl border border-border/60 bg-card/40 p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-5 w-5 flex-shrink-0 text-secondary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: b.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: b.desc })
          ] })
        ] }, b.title)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("section", { className: "mx-auto max-w-4xl px-6 pb-20", children: done ? /* @__PURE__ */ jsxRuntimeExports.jsx(DonePanel, { onAddAnother: () => setDone(false) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        audience === "sponsor" && /* @__PURE__ */ jsxRuntimeExports.jsx(BrandWaitlistForm, { onDone: () => setDone(true) }),
        audience === "organiser" && /* @__PURE__ */ jsxRuntimeExports.jsx(OrganiserWaitlistForm, { onDone: () => setDone(true) }),
        audience === "referral_partner" && /* @__PURE__ */ jsxRuntimeExports.jsx(AffiliateWaitlistForm, { onDone: () => setDone(true) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
export {
  WaitlistPage as component
};
