import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useAuth, o as useServerFn, f as createSsrRpc } from "./router-BT27-cf7.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { A as AuthShell } from "./auth-shell-B3frSsmu.mjs";
import { d as createServerFn } from "./server-CqdVJ_Eq.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-DeHWLdHU.mjs";
import { C as COMPANY_SIZES, a as COUNTRIES, e as PRIMARY_SECTORS, G as GEOGRAPHIC_MIX, d as PRIMARY_AUDIENCES, b as CURRENCIES, S as SECTOR_EXPERTISE } from "./event-taxonomy-C1jnPFFJ.mjs";
import "../_libs/ws.mjs";
import "../_libs/seroval.mjs";
import { M as LoaderCircle } from "../_libs/lucide-react.mjs";
import { o as objectType, s as stringType, l as literalType, n as numberType, b as arrayType, e as enumType } from "../_libs/zod.mjs";
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
import "./client-gmdRS3ZG.mjs";
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
import "./client.server-BxqV6VTA.mjs";
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
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
const OrganiserInput = objectType({
  org_name: stringType().trim().min(1).max(160),
  bio: stringType().trim().max(1e3).optional().nullable(),
  website: stringType().trim().url().max(300).optional().nullable().or(literalType("").transform(() => null)),
  logo_url: stringType().trim().max(500).optional().nullable(),
  event_history: stringType().trim().max(1e3).optional().nullable()
});
const upsertOrganiserProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => OrganiserInput.parse(d)).handler(createSsrRpc("bc56a692c5935f1226453e89e08fe60526b5d6aaeb7ee1659871e2fe9b363547"));
const SponsorInput = objectType({
  brand_name: stringType().trim().min(1).max(160),
  industry: stringType().trim().max(120).optional().nullable(),
  company_size: stringType().trim().max(40).optional().nullable(),
  hq_country: stringType().trim().max(80).optional().nullable(),
  hq_city: stringType().trim().max(80).optional().nullable(),
  target_geographies: arrayType(stringType()).max(20).default([]),
  sponsorship_sectors: arrayType(stringType()).max(20).default([]),
  audience_types: arrayType(stringType()).max(20).default([]),
  budget_range_min: numberType().nonnegative().optional().nullable(),
  budget_range_max: numberType().nonnegative().optional().nullable(),
  preferred_currency: stringType().min(3).max(3).default("USD")
});
const upsertSponsorProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => SponsorInput.parse(d)).handler(createSsrRpc("018c1456792c2aa5b53d8e429e290e58b6c0668c321e32e846ffce7e77641d79"));
const ReferralInput = objectType({
  full_name: stringType().trim().min(1).max(160),
  professional_title: stringType().trim().max(160).optional().nullable(),
  sector_expertise: arrayType(stringType()).max(20).default([]),
  professional_bg: stringType().trim().max(1500).optional().nullable(),
  sponsor_network_desc: stringType().trim().max(1500).optional().nullable(),
  payout_currency: enumType(["NGN", "USD", "GBP", "EUR"]).default("NGN"),
  linkedin_url: stringType().trim().url().max(300).optional().nullable().or(literalType("").transform(() => null))
});
const upsertReferralProfile = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((d) => ReferralInput.parse(d)).handler(createSsrRpc("fac5f4305f47b0cb03546157f8c0cc1d3bd175e34f487058fd818db4ddd6b96d"));
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("edcbfc75ecea8286e696e8e6da12836411ed43cddeee15cf9ddc241705fd7a85"));
function OnboardingProfile() {
  const {
    user,
    roles,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const primaryRole = roles[0];
  reactExports.useEffect(() => {
    if (loading) return;
    if (!user) navigate({
      to: "/login"
    });
    else if (!primaryRole) navigate({
      to: "/onboarding"
    });
  }, [loading, user, primaryRole, navigate]);
  if (loading || !primaryRole) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen items-center justify-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AuthShell, { title: "Complete your profile", subtitle: "Just a few details so we can match you with the right opportunities.", children: [
    primaryRole === "organiser" && /* @__PURE__ */ jsxRuntimeExports.jsx(OrganiserForm, { onDone: () => navigate({
      to: "/dashboard"
    }) }),
    primaryRole === "sponsor" && /* @__PURE__ */ jsxRuntimeExports.jsx(SponsorForm, { onDone: () => navigate({
      to: "/dashboard"
    }) }),
    primaryRole === "referral_partner" && /* @__PURE__ */ jsxRuntimeExports.jsx(ReferralForm, { onDone: () => navigate({
      to: "/dashboard"
    }) }),
    primaryRole === "media_partner" && /* @__PURE__ */ jsxRuntimeExports.jsx(SkipForm, { onDone: () => navigate({
      to: "/dashboard"
    }) })
  ] });
}
function SkipForm({
  onDone
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Media partner accounts get a custom onboarding from our partnerships team - we'll be in touch." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onDone, className: "btn-primary w-full", children: "Continue to dashboard" })
  ] });
}
function OrganiserForm({
  onDone
}) {
  const submit = useServerFn(upsertOrganiserProfile);
  const [form, setForm] = reactExports.useState({
    org_name: "",
    bio: "",
    website: "",
    event_history: ""
  });
  const [saving, setSaving] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    if (!form.org_name.trim()) return toast.error("Organisation name is required");
    setSaving(true);
    try {
      await submit({
        data: form
      });
      toast.success("Profile saved");
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Organisation name", value: form.org_name, onChange: (v) => setForm({
      ...form,
      org_name: v
    }), required: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Website", type: "url", placeholder: "https://…", value: form.website, onChange: (v) => setForm({
      ...form,
      website: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Short bio", rows: 3, value: form.bio, onChange: (v) => setForm({
      ...form,
      bio: v
    }), placeholder: "What does your org do?" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Event track record", rows: 3, value: form.event_history, onChange: (v) => setForm({
      ...form,
      event_history: v
    }), placeholder: "Past editions, notable speakers / sponsors…" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: saving, className: "btn-primary w-full", children: saving ? "Saving…" : "Save & continue" })
  ] });
}
function SponsorForm({
  onDone
}) {
  const submit = useServerFn(upsertSponsorProfile);
  const [form, setForm] = reactExports.useState({
    brand_name: "",
    industry: "",
    company_size: "",
    hq_country: "",
    hq_city: "",
    preferred_currency: "USD",
    sponsorship_sectors: [],
    target_geographies: [],
    audience_types: [],
    budget_range_min: "",
    budget_range_max: ""
  });
  const [saving, setSaving] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    if (!form.brand_name.trim()) return toast.error("Brand name is required");
    setSaving(true);
    try {
      await submit({
        data: {
          ...form,
          budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
          budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null
        }
      });
      toast.success("Profile saved");
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Brand name", value: form.brand_name, onChange: (v) => setForm({
      ...form,
      brand_name: v
    }), required: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Industry", value: form.industry, onChange: (v) => setForm({
      ...form,
      industry: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Company size", value: form.company_size, onChange: (v) => setForm({
        ...form,
        company_size: v
      }), options: COMPANY_SIZES }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "HQ country", value: form.hq_country, onChange: (v) => setForm({
        ...form,
        hq_country: v
      }), options: COUNTRIES })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "HQ city", value: form.hq_city, onChange: (v) => setForm({
      ...form,
      hq_city: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Sponsorship sectors", options: PRIMARY_SECTORS, value: form.sponsorship_sectors, onChange: (v) => setForm({
      ...form,
      sponsorship_sectors: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Target geographies", options: GEOGRAPHIC_MIX, value: form.target_geographies, onChange: (v) => setForm({
      ...form,
      target_geographies: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Audience types", options: PRIMARY_AUDIENCES, value: form.audience_types, onChange: (v) => setForm({
      ...form,
      audience_types: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Min budget", type: "number", value: form.budget_range_min, onChange: (v) => setForm({
        ...form,
        budget_range_min: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Max budget", type: "number", value: form.budget_range_max, onChange: (v) => setForm({
        ...form,
        budget_range_max: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Currency", value: form.preferred_currency, onChange: (v) => setForm({
        ...form,
        preferred_currency: v
      }), options: [...CURRENCIES] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: saving, className: "btn-primary w-full", children: saving ? "Saving…" : "Save & continue" })
  ] });
}
function ReferralForm({
  onDone
}) {
  const submit = useServerFn(upsertReferralProfile);
  const [form, setForm] = reactExports.useState({
    full_name: "",
    professional_title: "",
    professional_bg: "",
    sponsor_network_desc: "",
    linkedin_url: "",
    payout_currency: "NGN",
    sector_expertise: []
  });
  const [saving, setSaving] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: async (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return toast.error("Full name is required");
    setSaving(true);
    try {
      await submit({
        data: form
      });
      toast.success("Profile saved");
      onDone();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  }, className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", value: form.full_name, onChange: (v) => setForm({
      ...form,
      full_name: v
    }), required: true }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Professional title", value: form.professional_title, onChange: (v) => setForm({
      ...form,
      professional_title: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/…", value: form.linkedin_url, onChange: (v) => setForm({
      ...form,
      linkedin_url: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Professional background", rows: 3, value: form.professional_bg, onChange: (v) => setForm({
      ...form,
      professional_bg: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Describe your sponsor network", rows: 3, value: form.sponsor_network_desc, onChange: (v) => setForm({
      ...form,
      sponsor_network_desc: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Sector expertise", options: SECTOR_EXPERTISE, value: form.sector_expertise, onChange: (v) => setForm({
      ...form,
      sector_expertise: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Payout currency", value: form.payout_currency, onChange: (v) => setForm({
      ...form,
      payout_currency: v
    }), options: [...CURRENCIES] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("button", { disabled: saving, className: "btn-primary w-full", children: saving ? "Saving…" : "Save & continue" })
  ] });
}
function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "mb-1.5 block text-sm font-medium", children: [
      label,
      required && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-destructive", children: " *" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type, required, value, placeholder, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" })
  ] });
}
function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows, value, placeholder, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring" })
  ] });
}
function SelectField({
  label,
  value,
  onChange,
  options
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value, onChange: (e) => onChange(e.target.value), className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select…" }),
      options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o, children: o }, o))
    ] })
  ] });
}
function ChipMulti({
  label,
  options,
  value,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mb-1.5 block text-sm font-medium", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: options.map((o) => {
      const on = value.includes(o);
      return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => onChange(on ? value.filter((x) => x !== o) : [...value, o]), className: `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? "border-primary bg-brand-soft text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"}`, children: o }, o);
    }) })
  ] });
}
function Checkbox({
  label,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2.5 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked, onChange: (e) => onChange(e.target.checked), className: "h-4 w-4 rounded border-input" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
  ] });
}
export {
  Checkbox,
  ChipMulti,
  Field,
  SelectField,
  TextArea,
  OnboardingProfile as component
};
