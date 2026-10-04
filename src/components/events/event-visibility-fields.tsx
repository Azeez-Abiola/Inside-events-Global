import { InfoTip } from "@/components/info-tip";
import { CONNECT_WITH_OPTIONS, connectWithLabel } from "@/lib/connect-with";

/**
 * Event visibility and Looking to connect with
 * (TAB 3 §3.6.1 Section B, v6.3/v6.4; Version 1.1 Section A).
 *
 * Shared between the organiser event editor and the admin create-for-organiser
 * form so the two cannot drift. `form` and `update` follow the editor's
 * existing untyped patch shape.
 */

interface Props {
  form: Record<string, unknown>;
  update: (patch: Record<string, unknown>) => void;
}

export function EventVisibilityFields({ form, update }: Props) {
  const visibility = (form.visibility as string) ?? "published";
  const selected = (form.looking_to_connect_with as string[] | null) ?? [];
  const notes = (form.connection_notes as Record<string, string> | null) ?? {};
  const isPrivate = visibility === "private";

  function toggle(value: string) {
    const next = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    update({
      looking_to_connect_with: next,
      // Drop the note for a type that was just deselected, so a stale line
      // never travels with a connection nobody asked for.
      connection_notes: Object.fromEntries(Object.entries(notes).filter(([k]) => next.includes(k))),
    });
  }

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground">Event visibility</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          <VisibilityOption
            checked={isPrivate}
            onSelect={() => update({ visibility: "private" })}
            title="Private"
            body="Workspace only. Not on the marketplace and not vetted. Use IGE to plan and manage it. You can publish it later."
          />
          <VisibilityOption
            checked={!isPrivate}
            onSelect={() => update({ visibility: "published" })}
            title="Published to the marketplace"
            body="Goes to Admin vetting. Once approved it is live and visible to signed-in users."
          />
        </div>
      </fieldset>

      <div>
        <div className="mb-1 flex items-center text-sm font-medium text-foreground">
          Looking to connect with
          {!isPrivate && <span className="ml-1 text-destructive">*</span>}
          <InfoTip tip="field.looking_to_connect" />
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          {isPrivate
            ? "Optional while the event is private — you choose these when you publish it."
            : "Pick one or more. These appear as labels on your event card."}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {CONNECT_WITH_OPTIONS.map((opt) => {
            const on = selected.includes(opt.value);
            return (
              <button
                type="button"
                key={opt.value}
                aria-pressed={on}
                onClick={() => toggle(opt.value)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  on
                    ? "border-primary bg-brand-soft text-primary-deep"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {selected.length > 0 && (
        <div>
          <div className="mb-1 flex items-center text-sm font-medium text-foreground">
            What you want from each connection
            <InfoTip tip="field.connection_notes" />
          </div>
          <div className="space-y-2">
            {selected.map((value) => (
              <div key={value}>
                <label
                  htmlFor={`connect-note-${value}`}
                  className="mb-1 block text-xs text-muted-foreground"
                >
                  {connectWithLabel(value)}
                </label>
                <input
                  id={`connect-note-${value}`}
                  type="text"
                  maxLength={300}
                  value={notes[value] ?? ""}
                  onChange={(e) =>
                    update({ connection_notes: { ...notes, [value]: e.target.value } })
                  }
                  placeholder="Optional — e.g. media partner to deliver a 60-second highlight video"
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={!!form.open_to_cocreation}
          onChange={(e) => update({ open_to_cocreation: e.target.checked })}
          className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
        />
        <span>
          <span className="flex items-center font-medium">
            Open to early co-creation with brands
            <InfoTip tip="field.early_cocreation" />
          </span>
          <span className="block text-xs text-muted-foreground">
            Shows this event on the Forward Events Calendar so brands can get involved at the
            planning stage.
          </span>
        </span>
      </label>
    </div>
  );
}

function VisibilityOption({
  checked,
  onSelect,
  title,
  body,
}: {
  checked: boolean;
  onSelect: () => void;
  title: string;
  body: string;
}) {
  return (
    <label
      className={`flex cursor-pointer gap-2 rounded-lg border p-3 transition-colors ${
        checked ? "border-primary bg-brand-soft" : "border-border bg-card hover:bg-muted"
      }`}
    >
      <input
        type="radio"
        name="event-visibility"
        checked={checked}
        onChange={onSelect}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
      />
      <span className="min-w-0">
        <span className="block text-sm font-medium text-foreground">{title}</span>
        <span className="block text-xs leading-relaxed text-muted-foreground">{body}</span>
      </span>
    </label>
  );
}
