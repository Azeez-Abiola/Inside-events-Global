import { useMemo, useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Mail, Plus, Send, Users, ArrowLeft, Link2, ImageIcon, Save, Trash2, FileEdit, Upload, X, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { KpiTile } from "@/components/dashboards/voom-primitives";
import { DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { DashboardDataToolbar } from "@/components/dashboards/dashboard-data-toolbar";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { useTableFilters } from "@/hooks/use-table-filters";
import { datedCsvFilename, downloadCsv } from "@/lib/csv-export";
import {
  listNewsletterSubscribers,
  saveNewsletterDraft,
  sendNewsletterCampaign,
  deleteNewsletterCampaign,
} from "@/lib/newsletter.functions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StatusPill } from "@/components/dashboards/shared";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  status: string;
  subscribed_at: string;
};

type Campaign = {
  id: string;
  subject: string;
  thumbnail_url: string | null;
  body_html: string;
  links: { label: string; url: string }[] | null;
  status: string;
  recipient_count: number;
  sent_at: string | null;
  created_at: string;
  updated_at?: string;
};

type LinkRow = { label: string; url: string };

function exportSubscribersCsv(rows: Subscriber[]) {
  downloadCsv(
    datedCsvFilename("ige-newsletter-subscribers"),
    ["email", "name", "source", "subscribed_at"],
    rows.map((r) => [r.email, r.name ?? "", r.source, r.subscribed_at]),
  );
}

function normalizeHttpUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function payloadLinks(links: LinkRow[]) {
  return links
    .filter((l) => l.label.trim() && l.url.trim())
    .map((l) => ({ label: l.label.trim(), url: normalizeHttpUrl(l.url) }));
}

function emptyForm() {
  return {
    id: null as string | null,
    subject: "",
    thumbnailUrl: "",
    body: "",
    links: [{ label: "", url: "" }] as LinkRow[],
  };
}

export function AdminNewsletterPanel() {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const canSend = isSuperAdmin(roles);
  const fetch = useServerFn(listNewsletterSubscribers);
  const saveDraft = useServerFn(saveNewsletterDraft);
  const send = useServerFn(sendNewsletterCampaign);
  const removeDraft = useServerFn(deleteNewsletterCampaign);

  const [view, setView] = useState<"list" | "compose" | "send">("list");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(emptyForm);
  const [isResend, setIsResend] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-newsletter"],
    queryFn: () => fetch(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin-newsletter"] });

  const saveMut = useMutation({
    mutationFn: () =>
      saveDraft({
        data: {
          id: form.id,
          subject: form.subject.trim(),
          thumbnail_url: form.thumbnailUrl.trim() || null,
          body_html: form.body.trim(),
          links: payloadLinks(form.links),
        },
      }),
    onSuccess: (res) => {
      setForm((f) => ({ ...f, id: res.campaign.id }));
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const sendMut = useMutation({
    mutationFn: () => {
      if (selected.size === 0) throw new Error("Select at least one subscriber");
      if (form.id) {
        return send({
          data: {
            campaign_id: form.id,
            subscriber_ids: Array.from(selected),
            resend: isResend,
          },
        });
      }
      return send({
        data: {
          subject: form.subject.trim(),
          thumbnail_url: form.thumbnailUrl.trim() || null,
          body_html: form.body.trim(),
          links: payloadLinks(form.links),
          subscriber_ids: Array.from(selected),
        },
      });
    },
    onSuccess: (res) => {
      toast.success(
        res.resent
          ? `Resent to ${res.sent} subscriber${res.sent === 1 ? "" : "s"}`
          : `Newsletter sent to ${res.sent} subscriber${res.sent === 1 ? "" : "s"}`,
      );
      if (res.skipped) toast.message(`${res.skipped} skipped (suppressed or blocked)`);
      if (res.queueFlush?.error) {
        toast.error(`Queued, but delivery failed: ${res.queueFlush.error}`);
      } else if (typeof res.queueFlush?.processed === "number") {
        toast.message(
          res.queueFlush.processed > 0
            ? `Delivered ${res.queueFlush.processed} email(s) via Resend`
            : "Queue was empty — check spam or Resend logs if nothing arrives",
        );
      }
      invalidate();
      setForm(emptyForm());
      setSelected(new Set());
      setIsResend(false);
      setView("list");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => removeDraft({ data: { id } }),
    onSuccess: () => {
      toast.success("Draft deleted");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const subscribers = data?.subscribers ?? [];
  const campaigns = (data?.campaigns ?? []) as Campaign[];
  const drafts = campaigns.filter((c) => c.status === "draft");
  const sent = campaigns.filter((c) => c.status === "sent");

  const filtered = useTableFilters({
    rows: subscribers,
    searchText: search,
    search: (s) => [s.email, s.name, s.source].filter(Boolean).join(" "),
  });

  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  function toggleAll(checked: boolean) {
    if (checked) setSelected(new Set(filtered.map((s) => s.id)));
    else setSelected(new Set());
  }

  function toggleOne(id: string, checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  function openCreate() {
    setForm(emptyForm());
    setIsResend(false);
    setView("compose");
  }

  function openEditDraft(c: Campaign) {
    setIsResend(false);
    setForm({
      id: c.id,
      subject: c.subject,
      thumbnailUrl: c.thumbnail_url ?? "",
      body: c.body_html ?? "",
      links: c.links?.length ? c.links : [{ label: "", url: "" }],
    });
    setView("compose");
  }

  function openSendDraft(c: Campaign) {
    setIsResend(false);
    setForm({
      id: c.id,
      subject: c.subject,
      thumbnailUrl: c.thumbnail_url ?? "",
      body: c.body_html ?? "",
      links: c.links?.length ? c.links : [{ label: "", url: "" }],
    });
    setSelected(new Set());
    setView("send");
  }

  function openResend(c: Campaign) {
    setIsResend(true);
    setForm({
      id: c.id,
      subject: c.subject,
      thumbnailUrl: c.thumbnail_url ?? "",
      body: c.body_html ?? "",
      links: c.links?.length ? c.links : [{ label: "", url: "" }],
    });
    setSelected(new Set());
    setView("send");
  }

  const recentMonth = useMemo(() => {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return subscribers.filter((s) => new Date(s.subscribed_at).getTime() >= cutoff).length;
  }, [subscribers]);

  const canSave =
    form.subject.trim().length >= 3 && form.body.trim().length >= 3 && !saveMut.isPending;
  const composeHint =
    form.subject.trim().length < 3
      ? "Add a subject (at least 3 characters)."
      : form.body.trim().length < 3
        ? "Add a bit more content (at least 3 characters)."
        : null;

  if (view === "compose") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => setView("list")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <p className="text-sm text-muted-foreground">
            {form.id ? "Editing draft — save without sending, or send to subscribers next." : "Create a newsletter draft. You can send it later to selected subscribers."}
          </p>
        </div>

        <ComposeForm
          form={form}
          setForm={setForm}
          actions={
            <div className="space-y-2">
              {composeHint ? <p className="text-xs text-amber-600 dark:text-amber-400">{composeHint}</p> : null}
              <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={!canSave}
                onClick={() =>
                  saveMut.mutate(undefined, {
                    onSuccess: () => {
                      toast.success(form.id ? "Draft updated" : "Newsletter saved as draft");
                      setView("list");
                    },
                  })
                }
              >
                <Save className="mr-2 h-4 w-4" />
                {saveMut.isPending ? "Saving…" : "Save draft"}
              </Button>
              {canSend ? (
                <Button
                  type="button"
                  disabled={!canSave}
                  onClick={() => {
                    if (!form.id) {
                      saveMut.mutate(undefined, {
                        onSuccess: () => {
                          toast.success("Draft saved — pick subscribers to send");
                          setView("send");
                        },
                      });
                      return;
                    }
                    saveMut.mutate(undefined, {
                      onSuccess: () => setView("send"),
                    });
                  }}
                >
                  <Send className="mr-2 h-4 w-4" /> Continue to send
                </Button>
              ) : (
                <p className="self-center text-xs text-muted-foreground">Only super admins can send campaigns.</p>
              )}
              </div>
            </div>
          }
        />
      </div>
    );
  }

  if (view === "send" && !canSend) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Only super admins can send newsletter campaigns.</p>
        <Button type="button" variant="outline" onClick={() => setView("list")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to newsletters
        </Button>
      </div>
    );
  }

  if (view === "send") {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button type="button" variant="outline" onClick={() => { setIsResend(false); setView(form.id && !isResend ? "compose" : "list"); }}>
            <ArrowLeft className="mr-2 h-4 w-4" /> {isResend ? "Back" : "Back to editor"}
          </Button>
          <p className="text-sm text-muted-foreground">
            {isResend ? "Resending" : "Sending"}:{" "}
            <span className="font-semibold text-foreground">{form.subject || "Untitled"}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
          <h4 className="mt-2 font-display text-lg font-bold">{form.subject}</h4>
          <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">{form.body}</p>
        </div>

        <DashboardPanel
          title="Select recipients"
          description="Choose who should receive this newsletter."
          bodyClassName="p-0"
        >
          <DashboardDataToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search email or name…"
            onExport={() => exportSubscribersCsv(filtered)}
            exportDisabled={!filtered.length}
            exportCount={filtered.length}
          />
          {isLoading ? (
            <DashboardTableSkeleton rows={6} cols={4} />
          ) : (
            <DashboardTable className="min-w-[640px]">
              <DashboardTableHead>
                <tr>
                  <th className="w-10 px-4 py-3">
                    <Checkbox checked={allSelected} onCheckedChange={(v) => toggleAll(!!v)} aria-label="Select all" />
                  </th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Source</th>
                </tr>
              </DashboardTableHead>
              <tbody className="divide-y divide-border/60">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-muted/10">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={(v) => toggleOne(s.id, !!v)}
                        aria-label={`Select ${s.email}`}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.name ?? "—"}</td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{s.source.replace(/_/g, " ")}</td>
                  </tr>
                ))}
                {!filtered.length && (
                  <tr>
                    <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                      No subscribers yet. Save as draft and send when people join.
                    </td>
                  </tr>
                )}
              </tbody>
            </DashboardTable>
          )}
        </DashboardPanel>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={sendMut.isPending || selected.size === 0}
            onClick={() => sendMut.mutate()}
          >
            <Send className="mr-2 h-4 w-4" />
            {sendMut.isPending
              ? isResend ? "Resending…" : "Sending…"
              : `${isResend ? "Resend" : "Send"} to ${selected.size} subscriber${selected.size === 1 ? "" : "s"}`}
          </Button>
          {!isResend ? (
          <Button
            type="button"
            variant="outline"
            disabled={!canSave}
            onClick={() =>
              saveMut.mutate(undefined, {
                onSuccess: () => {
                  toast.success("Draft saved");
                  setView("list");
                },
              })
            }
          >
            <Save className="mr-2 h-4 w-4" /> Save draft instead
          </Button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiTile icon={Users} label="Active subscribers" value={subscribers.length} loading={isLoading} />
        <KpiTile icon={Mail} label="New (30 days)" value={recentMonth} loading={isLoading} />
        <KpiTile icon={FileEdit} label="Drafts" value={drafts.length} loading={isLoading} />
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" /> Create newsletter
        </Button>
      </div>

      {drafts.length > 0 && (
        <DashboardPanel title="Drafts" description="Saved newsletters ready to edit or send." bodyClassName="p-0">
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Updated</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {drafts.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.subject}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(c.updated_at ?? c.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3"><StatusPill status="draft" /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="outline" onClick={() => openEditDraft(c)}>
                        Edit
                      </Button>
                      {canSend && (
                        <Button type="button" size="sm" onClick={() => openSendDraft(c)}>
                          Send
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={deleteMut.isPending}
                        onClick={() => {
                          if (confirm("Delete this draft?")) deleteMut.mutate(c.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DashboardTable>
        </DashboardPanel>
      )}

      <DashboardPanel title="Subscribers" description="Homepage newsletter signups." bodyClassName="p-0">
        <DashboardDataToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search email or name…"
          onExport={() => exportSubscribersCsv(filtered)}
          exportDisabled={!filtered.length}
          exportCount={filtered.length}
        />
        {isLoading ? (
          <DashboardTableSkeleton rows={8} cols={4} />
        ) : (
          <DashboardTable className="min-w-[640px]">
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Subscribed</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-muted/10">
                  <td className="px-4 py-3 font-medium text-foreground">{s.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.name ?? "—"}</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{s.source.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {new Date(s.subscribed_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                    No subscribers yet — they will appear when visitors subscribe on the homepage.
                  </td>
                </tr>
              )}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>

      {sent.length > 0 && (
        <DashboardPanel title="Sent campaigns" description="Newsletters already delivered. Resend to pick subscribers again." bodyClassName="p-0">
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3">Sent</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {sent.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.subject}</td>
                  <td className="px-4 py-3">{c.recipient_count}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {c.sent_at ? new Date(c.sent_at).toLocaleString() : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {canSend ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => openResend(c)}>
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                        Resend
                      </Button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DashboardTable>
        </DashboardPanel>
      )}
    </div>
  );
}

function ComposeForm({
  form,
  setForm,
  actions,
}: {
  form: ReturnType<typeof emptyForm>;
  setForm: React.Dispatch<React.SetStateAction<ReturnType<typeof emptyForm>>>;
  actions: React.ReactNode;
}) {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function onThumbnailFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file (JPG, PNG, WebP, or GIF).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    if (!user?.id) {
      toast.error("You must be signed in to upload images.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/newsletter/thumb-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("event-assets").upload(path, file, {
        upsert: true,
        contentType: file.type,
      });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("event-assets").getPublicUrl(path);
      setForm((f) => ({ ...f, thumbnailUrl: pub.publicUrl }));
      toast.success("Thumbnail uploaded — it will appear in the email.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-5 lg:col-span-3">
        <div className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <h3 className="font-display text-lg font-bold">Compose newsletter</h3>
          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Subject line</span>
            <Input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="What's new at IGE…"
            />
          </label>

          <div className="block text-sm">
            <span className="mb-1.5 flex items-center gap-1.5 font-medium">
              <ImageIcon className="h-3.5 w-3.5" /> Thumbnail image
            </span>
            <p className="mb-2 text-xs text-muted-foreground">
              Upload an image to show at the top of the email (max 5 MB).
            </p>
            {form.thumbnailUrl ? (
              <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                <img src={form.thumbnailUrl} alt="Newsletter thumbnail" className="max-h-48 w-full object-cover" />
                <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
                  <span className="truncate text-xs text-muted-foreground">Image attached</span>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                      Replace
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => setForm((f) => ({ ...f, thumbnailUrl: "" }))}
                      aria-label="Remove thumbnail"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/20 px-4 py-10 text-sm text-muted-foreground transition-colors hover:bg-muted/40 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                {uploading ? "Uploading…" : "Click to upload thumbnail"}
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => void onThumbnailFile(e.target.files?.[0] ?? null)}
            />
          </div>

          <label className="block text-sm">
            <span className="mb-1.5 block font-medium">Newsletter content</span>
            <Textarea
              rows={12}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder="Write your update. Use blank lines between paragraphs."
            />
          </label>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                <Link2 className="h-3.5 w-3.5" /> Call-to-action links
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "" }] }))}
              >
                Add link
              </Button>
            </div>
            {form.links.map((link, i) => (
              <div key={i} className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Button label"
                  value={link.label}
                  onChange={(e) => {
                    const next = [...form.links];
                    next[i] = { ...next[i], label: e.target.value };
                    setForm((f) => ({ ...f, links: next }));
                  }}
                />
                <Input
                  placeholder="insideglobalevents.com or https://…"
                  type="text"
                  inputMode="url"
                  autoComplete="url"
                  value={link.url}
                  onChange={(e) => {
                    const next = [...form.links];
                    next[i] = { ...next[i], url: e.target.value };
                    setForm((f) => ({ ...f, links: next }));
                  }}
                />
              </div>
            ))}
          </div>
          {actions}
        </div>
      </div>

      <div className="lg:col-span-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email preview</p>
          {form.thumbnailUrl ? (
            <img src={form.thumbnailUrl} alt="" className="mt-3 w-full rounded-xl border border-border object-cover" />
          ) : null}
          <h4 className="mt-4 font-display text-base font-bold">{form.subject || "Subject line"}</h4>
          <div className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">
            {form.body || "Newsletter content…"}
          </div>
          {form.links.filter((l) => l.label && l.url).map((l) => (
            <div key={l.url} className="mt-3 inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-xs font-bold text-white">
              {l.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
