import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { c as Route, o as useServerFn, F as Field, S as SelectField, a as ChipMulti, C as Checkbox } from "./router-BT27-cf7.mjs";
import { b as useQueryClient, a as useQuery, u as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as toast } from "../_libs/sonner.mjs";
import { A as AppShell, S as StatusBadge } from "./app-shell-ByWYJGa2.mjs";
import { g as getEventForEdit, a as autosaveEvent, s as submitEvent, u as upsertTier, b as deleteTier, p as pickAutosavePatch } from "./events.functions-CRSk2WwU.mjs";
import { E as EVENT_TYPES, a as COUNTRIES, d as PRIMARY_AUDIENCES, f as SENIORITY, G as GEOGRAPHIC_MIX, e as PRIMARY_SECTORS, b as CURRENCIES, c as EXPOSURE_CHANNELS, P as PAYMENT_TERMS } from "./event-taxonomy-C1jnPFFJ.mjs";
import { s as supabase } from "./client-gmdRS3ZG.mjs";
import "../_libs/seroval.mjs";
import "../_libs/ws.mjs";
import { M as LoaderCircle, A as ArrowLeft, _ as Save, i as Check, a as ArrowRight, a7 as Trash2, Y as Plus, a0 as Send, af as X, ab as Upload } from "../_libs/lucide-react.mjs";
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
import "./server-CqdVJ_Eq.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-DeHWLdHU.mjs";
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
import "../_libs/zod.mjs";
import "events";
import "https";
import "http";
import "net";
import "tls";
import "url";
import "zlib";
import "buffer";
import "./alert-dialog-BrzSSKxW.mjs";
import "../_libs/radix-ui__react-alert-dialog.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-dialog.mjs";
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "./button-DA2gxxPy.mjs";
import "../_libs/class-variance-authority.mjs";
const STEPS = ["Basics", "Contacts", "Track record", "Audience", "Sector & theme", "Sponsorship economics", "Tiers", "Assets", "Review & submit"];
function EventEditor() {
  const {
    id
  } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchEvent = useServerFn(getEventForEdit);
  const autosave = useServerFn(autosaveEvent);
  const submit = useServerFn(submitEvent);
  const {
    data,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["event", id],
    queryFn: () => fetchEvent({
      data: {
        id
      }
    })
  });
  const [step, setStep] = reactExports.useState(0);
  const [form, setForm] = reactExports.useState(null);
  const [savedAt, setSavedAt] = reactExports.useState(null);
  const [saving, setSaving] = reactExports.useState(false);
  const debouncer = reactExports.useRef(null);
  const initial = reactExports.useRef(false);
  const formRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (data?.event && !initial.current) {
      setForm({
        ...data.event
      });
      formRef.current = {
        ...data.event
      };
      setStep(Math.min(data.event.form_step_completed ?? 0, STEPS.length - 1));
      setSavedAt(data.event.updated_at ?? null);
      initial.current = true;
    }
  }, [data]);
  reactExports.useEffect(() => {
    if (step === STEPS.length - 1) refetch();
  }, [step, refetch]);
  const editable = reactExports.useMemo(() => {
    if (!data?.event) return false;
    return ["draft", "revision_requested"].includes(data.event.status);
  }, [data]);
  function update(patch) {
    setForm((f) => {
      const next = {
        ...f ?? {},
        ...patch
      };
      formRef.current = next;
      if (debouncer.current) window.clearTimeout(debouncer.current);
      debouncer.current = window.setTimeout(() => doSave(next, step), 700);
      return next;
    });
  }
  async function doSave(formSnapshot, nextStep = step) {
    if (!editable) return;
    try {
      const res = await autosave({
        data: {
          id,
          step: nextStep,
          patch: pickAutosavePatch(formSnapshot)
        }
      });
      setSavedAt(res.savedAt);
      setForm((f) => f ? {
        ...f,
        form_step_completed: Math.max(f.form_step_completed ?? 0, nextStep)
      } : f);
    } catch (e) {
      toast.error(`Autosave: ${e.message}`);
    }
  }
  async function flushSave(nextStep = step) {
    if (!editable || !formRef.current) return;
    if (debouncer.current) {
      window.clearTimeout(debouncer.current);
      debouncer.current = null;
    }
    const res = await autosave({
      data: {
        id,
        step: nextStep,
        patch: pickAutosavePatch(formRef.current)
      }
    });
    setSavedAt(res.savedAt);
    setForm((f) => f ? {
      ...f,
      form_step_completed: Math.max(f.form_step_completed ?? 0, nextStep)
    } : f);
  }
  async function handleSaveDraft(nextStep = step) {
    if (!editable) return;
    setSaving(true);
    try {
      await flushSave(nextStep);
      await refetch();
      toast.success("Draft saved");
    } catch (e) {
      toast.error(e.message ?? "Could not save draft");
    } finally {
      setSaving(false);
    }
  }
  async function goToStep(next) {
    if (!editable) {
      setStep(next);
      return;
    }
    setSaving(true);
    try {
      await flushSave(Math.max(step, next));
      setStep(next);
    } catch (e) {
      toast.error(e.message ?? "Could not save progress");
    } finally {
      setSaving(false);
    }
  }
  const submitMutation = useMutation({
    mutationFn: async () => {
      try {
        await flushSave(STEPS.length - 1);
      } catch (e) {
        throw new Error(`Could not save your latest changes: ${e.message}`);
      }
      return submit({
        data: {
          id
        }
      });
    },
    onSuccess: () => {
      toast.success("Submitted for vetting");
      qc.invalidateQueries({
        queryKey: ["event", id]
      });
      qc.invalidateQueries({
        queryKey: ["events", "mine"]
      });
      navigate({
        to: "/dashboard"
      });
    },
    onError: (e) => toast.error(e.message)
  });
  if (isLoading || !form) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center text-muted-foreground", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "mr-2 h-4 w-4 animate-spin" }),
      " Loading…"
    ] }) });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(AppShell, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/dashboard", className: "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-3 w-3" }),
          " Back to dashboard"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "mt-1 truncate font-display text-2xl font-bold tracking-tight", children: form.name || "Untitled event" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(StatusBadge, { status: data.event.status }),
        savedAt && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "hidden text-xs text-muted-foreground sm:inline", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "mr-1 inline h-3 w-3" }),
          " Saved ",
          new Date(savedAt).toLocaleTimeString()
        ] }),
        editable && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => handleSaveDraft(), disabled: saving, className: "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50", children: [
          saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
          "Save draft"
        ] })
      ] })
    ] }),
    !editable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-4 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900", children: [
      "This event is ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: data.event.status.replace(/_/g, " ") }),
      " - it is read-only.",
      data.event.vetting_notes && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs", children: [
        "Reviewer notes: ",
        data.event.vetting_notes
      ] }),
      data.event.rejection_reason && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-1 text-xs", children: [
        "Rejection reason: ",
        data.event.rejection_reason
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 grid gap-8 lg:grid-cols-[220px_1fr]", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "space-y-1", children: STEPS.map((s, i) => {
        const active = i === step;
        const done = (form.form_step_completed ?? 0) >= i && !active;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => goToStep(i), disabled: saving, className: `flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors ${active ? "bg-brand-soft font-semibold text-primary-deep" : "text-muted-foreground hover:bg-muted"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${active ? "bg-brand-gradient text-white" : done ? "bg-secondary/15 text-secondary-deep" : "bg-muted text-muted-foreground"}`, children: done ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-3 w-3" }) : i + 1 }),
          s
        ] }) }, s);
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-2xl border border-border bg-card p-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { disabled: !editable, className: "space-y-5", children: [
          step === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepBasics, { form, update }),
          step === 1 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepContacts, { form, update }),
          step === 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepTrackRecord, { form, update }),
          step === 3 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepAudience, { form, update }),
          step === 4 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepSector, { form, update }),
          step === 5 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepEconomics, { form, update })
        ] }),
        step === 6 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepTiers, { eventId: id, currency: form.currency || "NGN", tiers: data.tiers, editable }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("fieldset", { disabled: !editable, className: "space-y-5", children: [
          step === 7 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepAssets, { eventId: id, form, update }),
          step === 8 && /* @__PURE__ */ jsxRuntimeExports.jsx(StepReview, { form, update, tierCount: data.tiers.length, onSubmit: () => submitMutation.mutate(), submitting: submitMutation.isPending, editable })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-8 flex justify-between border-t border-border pt-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => goToStep(Math.max(0, step - 1)), disabled: step === 0 || saving, className: "inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium disabled:opacity-50", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "h-4 w-4" }),
            " Back"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            editable && /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => handleSaveDraft(), disabled: saving, className: "inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium disabled:opacity-50", children: [
              saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Save, { className: "h-4 w-4" }),
              "Save draft"
            ] }),
            step < STEPS.length - 1 && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => goToStep(Math.min(STEPS.length - 1, step + 1)), disabled: saving, className: "inline-flex items-center gap-1 rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-white disabled:opacity-50", children: saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
              "Next ",
              /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "h-4 w-4" })
            ] }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
