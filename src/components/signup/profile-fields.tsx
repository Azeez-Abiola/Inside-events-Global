import { countWords } from "@/lib/onboarding-text";

export function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  /** Shows a live counter and stops typing at the limit (TAB 3 §3.9). */
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
        <span>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </span>
        {maxLength != null && (
          <span
            className={`text-xs font-normal ${
              value.length >= maxLength ? "text-destructive" : "text-muted-foreground"
            }`}
          >
            {value.length.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        )}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
  maxLength,
  maxWords,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  /** Word limit with a live counter, blocked at the limit (TAB 3 §3.9). */
  maxWords?: number;
  hint?: string;
}) {
  const words = maxWords != null ? countWords(value) : 0;
  const atWordLimit = maxWords != null && words >= maxWords;

  /**
   * "Blocked at the limit" has to allow shortening, otherwise someone who
   * pastes an over-long description can never edit their way back under it.
   */
  function handleChange(next: string) {
    if (maxWords != null && countWords(next) > maxWords && next.length > value.length) return;
    onChange(next);
  }

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium">
        <span>{label}</span>
        {maxWords != null ? (
          <span
            className={`text-xs font-normal ${atWordLimit ? "text-destructive" : "text-muted-foreground"}`}
          >
            {words.toLocaleString()} / {maxWords.toLocaleString()} words
          </span>
        ) : maxLength != null ? (
          <span
            className={`text-xs font-normal ${value.length >= maxLength ? "text-destructive" : "text-muted-foreground"}`}
          >
            {value.length.toLocaleString()} / {maxLength.toLocaleString()}
          </span>
        ) : null}
      </span>
      <textarea
        rows={rows}
        value={value}
        placeholder={placeholder}
        maxLength={maxLength}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-input"
      />
      <span>{label}</span>
    </label>
  );
}

export function ChipMulti({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = value.includes(o);
          return (
            <button
              type="button"
              key={o}
              onClick={() => onChange(on ? value.filter((x) => x !== o) : [...value, o])}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                on
                  ? "border-primary bg-brand-soft text-primary-deep"
                  : "border-border bg-card text-muted-foreground hover:bg-muted"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}
