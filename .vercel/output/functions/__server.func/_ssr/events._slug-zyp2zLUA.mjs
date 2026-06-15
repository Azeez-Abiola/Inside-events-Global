import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as useSearch, L as Link } from "../_libs/tanstack__react-router.mjs";
import { b as Route$n, n as useServerFn, i as getPublicEventBySlug, h as getCurrentRates, e as SiteHeader, d as SiteFooter, u as useAuth, t as toggleSaveEvent, s as submitCommitmentForm } from "./router-4-w4Upb_.mjs";
import { a as useQuery, b as useQueryClient, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { s as supabase } from "./client-BhermGBt.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { f as fmtDual } from "./currency-Cm9QA4xQ.mjs";
import "../_libs/seroval.mjs";
import { a2 as ShieldCheck, C as Calendar, O as MapPin, ac as Users, G as Globe, m as CircleCheck, a4 as Sparkles, r as Download, g as CalendarPlus, c as Bookmark, d as BookmarkCheck, l as CircleAlert } from "../_libs/lucide-react.mjs";
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
function EventDetail() {
  const {
    slug
  } = Route$n.useParams();
  const search = useSearch({
    from: "/events/$slug"
  });
  const fetchEvent = useServerFn(getPublicEventBySlug);
  const fetchRates = useServerFn(getCurrentRates);
  const {
    data,
    isLoading
  } = useQuery({
    queryKey: ["public-event", slug],
    queryFn: () => fetchEvent({
      data: {
        slug
      }
    })
  });
  const {
    data: ratesData
  } = useQuery({
    queryKey: ["fx-rates"],
    queryFn: () => fetchRates()
  });
  const rates = ratesData?.rates;
  const [showForm, setShowForm] = reactExports.useState(false);
  const [showSponsor, setShowSponsor] = reactExports.useState(false);
  const [selectedTier, setSelectedTier] = reactExports.useState(null);
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-6xl px-6 py-24 text-center text-muted-foreground", children: "Loading event…" })
    ] });
  }
  const event = data?.event;
  if (!event) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-6xl px-6 py-24 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-display text-3xl font-bold", children: "Event not found" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "This event may have been unlisted." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/marketplace", className: "mt-6 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground", children: "Back to marketplace" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteHeader, {}),
    event.banner_image_url && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative h-72 w-full overflow-hidden bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: event.banner_image_url, alt: event.name, className: "h-full w-full object-cover" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "mx-auto max-w-6xl px-6 py-10", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-10 lg:grid-cols-[2fr_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
          event.ige_vetted && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-secondary/15 px-2.5 py-1 text-xs font-medium text-secondary-deep", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "h-3 w-3" }),
            " IGE Vetted"
          ] }),
          event.event_type && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground", children: event.event_type }),
          event.primary_sector && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground", children: event.primary_sector })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-4 font-display text-4xl font-bold tracking-tight", children: event.name }),
        event.event_theme && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-lg text-muted-foreground", children: event.event_theme }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-6 flex flex-wrap gap-6 text-sm text-muted-foreground", children: [
          event.start_date && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Calendar, { className: "h-4 w-4" }),
            " ",
            new Date(event.start_date).toLocaleDateString()
          ] }),
          (event.city || event.country) && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(MapPin, { className: "h-4 w-4" }),
            " ",
            [event.city, event.country].filter(Boolean).join(", ")
          ] }),
          event.attendance_size && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "h-4 w-4" }),
            " ",
            event.attendance_size.toLocaleString(),
            " attendees"
          ] }),
          event.format && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "inline-flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Globe, { className: "h-4 w-4" }),
            " ",
            event.format
          ] })
        ] }),
        data?.organiser && /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10 rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "About the organiser" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-start gap-4", children: [
            data.organiser.logo_url && /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: data.organiser.logo_url, alt: data.organiser.org_name, className: "h-14 w-14 rounded-md object-cover" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-medium", children: data.organiser.org_name }),
              data.organiser.bio && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: data.organiser.bio })
            ] })
          ] }),
          data.organiser.track_record && /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-4 text-sm text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "Track record:" }),
            " ",
            data.organiser.track_record
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("section", { className: "mt-10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-lg font-semibold", children: "Sponsorship packages" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 grid gap-4 md:grid-cols-2", children: [
            (data?.tiers ?? []).map((t) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `rounded-xl border p-5 transition-colors ${selectedTier === t.id ? "border-primary bg-primary/5" : "border-border bg-card"}`, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-baseline justify-between", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-lg font-semibold", children: t.tier_name }),
                /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-display text-xl font-bold", children: fmtDual(t.currency, Number(t.price), rates) })
              ] }),
              Array.isArray(t.assets) && t.assets.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-3 space-y-1.5 text-sm text-muted-foreground", children: t.assets.slice(0, 6).map((a, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-start gap-1.5", children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" }),
                " ",
                a
              ] }, i)) }),
              t.slots_remaining !== null && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 text-xs text-muted-foreground", children: [
                t.slots_remaining,
                " of ",
                t.slots_total,
                " slots left"
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => {
                setSelectedTier(t.id);
                setShowForm(true);
              }, className: "mt-4 w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90", children: "Express interest" })
            ] }, t.id)),
            !data?.tiers?.length && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No packages published yet - contact the organiser directly." })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("aside", { className: "space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Get involved" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
            setSelectedTier(null);
            setShowSponsor(true);
          }, className: "mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft hover:-translate-y-0.5 transition-transform", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "h-4 w-4" }),
            " Sponsor this event"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowForm(true), className: "mt-2 w-full rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted", children: "Submit a Commitment Form" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SaveEventButton, { eventId: event.id }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-xs text-muted-foreground", children: "Commitment forms are verified by IGE before reaching the organiser." }),
          search.ref && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 rounded-md bg-secondary/10 px-3 py-2 text-xs text-secondary-deep", children: [
            "Attributed to partner: ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono", children: search.ref })
          ] })
        ] }),
        event.sponsorship_deck_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Sponsorship deck" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: event.sponsorship_deck_url, target: "_blank", rel: "noopener noreferrer", download: true, className: "mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Download, { className: "h-4 w-4" }),
            " Download deck (PDF)"
          ] })
        ] }),
        event.cal_booking_url && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide text-muted-foreground", children: "Book an intro call" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: event.cal_booking_url, target: "_blank", rel: "noopener noreferrer", className: "mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CalendarPlus, { className: "h-4 w-4" }),
            " Schedule with organiser"
          ] })
        ] }),
        event.sponsorship_deadline && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase tracking-wide", children: "Sponsorship deadline" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-1 font-medium text-foreground", children: new Date(event.sponsorship_deadline).toLocaleDateString() })
        ] })
      ] })
    ] }) }),
    showSponsor && /* @__PURE__ */ jsxRuntimeExports.jsx(SponsorInterestDialog, { eventId: event.id, eventName: event.name, onClose: () => setShowSponsor(false) }),
    showForm && /* @__PURE__ */ jsxRuntimeExports.jsx(CommitmentDialog, { eventId: event.id, eventCurrency: event.currency ?? "USD", tierId: selectedTier, refCode: search.ref ?? null, onClose: () => setShowForm(false) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(SiteFooter, {})
  ] });
}
function CommitmentDialog({
  eventId,
  eventCurrency,
  tierId,
  refCode,
  onClose
}) {
  const submit = useServerFn(submitCommitmentForm);
  const [form, setForm] = reactExports.useState({
    contact_name: "",
    contact_title: "",
    company_name: "",
    company_linkedin_url: "",
    currency: eventCurrency,
    partnership_type: "cash",
    budget_range_min: "",
    budget_range_max: "",
    expected_roi: "",
    custom_requirements: "",
    readiness_confirmed: false
  });
  const mutation = useMutation({
    mutationFn: async () => {
      return await submit({
        data: {
          event_id: eventId,
          readiness_confirmed: true,
          contact_name: form.contact_name,
          contact_title: form.contact_title || null,
          company_name: form.company_name,
          company_linkedin_url: form.company_linkedin_url,
          currency: form.currency,
          partnership_type: form.partnership_type,
          budget_range_min: form.budget_range_min ? Number(form.budget_range_min) : null,
          budget_range_max: form.budget_range_max ? Number(form.budget_range_max) : null,
          expected_roi: form.expected_roi || null,
          custom_requirements: form.custom_requirements || null,
          tier_id: tierId,
          referral_short_code: refCode
        }
      });
    }
  });
  const submitted = mutation.isSuccess;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card shadow-2xl", onClick: (e) => e.stopPropagation(), children: submitted ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-12 w-12 text-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold", children: "Commitment received" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-muted-foreground", children: "IGE will review your submission and connect you with the organiser within 48 hours." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground", children: "Close" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      if (form.readiness_confirmed) mutation.mutate();
    }, className: "space-y-5 p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display text-2xl font-bold", children: "Commitment Form" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Budget-ready inquiries only. Verified by IGE before reaching the organiser." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Your name *", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: form.contact_name, onChange: (e) => setForm({
          ...form,
          contact_name: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Your title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.contact_title, onChange: (e) => setForm({
          ...form,
          contact_title: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Company name *", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: form.company_name, onChange: (e) => setForm({
          ...form,
          company_name: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Company LinkedIn URL *", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, type: "url", placeholder: "https://linkedin.com/company/…", value: form.company_linkedin_url, onChange: (e) => setForm({
          ...form,
          company_linkedin_url: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Currency *", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: form.currency, onChange: (e) => setForm({
          ...form,
          currency: e.target.value
        }), className: "input", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "USD", children: "USD" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "EUR", children: "EUR" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "GBP", children: "GBP" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "NGN", children: "NGN" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Partnership type", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("select", { value: form.partnership_type, onChange: (e) => setForm({
          ...form,
          partnership_type: e.target.value
        }), className: "input", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "cash", children: "Cash" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "in_kind", children: "In-kind" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "co_creation", children: "Co-creation" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "jv", children: "Joint venture" })
        ] }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Budget min", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, value: form.budget_range_min, onChange: (e) => setForm({
          ...form,
          budget_range_min: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Budget max", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", min: 0, value: form.budget_range_max, onChange: (e) => setForm({
          ...form,
          budget_range_max: e.target.value
        }), className: "input" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Expected ROI / objectives", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: form.expected_roi, onChange: (e) => setForm({
        ...form,
        expected_roi: e.target.value
      }), className: "input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Custom requirements", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: form.custom_requirements, onChange: (e) => setForm({
        ...form,
        custom_requirements: e.target.value
      }), className: "input" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex items-start gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "checkbox", checked: form.readiness_confirmed, onChange: (e) => setForm({
          ...form,
          readiness_confirmed: e.target.checked
        }), className: "mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "I confirm budget is allocated and an internal decision-maker is briefed. I understand IGE collects a platform commission on closed deals." })
      ] }),
      mutation.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-4 w-4" }),
        mutation.error.message
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded-md px-4 py-2 text-sm font-medium hover:bg-muted", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: !form.readiness_confirmed || mutation.isPending, className: "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: mutation.isPending ? "Submitting…" : "Submit commitment" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `.input{display:block;width:100%;border-radius:.375rem;border:1px solid hsl(var(--border,0 0% 90%));background:transparent;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary,221 83% 53%))}` })
  ] });
}
function SaveEventButton({
  eventId
}) {
  const {
    user
  } = useAuth();
  const qc = useQueryClient();
  const toggle = useServerFn(toggleSaveEvent);
  const {
    data: saved
  } = useQuery({
    queryKey: ["event-saved", eventId, user?.id],
    queryFn: async () => {
      const {
        data
      } = await supabase.from("event_saves").select("id").eq("event_id", eventId).maybeSingle();
      return !!data;
    },
    enabled: !!user
  });
  const mut = useMutation({
    mutationFn: () => toggle({
      data: {
        event_id: eventId
      }
    }),
    onSuccess: (res) => {
      qc.invalidateQueries({
        queryKey: ["event-saved", eventId]
      });
      qc.invalidateQueries({
        queryKey: ["sponsor-dash"]
      });
      toast.success(res.saved ? "Saved to your list" : "Removed from saved");
    },
    onError: (e) => toast.error(e.message)
  });
  if (!user) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/login", search: {
      redirect: typeof window !== "undefined" ? window.location.pathname : void 0
    }, className: "mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-border px-4 py-2.5 text-sm font-semibold hover:bg-muted", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-4 w-4" }),
      " Sign in to save"
    ] });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => mut.mutate(), disabled: mut.isPending, className: `mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${saved ? "border-secondary/40 bg-secondary/10 text-secondary-deep" : "border-border hover:bg-muted"}`, children: [
    saved ? /* @__PURE__ */ jsxRuntimeExports.jsx(BookmarkCheck, { className: "h-4 w-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "h-4 w-4" }),
    saved ? "Saved" : "Save event"
  ] });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1 font-medium text-foreground", children: label }),
    children
  ] });
}
function SponsorInterestDialog({
  eventId,
  eventName,
  onClose
}) {
  const [form, setForm] = reactExports.useState({
    full_name: "",
    email: "",
    company: "",
    role_title: "",
    phone: "",
    tier_interest: "",
    message: ""
  });
  const mutation = useMutation({
    mutationFn: async () => {
      const {
        error
      } = await supabase.from("sponsorship_interests").insert({
        event_id: eventId,
        event_name: eventName,
        full_name: form.full_name,
        email: form.email,
        company: form.company || null,
        role_title: form.role_title || null,
        phone: form.phone || null,
        tier_interest: form.tier_interest || null,
        message: form.message || null
      });
      if (error) throw error;
    },
    onSuccess: () => toast.success("Interest received — the IGE team will be in touch."),
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4", onClick: onClose, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-card shadow-2xl", onClick: (e) => e.stopPropagation(), children: mutation.isSuccess ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-10 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheck, { className: "mx-auto h-12 w-12 text-secondary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 font-display text-2xl font-bold", children: "Thanks — we'll be in touch" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "mt-2 text-muted-foreground", children: [
        "A member of the IGE team will contact you within 48 hours about sponsoring ",
        eventName,
        "."
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground", children: "Close" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      mutation.mutate();
    }, className: "space-y-4 p-8", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h2", { className: "font-display text-2xl font-bold", children: [
          "Sponsor ",
          eventName
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Tell us a bit about your brand — IGE will reach out with the deck and next steps." })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 md:grid-cols-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Your name *", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, value: form.full_name, onChange: (e) => setForm({
          ...form,
          full_name: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Work email *", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { required: true, type: "email", value: form.email, onChange: (e) => setForm({
          ...form,
          email: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Company", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.company, onChange: (e) => setForm({
          ...form,
          company: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Role / title", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.role_title, onChange: (e) => setForm({
          ...form,
          role_title: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Phone", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.phone, onChange: (e) => setForm({
          ...form,
          phone: e.target.value
        }), className: "input" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tier of interest", children: /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: form.tier_interest, onChange: (e) => setForm({
          ...form,
          tier_interest: e.target.value
        }), placeholder: "e.g. Title / Gold", className: "input" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Message", children: /* @__PURE__ */ jsxRuntimeExports.jsx("textarea", { rows: 3, value: form.message, onChange: (e) => setForm({
        ...form,
        message: e.target.value
      }), className: "input" }) }),
      mutation.error && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(CircleAlert, { className: "mt-0.5 h-4 w-4" }),
        mutation.error.message
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-end gap-3 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: onClose, className: "rounded-md px-4 py-2 text-sm font-medium hover:bg-muted", children: "Cancel" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: mutation.isPending, className: "rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50", children: mutation.isPending ? "Sending…" : "Send interest" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("style", { children: `.input{display:block;width:100%;border-radius:.375rem;border:1px solid hsl(var(--border,0 0% 90%));background:transparent;padding:.5rem .75rem;font-size:.875rem;outline:none}.input:focus{border-color:hsl(var(--primary,221 83% 53%))}` })
  ] });
}
export {
  EventDetail as component
};