function StepBasics({
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Event name", required: true, value: form.name ?? "", onChange: (v) => update({
      name: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Event type", value: form.event_type ?? "", onChange: (v) => update({
        event_type: v
      }), options: EVENT_TYPES }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Format", value: form.format ?? "", onChange: (v) => update({
        format: v
      }), options: ["in-person", "virtual", "hybrid"] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Start date", type: "date", value: form.start_date ?? "", onChange: (v) => update({
        start_date: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "End date", type: "date", value: form.end_date ?? "", onChange: (v) => update({
        end_date: v
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Country", value: form.country ?? "", onChange: (v) => update({
        country: v
      }), options: COUNTRIES }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "City", value: form.city ?? "", onChange: (v) => update({
        city: v
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Venue", value: form.venue ?? "", onChange: (v) => update({
      venue: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Event website", type: "url", placeholder: "https://…", value: form.website ?? "", onChange: (v) => update({
      website: v
    }) })
  ] });
}
function StepContacts({
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Contact name", value: form.organiser_contact_name ?? "", onChange: (v) => update({
      organiser_contact_name: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Role / title", value: form.organiser_contact_role ?? "", onChange: (v) => update({
      organiser_contact_role: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Email", type: "email", value: form.organiser_contact_email ?? "", onChange: (v) => update({
        organiser_contact_email: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Phone", value: form.organiser_contact_phone ?? "", onChange: (v) => update({
        organiser_contact_phone: v
      }) })
    ] })
  ] });
}
function StepTrackRecord({
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Years running", type: "number", value: form.years_running_event ?? "", onChange: (v) => update({
      years_running_event: v ? Number(v) : null
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Past editions", type: "number", value: form.past_editions ?? "", onChange: (v) => update({
      past_editions: v ? Number(v) : null
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Expected attendance", type: "number", value: form.attendance_size ?? "", onChange: (v) => update({
      attendance_size: v ? Number(v) : null
    }) })
  ] }) });
}
function StepAudience({
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Primary audience", options: PRIMARY_AUDIENCES, value: form.primary_audience ?? [], onChange: (v) => update({
      primary_audience: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Audience seniority", value: form.audience_seniority ?? "", onChange: (v) => update({
        audience_seniority: v
      }), options: SENIORITY }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "% decision makers", type: "number", value: form.decision_makers_pct ?? "", onChange: (v) => update({
        decision_makers_pct: v ? Number(v) : null
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Geographic mix", options: GEOGRAPHIC_MIX, value: form.geographic_mix ?? [], onChange: (v) => update({
      geographic_mix: v
    }) })
  ] });
}
function StepSector({
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Primary sector", value: form.primary_sector ?? "", onChange: (v) => update({
        primary_sector: v
      }), options: PRIMARY_SECTORS }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Secondary sector", value: form.secondary_sector ?? "", onChange: (v) => update({
        secondary_sector: v
      }), options: PRIMARY_SECTORS })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Event theme / tagline", value: form.event_theme ?? "", onChange: (v) => update({
      event_theme: v
    }) })
  ] });
}
function StepEconomics({
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Minimum sponsorship spend", type: "number", value: form.min_sponsorship_spend ?? "", onChange: (v) => update({
        min_sponsorship_spend: v ? Number(v) : null
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Currency", value: form.currency ?? "NGN", onChange: (v) => update({
        currency: v
      }), options: [...CURRENCIES] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Speaking slots", type: "number", value: form.speaking_slots ?? "", onChange: (v) => update({
        speaking_slots: v ? Number(v) : null
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ChipMulti, { label: "Exposure channels offered", options: EXPOSURE_CHANNELS, value: form.exposure_channels ?? [], onChange: (v) => update({
      exposure_channels: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { label: "Speaking opportunities", checked: !!form.speaking_opps, onChange: (v) => update({
        speaking_opps: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { label: "Lead capture provided", checked: !!form.lead_capture, onChange: (v) => update({
        lead_capture: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { label: "Post-event report", checked: !!form.post_event_report, onChange: (v) => update({
        post_event_report: v
      }) })
    ] })
  ] });
}
function StepTiers({
  eventId,
  currency,
  tiers,
  editable
}) {
  const qc = useQueryClient();
  const upsert = useServerFn(upsertTier);
  const remove = useServerFn(deleteTier);
  const [draft, setDraft] = reactExports.useState({
    tier_name: "",
    price: "",
    slots_total: "1",
    is_exclusive: false,
    custom_options: ""
  });
  const upsertMut = useMutation({
    mutationFn: (payload) => upsert({
      data: payload
    }),
    onSuccess: (res) => {
      qc.setQueryData(["event", eventId], (old) => {
        if (!old) return old;
        const tiers2 = [...old.tiers ?? []];
        const idx = tiers2.findIndex((t) => t.id === res.tier.id);
        if (idx >= 0) tiers2[idx] = res.tier;
        else tiers2.push(res.tier);
        return {
          ...old,
          tiers: tiers2
        };
      });
      qc.invalidateQueries({
        queryKey: ["event", eventId]
      });
      setDraft({
        tier_name: "",
        price: "",
        slots_total: "1",
        is_exclusive: false,
        custom_options: ""
      });
      toast.success("Tier saved");
    },
    onError: (e) => toast.error(e.message)
  });
  const delMut = useMutation({
    mutationFn: (id) => remove({
      data: {
        id
      }
    }),
    onSuccess: (_res, tierId) => {
      qc.setQueryData(["event", eventId], (old) => {
        if (!old) return old;
        return {
          ...old,
          tiers: (old.tiers ?? []).filter((t) => t.id !== tierId)
        };
      });
      qc.invalidateQueries({
        queryKey: ["event", eventId]
      });
      toast.success("Tier removed");
    },
    onError: (e) => toast.error(e.message)
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
      tiers.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No tiers yet - add your first one below." }),
      tiers.map((t, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border bg-background p-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: t.tier_name }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
            t.currency,
            " ",
            Number(t.price).toLocaleString(),
            " · ",
            t.slots_total,
            " slot",
            t.slots_total === 1 ? "" : "s",
            t.is_exclusive && " · exclusive"
          ] })
        ] }),
        editable && /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => delMut.mutate(t.id), className: "rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "h-4 w-4" }) })
      ] }, t.id))
    ] }),
    editable && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-xl border border-dashed border-border p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-3 sm:grid-cols-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Tier name", value: draft.tier_name, onChange: (v) => setDraft({
          ...draft,
          tier_name: v
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: `Price (${currency})`, type: "number", value: draft.price, onChange: (v) => setDraft({
          ...draft,
          price: v
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Total slots", type: "number", value: draft.slots_total, onChange: (v) => setDraft({
          ...draft,
          slots_total: v
        }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 flex items-center justify-between gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { label: "Exclusive (single slot only)", checked: draft.is_exclusive, onChange: (v) => setDraft({
          ...draft,
          is_exclusive: v
        }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", disabled: upsertMut.isPending, onClick: () => {
          if (!draft.tier_name.trim() || !draft.price) return toast.error("Tier name and price required");
          upsertMut.mutate({
            event_id: eventId,
            tier_name: draft.tier_name.trim(),
            price: Number(draft.price),
            currency,
            slots_total: Number(draft.slots_total) || 1,
            is_exclusive: draft.is_exclusive,
            custom_options: draft.custom_options || null,
            display_order: tiers.length,
            assets: []
          });
        }, className: "inline-flex items-center gap-1 rounded-md bg-brand-gradient px-3 py-2 text-xs font-semibold text-white disabled:opacity-50", children: [
          upsertMut.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-3.5 w-3.5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "h-3.5 w-3.5" }),
          " Add tier"
        ] })
      ] })
    ] })
  ] });
}
function StepAssets({
  eventId,
  form,
  update
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(AssetUpload, { label: "Sponsorship deck (PDF)", accept: ".pdf", eventId, field: "sponsorship_deck_url", value: form.sponsorship_deck_url, update }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AssetUpload, { label: "Banner image", accept: "image/*", eventId, field: "banner_image_url", value: form.banner_image_url, update }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(AssetUpload, { label: "Floor plan (optional)", accept: "image/*,.pdf", eventId, field: "floor_plan_url", value: form.floor_plan_url, update })
  ] });
}
function AssetUpload({
  label,
  accept,
  eventId,
  field,
  value,
  update
}) {
  const [uploading, setUploading] = reactExports.useState(false);
  async function onFile(f) {
    if (!f) return;
    setUploading(true);
    try {
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("You must be signed in to upload files");
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${user.id}/${eventId}/${field}-${Date.now()}-${safeName}`;
      const {
        error
      } = await supabase.storage.from("event-assets").upload(path, f, {
        upsert: true,
        contentType: f.type || void 0
      });
      if (error) throw error;
      const {
        data: pub
      } = supabase.storage.from("event-assets").getPublicUrl(path);
      update({
        [field]: pub.publicUrl
      });
      toast.success(`${label} uploaded`);
    } catch (e) {
      toast.error(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mb-1.5 text-sm font-medium", children: label }),
    value ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: value, target: "_blank", rel: "noreferrer", className: "truncate text-primary hover:underline", children: value.split("/").pop() }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => update({
        [field]: null
      }), className: "rounded-md p-1 text-muted-foreground hover:bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: `flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-background p-6 text-sm text-muted-foreground hover:bg-muted ${uploading ? "opacity-60" : ""}`, children: [
      uploading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "h-4 w-4" }),
      uploading ? "Uploading…" : "Click to upload",
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", accept, className: "hidden", onChange: (e) => onFile(e.target.files?.[0] ?? null) })
    ] })
  ] });
}
function getSubmitBlockers(form, tierCount) {
  const blockers = [];
  if (!form.consent_given) blockers.push("Confirm the accuracy consent checkbox");
  if (!form.sponsorship_deck_url) blockers.push("Upload a sponsorship deck (PDF) in the Assets step");
  if (!form.banner_image_url) blockers.push("Upload a banner image in the Assets step");
  if (tierCount < 1) blockers.push("Add at least one sponsorship tier in the Tiers step");
  return blockers;
}
function StepReview({
  form,
  update,
  tierCount,
  onSubmit,
  submitting,
  editable
}) {
  const blockers = getSubmitBlockers(form, tierCount);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid gap-4 sm:grid-cols-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Field, { label: "Sponsorship deadline", type: "date", value: form.sponsorship_deadline ?? "", onChange: (v) => update({
        sponsorship_deadline: v
      }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectField, { label: "Payment terms", value: form.payment_terms ?? "", onChange: (v) => update({
        payment_terms: v
      }), options: PAYMENT_TERMS })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { label: "I'd like ABW to manage sponsorships on my behalf (optional)", checked: !!form.abw_management_requested, onChange: (v) => update({
      abw_management_requested: v
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Checkbox, { label: "I confirm I have the right to list this event and that the information provided is accurate.", checked: !!form.consent_given, onChange: (v) => update({
      consent_given: v
    }) }),
    blockers.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "Before you can submit:" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "mt-2 list-disc space-y-1 pl-5", children: blockers.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsx("li", { children: item }, item)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "rounded-md border border-border bg-muted/30 p-4 text-xs text-muted-foreground", children: "Submitting moves your event into IGE's vetting queue. You'll be notified by email when it's approved, listed, or sent back for revisions." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { type: "button", onClick: () => {
      if (blockers.length > 0) {
        toast.error(blockers[0]);
        return;
      }
      onSubmit();
    }, disabled: submitting || !editable || blockers.length > 0, className: "inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50", children: [
      submitting ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Send, { className: "h-4 w-4" }),
      "Submit for IGE vetting"
    ] })
  ] });
}
export {
  EventEditor as component
};
