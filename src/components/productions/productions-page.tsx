import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Check, Clapperboard, ExternalLink, Loader2, Plus, Send, Trash2, X } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import { ChipMulti, Field, SelectField, TextArea } from "@/components/signup/profile-fields";
import { fmtMoney } from "@/lib/currency";
import { ONBOARDING_COUNTRIES } from "@/lib/onboarding-constants";
import {
  deletePlacement,
  deleteProduction,
  getMyProductions,
  publishProduction,
  upsertPlacement,
  upsertProduction,
  type Placement,
  type Production,
} from "@/lib/productions.functions";

const FORMATS = [
  "Feature film",
  "TV series",
  "Web series",
  "Short film",
  "Documentary",
  "Music video",
  "Album or single",
  "Podcast",
  "Stage play",
  "Exhibition",
  "Social content series",
  "Other",
];
const STAGES = ["Development", "Pre-production", "In production", "Post-production", "Released"];
const PLATFORMS = [
  "YouTube",
  "Instagram",
  "TikTok",
  "Cinema/theatrical",
  "Streaming platform",
  "Gallery/physical space",
  "Live performance",
];
const PLACEMENT_KINDS = [
  "Product placement on screen",
  "Brand integration in storyline",
  "Title or presenting sponsor",
  "Co-branded content",
  "Premiere or launch event sponsorship",
  "Merchandise",
  "Other",
];
const CURRENCIES = ["NGN", "USD", "GBP", "EUR"];

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  draft: { label: "Private", cls: "bg-muted text-muted-foreground" },
  submitted: { label: "Submitted", cls: "bg-primary/10 text-primary-deep" },
  under_review: {
    label: "Under review",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  approved_live: { label: "Approved and live", cls: "bg-secondary/15 text-secondary-deep" },
  changes_requested: {
    label: "Changes requested",
    cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  rejected: { label: "Not approved", cls: "bg-destructive/10 text-destructive" },
  past: { label: "Past", cls: "bg-muted text-muted-foreground" },
};

function ProductionEditor({
  production,
  draft,
  onClose,
  onSaved,
}: {
  production: Production | null;
  draft?: Partial<Production> | null;
  onClose: () => void;
  onSaved: (id: string) => void;
}) {
  const save = useServerFn(upsertProduction);
  const src = production ?? draft ?? {};
  const [f, setF] = useState({
    title: src.title ?? "",
    format: src.format ?? "",
    stage: src.stage ?? "",
    logline: src.logline ?? "",
    release_window: src.release_window ?? "",
    platforms: src.platforms ?? [],
    target_markets: src.target_markets ?? [],
    amount_sought: src.amount_sought != null ? String(src.amount_sought) : "",
    currency: src.currency ?? "NGN",
    cover_image_url: src.cover_image_url ?? "",
    pitch_deck_url: production?.pitch_deck_url ?? "",
  });
  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: production?.id,
          title: f.title.trim(),
          format: f.format || undefined,
          stage: f.stage || undefined,
          logline: f.logline.trim() || undefined,
          release_window: f.release_window.trim() || undefined,
          platforms: f.platforms,
          target_markets: f.target_markets,
          amount_sought: f.amount_sought ? Number(f.amount_sought) : null,
          currency: f.currency,
          cover_image_url: f.cover_image_url.trim(),
          pitch_deck_url: f.pitch_deck_url.trim(),
        },
      }),
    onSuccess: (r) => {
      toast.success("Production saved");
      onSaved(r.id);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside
        onClick={(e) => e.stopPropagation()}
        className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-brand"
        role="dialog"
        aria-label="Production"
      >
        <div className="mb-5 flex items-start justify-between">
          <h2 className="font-display text-xl font-bold">
            {production ? production.title : "New production"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!f.title.trim()) return toast.error("Give the production a title.");
            mut.mutate();
          }}
        >
          <Field
            label="Production or project title"
            value={f.title}
            onChange={(v) => setF({ ...f, title: v })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Format"
              value={f.format}
              onChange={(v) => setF({ ...f, format: v })}
              options={FORMATS}
            />
            <SelectField
              label="Stage"
              value={f.stage}
              onChange={(v) => setF({ ...f, stage: v })}
              options={STAGES}
            />
          </div>
          <TextArea
            label="Logline"
            value={f.logline}
            onChange={(v) => setF({ ...f, logline: v })}
            rows={3}
          />
          <Field
            label="Expected release window and platform"
            value={f.release_window}
            onChange={(v) => setF({ ...f, release_window: v })}
            placeholder="e.g. Cinema Q2 2027"
          />
          <ChipMulti
            label="Platforms"
            options={PLATFORMS}
            value={f.platforms}
            onChange={(v) => setF({ ...f, platforms: v })}
          />
          <ChipMulti
            label="Target audience and markets"
            options={[...ONBOARDING_COUNTRIES, "Global"]}
            value={f.target_markets}
            onChange={(v) => setF({ ...f, target_markets: v })}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Currency"
              value={f.currency}
              onChange={(v) => setF({ ...f, currency: v })}
              options={CURRENCIES}
            />
            <Field
              label="Sponsorship sought"
              type="number"
              value={f.amount_sought}
              onChange={(v) => setF({ ...f, amount_sought: v })}
            />
          </div>
          <Field
            label="Cover image link"
            type="url"
            value={f.cover_image_url}
            onChange={(v) => setF({ ...f, cover_image_url: v })}
          />
          <label className="block">
            <span className="mb-1.5 flex items-center text-sm font-medium">
              Pitch deck or script extract (link)
              <InfoTip tip="productions.pitch_deck" />
            </span>
            <input
              type="url"
              value={f.pitch_deck_url}
              onChange={(e) => setF({ ...f, pitch_deck_url: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm focus:ring-2 focus:ring-ring"
            />
          </label>
          <Button type="submit" className="w-full" disabled={mut.isPending}>
            {mut.isPending ? "Saving…" : production ? "Save changes" : "Create production"}
          </Button>
        </form>
      </aside>
    </div>
  );
}

function PlacementRow({ p, onChanged }: { p: Placement; onChanged: () => void }) {
  const save = useServerFn(upsertPlacement);
  const remove = useServerFn(deletePlacement);
  const [proof, setProof] = useState(p.proof_url ?? "");
  const update = (
    patch: Partial<Pick<Placement, "slots_filled" | "brand_label" | "deliverable_due" | "proof_url">> & {
      delivered?: boolean;
    },
  ) => {
    const merged = { ...p, ...patch };
    return save({
      data: {
        id: p.id,
        production_id: p.production_id,
        kind: p.kind,
        description: p.description ?? undefined,
        price: p.price,
        currency: p.currency,
        slots_total: p.slots_total,
        slots_filled: merged.slots_filled,
        brand_label: merged.brand_label ?? undefined,
        deliverable_due: merged.deliverable_due,
        proof_url: merged.proof_url ?? "",
        delivered: patch.delivered ?? !!p.delivered_at,
      },
    })
      .then(onChanged)
      .catch((e: Error) => toast.error(e.message));
  };
  return (
    <li className="space-y-2 rounded-lg border border-border p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-foreground">{p.kind}</span>
        {p.price != null && (
          <span className="text-xs text-muted-foreground">{fmtMoney(p.currency, p.price)}</span>
        )}
        <span className="ml-auto flex items-center gap-1 text-xs">
          <button
            type="button"
            aria-label="One fewer filled"
            onClick={() => update({ slots_filled: Math.max(0, p.slots_filled - 1) })}
            className="rounded border border-border px-1.5"
          >
            −
          </button>
          <span className="tabular-nums">
            {p.slots_filled} of {p.slots_total} filled
          </span>
          <button
            type="button"
            aria-label="One more filled"
            disabled={p.slots_filled >= p.slots_total}
            onClick={() => update({ slots_filled: p.slots_filled + 1 })}
            className="rounded border border-border px-1.5 disabled:opacity-40"
          >
            +
          </button>
        </span>
        <button
          type="button"
          aria-label={`Delete ${p.kind}`}
          onClick={() =>
            remove({ data: { id: p.id, production_id: p.production_id } }).then(onChanged)
          }
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
      {p.slots_filled > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md bg-muted/30 p-2 text-xs">
          <input
            defaultValue={p.brand_label ?? ""}
            onBlur={(e) =>
              e.target.value !== (p.brand_label ?? "") && update({ brand_label: e.target.value })
            }
            placeholder="Promised to (brand)"
            className="w-36 rounded border border-border bg-background px-2 py-1"
          />
          <input
            type="date"
            defaultValue={p.deliverable_due ?? ""}
            onBlur={(e) => update({ deliverable_due: e.target.value || null })}
            aria-label="Deliverable due"
            className="rounded border border-border bg-background px-2 py-1"
          />
          <input
            type="url"
            value={proof}
            onChange={(e) => setProof(e.target.value)}
            placeholder="Proof link"
            className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1"
          />
          <Button
            size="sm"
            variant={p.delivered_at ? "outline" : "default"}
            onClick={() => update({ proof_url: proof, delivered: !p.delivered_at })}
            disabled={!p.delivered_at && !proof}
          >
            <Check className="mr-1 h-3 w-3" />
            {p.delivered_at ? "Delivered" : "Mark delivered"}
          </Button>
        </div>
      )}
    </li>
  );
}

function NewPlacement({
  productionId,
  currency,
  onChanged,
}: {
  productionId: string;
  currency: string;
  onChanged: () => void;
}) {
  const save = useServerFn(upsertPlacement);
  const [kind, setKind] = useState(PLACEMENT_KINDS[0]);
  const [price, setPrice] = useState("");
  const [slots, setSlots] = useState("1");
  const [desc, setDesc] = useState("");
  return (
    <div className="grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-5">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value)}
        aria-label="Placement type"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs sm:col-span-2"
      >
        {PLACEMENT_KINDS.map((k) => (
          <option key={k}>{k}</option>
        ))}
      </select>
      <input
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder={`Price (${currency})`}
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      />
      <input
        type="number"
        min={1}
        value={slots}
        onChange={(e) => setSlots(e.target.value)}
        placeholder="Slots"
        aria-label="Slots"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs"
      />
      <Button
        size="sm"
        onClick={() =>
          save({
            data: {
              production_id: productionId,
              kind,
              description: desc.trim() || undefined,
              price: price ? Number(price) : null,
              currency,
              slots_total: Number(slots) || 1,
            },
          })
            .then(() => {
              setPrice("");
              setDesc("");
              onChanged();
            })
            .catch((e: Error) => toast.error(e.message))
        }
      >
        <Plus className="mr-1 h-3.5 w-3.5" />
        Add
      </Button>
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="What the brand gets (optional)"
        className="rounded-md border border-border bg-background px-2 py-1.5 text-xs sm:col-span-5"
      />
    </div>
  );
}

