import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ExternalLink, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { InfoTip } from "@/components/info-tip";
import {
  IGE_LUMA_CALENDAR,
  adminDeleteHomeEvent,
  adminListHomeEvents,
  adminUpsertHomeEvent,
  type HomeEvent,
} from "@/lib/public-site.functions";

const input = "w-full rounded-md border border-input bg-background px-3 py-2 text-sm";
const local = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 16) : "");

/** Admin uploads the Upcoming IGE Featured Events shown on the public home page (TAB 6 §6.1C). */
export function HomeEventsAdminPage() {
  const qc = useQueryClient();
  const fetchAll = useServerFn(adminListHomeEvents);
  const save = useServerFn(adminUpsertHomeEvent);
  const remove = useServerFn(adminDeleteHomeEvent);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-home-events"],
    queryFn: () => fetchAll(),
  });
  const blank = {
    id: undefined as string | undefined,
    name: "",
    starts_at: "",
    city: "",
    cover_image_url: "",
    description: "",
    luma_url: "",
    source: "ige_abw" as "ige_abw" | "retainer_client",
    display_order: "0",
    publish_from: "",
    publish_to: "",
  };
  const [f, setF] = useState(blank);
  const [open, setOpen] = useState(false);

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: f.id,
          name: f.name.trim(),
          starts_at: f.starts_at,
          city: f.city.trim() || undefined,
          cover_image_url: f.cover_image_url.trim(),
          description: f.description.trim(),
          luma_url: f.luma_url.trim(),
          source: f.source,
          display_order: Number(f.display_order) || 0,
          publish_from: f.publish_from || null,
          publish_to: f.publish_to || null,
        },
      }),
    onSuccess: () => {
      toast.success("Saved — it shows on the home page within its publish window.");
      setOpen(false);
      setF(blank);
      qc.invalidateQueries({ queryKey: ["admin-home-events"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const edit = (e: HomeEvent) => {
    setF({
      id: e.id,
      name: e.name,
      starts_at: local(e.starts_at),
      city: e.city ?? "",
      cover_image_url: e.cover_image_url,
      description: e.description,
      luma_url: e.luma_url,
      source: e.source,
      display_order: String(e.display_order),
      publish_from: local(e.publish_from),
      publish_to: local(e.publish_to),
    });
    setOpen(true);
  };

  const now = Date.now();
  return (
    <WorkspacePage
      title="Home page events"
      subtitle="Upcoming IGE / ABW and retainer-client events shown to visitors, each with its Luma registration link."
      action={
        <Button
          onClick={() => {
            setF(blank);
            setOpen(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add event
        </Button>
      }
    >
      {open && (
        <DashboardPanel
          title={f.id ? "Edit event" : "New home page event"}
          action={<InfoTip tip="admin.home_events" />}
        >
          <form
            className="grid gap-3 md:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              mut.mutate();
            }}
          >
            <input
              required
              placeholder="Event name"
              value={f.name}
              onChange={(e) => setF({ ...f, name: e.target.value })}
              className={input}
            />
            <input
              required
              type="datetime-local"
              value={f.starts_at}
              onChange={(e) => setF({ ...f, starts_at: e.target.value })}
              aria-label="Date and time"
              className={input}
            />
            <input
              placeholder="City (leave blank for Virtual)"
              value={f.city}
              onChange={(e) => setF({ ...f, city: e.target.value })}
              className={input}
            />
            <select
              value={f.source}
              onChange={(e) => setF({ ...f, source: e.target.value as typeof f.source })}
              aria-label="Source"
              className={input}
            >
              <option value="ige_abw">IGE / ABW event</option>
              <option value="retainer_client">Retainer client event</option>
            </select>
            <input
              required
              type="url"
              placeholder="Cover image URL"
              value={f.cover_image_url}
              onChange={(e) => setF({ ...f, cover_image_url: e.target.value })}
              className={`${input} md:col-span-2`}
            />
            <input
              required
              maxLength={240}
              placeholder="One-line description"
              value={f.description}
              onChange={(e) => setF({ ...f, description: e.target.value })}
              className={`${input} md:col-span-2`}
            />
            <input
              required
              type="url"
              placeholder={`Luma event page (on ${IGE_LUMA_CALENDAR})`}
              value={f.luma_url}
              onChange={(e) => setF({ ...f, luma_url: e.target.value })}
              className={`${input} md:col-span-2`}
            />
            <label className="text-xs text-muted-foreground">
              Display order
              <input
                type="number"
                min={0}
                value={f.display_order}
                onChange={(e) => setF({ ...f, display_order: e.target.value })}
                className={input}
              />
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Show from
                <input
                  type="datetime-local"
                  value={f.publish_from}
                  onChange={(e) => setF({ ...f, publish_from: e.target.value })}
                  className={input}
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Hide after
                <input
                  type="datetime-local"
                  value={f.publish_to}
                  onChange={(e) => setF({ ...f, publish_to: e.target.value })}
                  className={input}
                />
              </label>
            </div>
            {f.source === "retainer_client" && (
              <p className="text-xs text-amber-700 dark:text-amber-300 md:col-span-2">
                Client events are always labelled “Client Event” so visitors never read the
                placement as IGE vetting or endorsement.
              </p>
            )}
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" disabled={mut.isPending}>
                {mut.isPending ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DashboardPanel>
      )}

      <DashboardPanel title="All home page events" bodyClassName="p-0">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : !data?.events.length ? (
          <p className="px-5 py-10 text-center text-sm text-muted-foreground">
            None yet. With none uploaded, the section does not appear on the home page.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {data.events.map((e) => {
              const past = Date.parse(e.starts_at) < now;
              return (
                <li key={e.id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                  <img src={e.cover_image_url} alt="" className="h-10 w-16 rounded object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{e.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {new Date(e.starts_at).toLocaleString()} · {e.city || "Virtual"} ·{" "}
                      {e.source === "ige_abw" ? "IGE / ABW" : "Client"} · order {e.display_order}
                    </span>
                  </span>
                  {past && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                      Ended — hidden
                    </span>
                  )}
                  <a
                    href={e.luma_url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Open Luma page"
                    className="text-muted-foreground hover:text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    aria-label={`Edit ${e.name}`}
                    onClick={() => edit(e)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${e.name}`}
                    onClick={() => {
                      if (confirm(`Remove ${e.name} from the home page?`)) {
                        remove({ data: { id: e.id } }).then(() =>
                          qc.invalidateQueries({ queryKey: ["admin-home-events"] }),
                        );
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </DashboardPanel>
    </WorkspacePage>
  );
}
