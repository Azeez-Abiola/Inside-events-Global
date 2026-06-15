import { j as jsxRuntimeExports } from "../_libs/react.mjs";
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type,
        required,
        value,
        placeholder,
        onChange: (e) => onChange(e.target.value),
        className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      }
    )
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
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "textarea",
      {
        rows,
        value,
        placeholder,
        onChange: (e) => onChange(e.target.value),
        className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      }
    )
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
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "select",
      {
        value,
        onChange: (e) => onChange(e.target.value),
        className: "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: "", children: "Select…" }),
          options.map((o) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: o, children: o }, o))
        ]
      }
    )
  ] });
}
function Checkbox({
  label,
  checked,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "flex cursor-pointer items-center gap-2.5 text-sm", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "input",
      {
        type: "checkbox",
        checked,
        onChange: (e) => onChange(e.target.checked),
        className: "h-4 w-4 rounded border-input"
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: label })
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
      return /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: () => onChange(on ? value.filter((x) => x !== o) : [...value, o]),
          className: `rounded-full border px-3 py-1 text-xs font-medium transition-colors ${on ? "border-primary bg-brand-soft text-primary-deep" : "border-border bg-card text-muted-foreground hover:bg-muted"}`,
          children: o
        },
        o
      );
    }) })
  ] });
}
export {
  Checkbox as C,
  Field as F,
  SelectField as S,
  TextArea as T,
  ChipMulti as a
};
