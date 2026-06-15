import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { supabase } from "./client-DBr2rXmP.mjs";
import { l as lovable } from "./index-32wYu5v6.mjs";
import { g as getSiteUrl } from "./site-url-Du7GW4Cs.mjs";
import { A as AuthShell, G as GoogleButton, D as Divider } from "./auth-shell-BH3UBkGL.mjs";
import { a as Route$U, u as useAuth, n as useServerFn, e as createSsrRpc } from "./router-CyTgVp-T.mjs";
import { d as createServerFn } from "./server-DRh9RfeA.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-t0GaQtdd.mjs";
import { C as COMPANY_SIZES, a as COUNTRIES, e as PRIMARY_SECTORS, G as GEOGRAPHIC_MIX, d as PRIMARY_AUDIENCES, b as CURRENCIES, S as SECTOR_EXPERTISE } from "./event-taxonomy-C1jnPFFJ.mjs";
import { F as Field, T as TextArea, S as SelectField, a as ChipMulti } from "./profile-fields-DgVfOK4X.mjs";
import "../_libs/ws.mjs";
import "../_libs/lovable.dev__cloud-auth-js.mjs";
import "../_libs/seroval.mjs";
import { Q as Megaphone, E as Earth, H as Handshake, V as Newspaper, M as LoaderCircle, w as EyeOff, v as Eye } from "../_libs/lucide-react.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./supabase-env-Di-uc-dX.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "./client.server-k0C2Btf0.mjs";
import "../_libs/react-email__html.mjs";
import "../_libs/react-email__head.mjs";
import "../_libs/react-email__preview.mjs";
import "../_libs/react-email__body.mjs";
import "../_libs/react-email__container.mjs";
import "../_libs/react-email__section.mjs";
import "../_libs/react-email__heading.mjs";
import "../_libs/react-email__text.mjs";
import "../_libs/react-email__button.mjs";
import "../_libs/react-email__link.mjs";
import "../_libs/react-email__hr.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "../_libs/lovable.dev__webhooks-js.mjs";
import "../_libs/lovable.dev__email-js.mjs";
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
const sendWelcomeEmail = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("abe666add245791c4809f545ca350c25ee01dec56db9c0f6797c6a530a4e96b3"));
createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("edcbfc75ecea8286e696e8e6da12836411ed43cddeee15cf9ddc241705fd7a85"));
function SignupProfileStep({ role, onDone }) {
  if (role === "organiser") return /* @__PURE__ */ jsxRuntimeExports.jsx(OrganiserForm, { onDone });
  if (role === "sponsor") return /* @__PURE__ */ jsxRuntimeExports.jsx(SponsorForm, { onDone });
  if (role === "referral_partner") return /* @__PURE__ */ jsxRuntimeExports.jsx(ReferralForm, { onDone });
  return /* @__PURE__ */ jsxRuntimeExports.jsx(MediaSkipForm, { onDone });
}
function MediaSkipForm({ onDone }) {
  const welcome = useServerFn(sendWelcomeEmail);
  const [loading, setLoading] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Media partner accounts get a custom onboarding from our partnerships team — we'll be in touch." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        type: "button",
        disabled: loading,
        onClick: async () => {
          setLoading(true);
          try {
            await welcome();
          } catch {
          } finally {
            setLoading(false);
            onDone();
          }
        },
        className: "btn-primary w-full",
        children: loading ? "Finishing…" : "Continue to dashboard"
      }
    )
  ] });
}
function OrganiserForm({ onDone }) {
  const submit = useServerFn(upsertOrganiserProfile);
  const [form, setForm] = reactExports.useState({ org_name: "", bio: "", website: "", event_history: "" });
  const [saving, setSaving] = reactExports.useState(false);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      onSubmit: async (e) => {
        e.preventDefault();
        if (!form.org_name.trim()) return toast.error("Organisation name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Profile saved");
          onDone();
        } catch (err) {
          toast.error(err.message);
        } finally {
          setSaving(false);
        }
      },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Organisation name", value: form.org_name, onChange: (v) => setForm({ ...form, org_name: v }), required: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Website", type: "url", placeholder: "https://…", value: form.website, onChange: (v) => setForm({ ...form, website: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Short bio", rows: 3, value: form.bio, onChange: (v) => setForm({ ...form, bio: v }), placeholder: "What does your org do?" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          TextArea,
          {
            label: "Event track record",
            rows: 3,
            value: form.event_history,
            onChange: (v) => setForm({ ...form, event_history: v }),
            placeholder: "Past editions, notable speakers / sponsors…"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: saving, className: "btn-primary w-full", children: saving ? "Saving…" : "Finish & go to dashboard" })
      ]
    }
  );
}
function SponsorForm({ onDone }) {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      onSubmit: async (e) => {
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
      },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Brand name", value: form.brand_name, onChange: (v) => setForm({ ...form, brand_name: v }), required: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Industry", value: form.industry, onChange: (v) => setForm({ ...form, industry: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Company size", value: form.company_size, onChange: (v) => setForm({ ...form, company_size: v }), options: COMPANY_SIZES }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "HQ country", value: form.hq_country, onChange: (v) => setForm({ ...form, hq_country: v }), options: COUNTRIES })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "HQ city", value: form.hq_city, onChange: (v) => setForm({ ...form, hq_city: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Sponsorship sectors", options: PRIMARY_SECTORS, value: form.sponsorship_sectors, onChange: (v) => setForm({ ...form, sponsorship_sectors: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Target geographies", options: GEOGRAPHIC_MIX, value: form.target_geographies, onChange: (v) => setForm({ ...form, target_geographies: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Audience types", options: PRIMARY_AUDIENCES, value: form.audience_types, onChange: (v) => setForm({ ...form, audience_types: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Min budget", type: "number", value: form.budget_range_min, onChange: (v) => setForm({ ...form, budget_range_min: v }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Max budget", type: "number", value: form.budget_range_max, onChange: (v) => setForm({ ...form, budget_range_max: v }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Currency", value: form.preferred_currency, onChange: (v) => setForm({ ...form, preferred_currency: v }), options: [...CURRENCIES] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: saving, className: "btn-primary w-full", children: saving ? "Saving…" : "Finish & go to dashboard" })
      ]
    }
  );
}
function ReferralForm({ onDone }) {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "form",
    {
      onSubmit: async (e) => {
        e.preventDefault();
        if (!form.full_name.trim()) return toast.error("Full name is required");
        setSaving(true);
        try {
          await submit({ data: form });
          toast.success("Profile saved");
          onDone();
        } catch (err) {
          toast.error(err.message);
        } finally {
          setSaving(false);
        }
      },
      className: "space-y-4",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Full name", value: form.full_name, onChange: (v) => setForm({ ...form, full_name: v }), required: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Professional title", value: form.professional_title, onChange: (v) => setForm({ ...form, professional_title: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "LinkedIn URL", type: "url", placeholder: "https://linkedin.com/in/…", value: form.linkedin_url, onChange: (v) => setForm({ ...form, linkedin_url: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Professional background", rows: 3, value: form.professional_bg, onChange: (v) => setForm({ ...form, professional_bg: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(TextArea, { label: "Describe your sponsor network", rows: 3, value: form.sponsor_network_desc, onChange: (v) => setForm({ ...form, sponsor_network_desc: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Sector expertise", options: SECTOR_EXPERTISE, value: form.sector_expertise, onChange: (v) => setForm({ ...form, sector_expertise: v }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Payout currency", value: form.payout_currency, onChange: (v) => setForm({ ...form, payout_currency: v }), options: [...CURRENCIES] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: saving, className: "btn-primary w-full", children: saving ? "Saving…" : "Finish & go to dashboard" })
      ]
    }
  );
}
const SIGNUP_ROLES = [
  { key: "organiser", title: "Event Organiser", desc: "List your event and find sponsors.", icon: Megaphone },
  { key: "sponsor", title: "Brand / Sponsor", desc: "Discover vetted events to sponsor.", icon: Earth },
  { key: "referral_partner", title: "Referral Partner", desc: "Earn commission introducing sponsors.", icon: Handshake },
  { key: "media_partner", title: "Media Partner", desc: "Cross-promote with quality events.", icon: Newspaper }
];
const ROLE_STORAGE_KEY = "ige:signup-role";
function stashSignupRole(role) {
  try {
    sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
  }
}
function readSignupRole() {
  try {
    const raw = sessionStorage.getItem(ROLE_STORAGE_KEY);
    if (raw && SIGNUP_ROLES.some((r) => r.key === raw)) return raw;
  } catch {
  }
  return null;
}
function clearSignupRole() {
  try {
    sessionStorage.removeItem(ROLE_STORAGE_KEY);
    sessionStorage.removeItem("ige:pending-role");
  } catch {
  }
}
async function applySignupRole(userId, role) {
  const { supabase: supabase2 } = await import("./client-DBr2rXmP.mjs");
  const { error } = await supabase2.from("user_roles").insert({ user_id: userId, role });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}
async function hasRoleProfile(userId, role) {
  const { supabase: supabase2 } = await import("./client-DBr2rXmP.mjs");
  if (role === "media_partner") return true;
  const table = role === "organiser" ? "organiser_profiles" : role === "sponsor" ? "sponsor_profiles" : "referral_partner_profiles";
  const { data } = await supabase2.from(table).select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}
const STEPS = [
  { key: "role", label: "Role" },
  { key: "account", label: "Account" },
  { key: "profile", label: "Profile" }
];
function SignupWizard({ initialStep }) {
  const navigate = useNavigate();
  const { user, roles, loading, refreshRoles } = useAuth();
  const [step, setStep] = reactExports.useState(initialStep ?? "role");
  const [role, setRole] = reactExports.useState("sponsor");
  const [bootstrapping, setBootstrapping] = reactExports.useState(true);
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [submitting, setSubmitting] = reactExports.useState(false);
  const [googleLoading, setGoogleLoading] = reactExports.useState(false);
  const [emailConfirmPending, setEmailConfirmPending] = reactExports.useState(false);
  const signupRole = roles[0] ?? role;
  const roleMeta = SIGNUP_ROLES.find((r) => r.key === signupRole);
  const stepIndex = STEPS.findIndex((s) => s.key === step);
  function goToStep(next) {
    setStep(next);
    navigate({ to: "/signup", search: next === "role" ? {} : { step: next }, replace: true });
  }
  reactExports.useEffect(() => {
    if (loading) return;
    (async () => {
      if (!user) {
        const stored = readSignupRole();
        if (stored) setRole(stored);
        if (initialStep === "profile") goToStep("account");
        else if (initialStep && initialStep !== "role") setStep(initialStep);
        setBootstrapping(false);
        return;
      }
      const storedRole = readSignupRole();
      const primaryRole = roles[0];
      if (!primaryRole && storedRole) {
        try {
          await applySignupRole(user.id, storedRole);
          await refreshRoles();
          clearSignupRole();
          setRole(storedRole);
          goToStep("profile");
        } catch (e) {
          toast.error(e.message ?? "Could not save your role");
        }
        setBootstrapping(false);
        return;
      }
      if (primaryRole) {
        setRole(primaryRole);
        const complete = await hasRoleProfile(user.id, primaryRole);
        if (complete) {
          navigate({ to: "/dashboard", replace: true });
          return;
        }
        goToStep("profile");
        setBootstrapping(false);
        return;
      }
      if (storedRole) setRole(storedRole);
      if (initialStep === "profile") goToStep(user ? "role" : "account");
      else if (initialStep && initialStep !== "role") setStep(initialStep);
      setBootstrapping(false);
    })();
  }, [loading, user?.id, roles.join(",")]);
  async function handleRoleContinue() {
    stashSignupRole(role);
    if (user) {
      try {
        await applySignupRole(user.id, role);
        await refreshRoles();
        clearSignupRole();
        toast.success("Role set — let's complete your profile");
        goToStep("profile");
      } catch (e) {
        toast.error(e.message ?? "Could not save your role");
      }
      return;
    }
    goToStep("account");
  }
  async function handlePassword(e) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Use at least 8 characters for your password.");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${getSiteUrl()}/signup?step=profile`,
        data: { role }
      }
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session?.user) {
      try {
        await applySignupRole(data.session.user.id, role);
        await refreshRoles();
        clearSignupRole();
        toast.success("Account created — one more step");
        goToStep("profile");
      } catch (err) {
        toast.error(err.message ?? "Could not save your role");
      }
      return;
    }
    setEmailConfirmPending(true);
    toast.success("Check your inbox to confirm your email, then sign in to finish your profile.");
  }
  async function handleGoogle() {
    stashSignupRole(role);
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${getSiteUrl()}/signup?step=profile`
    });
    if (result.error) {
      setGoogleLoading(false);
      toast.error("Google sign-in failed");
      return;
    }
    if (result.redirected) return;
    setGoogleLoading(false);
    goToStep("profile");
  }
  if (loading || bootstrapping) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex min-h-screen items-center justify-center bg-background text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] });
  }
  const { title, subtitle } = stepCopy(step, roleMeta.title);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    AuthShell,
    {
      title,
      subtitle,
      footer: step === "profile" && user ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Wrong account?",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-semibold text-primary hover:text-primary-deep", children: "Sign in as someone else" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        "Already have an account?",
        " ",
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "font-semibold text-primary hover:text-primary-deep", children: "Sign in" })
      ] }),
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StepIndicator, { current: stepIndex }),
        step === "role" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid gap-2.5", children: SIGNUP_ROLES.map((r) => {
            const isSel = role === r.key;
            return /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "button",
              {
                type: "button",
                onClick: () => setRole(r.key),
                className: `flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${isSel ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted"}`,
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `flex h-9 w-9 items-center justify-center rounded-lg ${isSel ? "bg-brand-gradient text-white" : "bg-muted text-muted-foreground"}`,
                      children: /* @__PURE__ */ jsxRuntimeExports.jsx(r.icon, { className: "h-4 w-4" })
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "flex-1", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-sm font-semibold text-foreground", children: r.title }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "block text-xs text-muted-foreground", children: r.desc })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: `h-4 w-4 rounded-full border ${isSel ? "border-primary bg-primary" : "border-border"}`
                    }
                  )
                ]
              },
              r.key
            );
          }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              type: "button",
              onClick: handleRoleContinue,
              className: "mt-6 inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5",
              children: "Continue"
            }
          )
        ] }),
        step === "account" && /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: user ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-muted-foreground", children: [
            "You're already signed in as ",
            user.email,
            "."
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => goToStep("role"), className: "btn-primary w-full", children: "Continue setup" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mb-4 rounded-lg border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground", children: [
            "Signing up as ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-semibold text-foreground", children: roleMeta.title }),
            !user && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              " ",
              "—",
              " ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "button",
                  onClick: () => goToStep("role"),
                  className: "font-semibold text-primary hover:text-primary-deep",
                  children: "Change"
                }
              )
            ] })
          ] }),
          emailConfirmPending ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 rounded-xl border border-border bg-card p-4 text-sm", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-foreground", children: [
              "We sent a confirmation link to ",
              /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: email }),
              "."
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground", children: "After confirming, sign in and we'll take you straight to your profile step." }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/login", className: "btn-primary inline-flex w-full justify-center", children: "Go to sign in" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(GoogleButton, { onClick: handleGoogle, loading: googleLoading, label: "Sign up with Google" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Divider, {}),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: handlePassword, className: "space-y-4", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AccountField,
                {
                  label: "Work email",
                  type: "email",
                  autoComplete: "email",
                  required: true,
                  value: email,
                  onChange: setEmail
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                AccountField,
                {
                  label: "Password",
                  type: "password",
                  autoComplete: "new-password",
                  required: true,
                  value: password,
                  onChange: setPassword
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "button",
                {
                  type: "submit",
                  disabled: submitting,
                  className: "inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60",
                  children: submitting ? "Creating account…" : "Create account"
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground", children: "By continuing you agree to IGE's Terms and Privacy Policy." })
            ] })
          ] })
        ] }) }),
        step === "profile" && user && /* @__PURE__ */ jsxRuntimeExports.jsx(SignupProfileStep, { role: signupRole, onDone: () => navigate({ to: "/dashboard" }) })
      ]
    }
  );
}
function stepCopy(step, roleTitle) {
  if (step === "role") {
    return {
      title: "How will you use IGE?",
      subtitle: "We'll tailor your workspace from the start."
    };
  }
  if (step === "account") {
    return {
      title: "Create your account",
      subtitle: `Set up access for your ${roleTitle} workspace.`
    };
  }
  return {
    title: "Complete your profile",
    subtitle: "A few details so we can match you with the right opportunities."
  };
}
function StepIndicator({ current }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { "aria-label": "Signup progress", className: "mb-8", children: /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "flex items-center gap-2", children: STEPS.map((s, i) => {
    const done = i < current;
    const active = i === current;
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex flex-1 items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${active ? "bg-brand-gradient text-white" : done ? "bg-primary/15 text-primary-deep" : "bg-muted text-muted-foreground"}`,
          children: i + 1
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "span",
        {
          className: `hidden text-xs font-medium sm:block ${active ? "text-foreground" : "text-muted-foreground"}`,
          children: s.label
        }
      ),
      i < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `mx-1 h-px flex-1 ${done ? "bg-primary/40" : "bg-border"}` })
    ] }, s.key);
  }) }) });
}
function AccountField({
  label,
  value,
  onChange,
  type = "text",
  ...rest
}) {
  const [showPassword, setShowPassword] = reactExports.useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? showPassword ? "text" : "password" : type;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "block", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "mb-1.5 block text-sm font-medium text-foreground", children: label }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "input",
        {
          ...rest,
          type: inputType,
          value,
          onChange: (e) => onChange(e.target.value),
          className: "w-full rounded-md border border-input bg-background pl-3 pr-10 py-2.5 text-sm text-foreground outline-none transition-shadow focus:ring-2 focus:ring-ring"
        }
      ),
      isPassword && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => setShowPassword(!showPassword),
          className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none transition-colors",
          "aria-label": showPassword ? "Hide password" : "Show password",
          children: showPassword ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { size: 18 }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { size: 18 })
        }
      )
    ] })
  ] });
}
function SignupPage() {
  const {
    step
  } = Route$U.useSearch();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(SignupWizard, { initialStep: step });
}
export {
  SignupPage as component
};