/** My Productions and their Placement Opportunities (TAB 5 §5.6). */
export function ProductionsPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(getMyProductions);
  const publish = useServerFn(publishProduction);
  const remove = useServerFn(deleteProduction);
  const { data, isLoading } = useQuery({ queryKey: ["my-productions"], queryFn: () => fetchAll() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["my-productions"] });
  const [editing, setEditing] = useState<Production | null>(null);
  const [creating, setCreating] = useState<Partial<Production> | null | false>(false);

  if (isLoading) {
    return (
      <WorkspacePage title="My Productions">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </WorkspacePage>
    );
  }
  const productions = data?.productions ?? [];
  const placements = data?.placements ?? [];

  return (
    <WorkspacePage
      title="My Productions"
      subtitle="List your productions and the brand placement and sponsorship opportunities inside them."
      action={
        <Button onClick={() => setCreating(null)}>
          <Plus className="mr-2 h-4 w-4" />
          New production
        </Button>
      }
    >
      {data?.onboardingDraft && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-primary/30 bg-brand-soft p-4 text-sm">
          <Clapperboard className="h-5 w-5 text-primary" />
          <span className="flex-1">
            You told us about <strong>{data.onboardingDraft.title}</strong> during onboarding.
          </span>
          <Button
            size="sm"
            onClick={() => setCreating(data.onboardingDraft as Partial<Production>)}
          >
            Set it up here
          </Button>
        </div>
      )}

      {productions.length === 0 ? (
        <DashboardPanel title="No productions yet">
          <p className="text-sm text-muted-foreground">
            Add a film, series, show or project, then the placement opportunities brands could take
            up. Keep it private while you plan; publish it when you are ready for IGE to vet it and
            show it to brands.
          </p>
        </DashboardPanel>
      ) : (
        <div className="space-y-5">
          {productions.map((p) => {
            const mine = placements.filter((x) => x.production_id === p.id);
            const st = STATUS_LABEL[p.listing_status] ?? STATUS_LABEL.draft;
            const filled = mine.reduce((n, x) => n + x.slots_filled, 0);
            const total = mine.reduce((n, x) => n + x.slots_total, 0);
            const raised = mine.reduce((n, x) => n + (x.price ?? 0) * x.slots_filled, 0);
            return (
              <DashboardPanel
                key={p.id}
                title={p.title}
                description={[p.format, p.stage, p.release_window].filter(Boolean).join(" · ")}
                action={
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${st.cls}`}
                    >
                      {st.label}
                    </span>
                    <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
                      Edit
                    </Button>
                    {p.visibility === "private" || p.listing_status === "changes_requested" ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          publish({ data: { id: p.id, publish: true } })
                            .then(() => {
                              toast.success("Sent to IGE for vetting");
                              refresh();
                            })
                            .catch((e: Error) => toast.error(e.message))
                        }
                      >
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Publish for sponsorship
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          publish({ data: { id: p.id, publish: false } }).then(refresh)
                        }
                      >
                        Make private
                      </Button>
                    )}
                    <button
                      type="button"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => {
                        if (confirm(`Delete ${p.title}?`))
                          remove({ data: { id: p.id } }).then(refresh);
                      }}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                }
              >
                {p.reviewer_notes && p.listing_status !== "approved_live" && (
                  <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
                    IGE: {p.reviewer_notes}
                  </p>
                )}
                <div className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                  <span>
                    {filled} of {total} placement slots filled
                  </span>
                  {p.amount_sought != null && (
                    <span>
                      {fmtMoney(p.currency, raised)} raised of{" "}
                      {fmtMoney(p.currency, p.amount_sought)} sought
                    </span>
                  )}
                  {p.pitch_deck_url && (
                    <a
                      href={p.pitch_deck_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      Pitch deck <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <p className="mb-2 flex items-center text-xs font-semibold text-foreground">
                  Placement opportunities
                  <InfoTip tip="productions.placements" />
                </p>
                <ul className="mb-3 space-y-2">
                  {mine.map((x) => (
                    <PlacementRow key={x.id} p={x} onChanged={refresh} />
                  ))}
                </ul>
                <NewPlacement productionId={p.id} currency={p.currency} onChanged={refresh} />
              </DashboardPanel>
            );
          })}
        </div>
      )}

      {(editing || creating !== false) && (
        <ProductionEditor
          production={editing}
          draft={creating || null}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            refresh();
          }}
        />
      )}
    </WorkspacePage>
  );
}
