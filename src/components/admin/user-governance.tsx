import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import {
  Download,
  Eye,
  Loader2,
  LogOut,
  Merge,
  Pencil,
  ShieldAlert,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import { WorkspacePage } from "@/components/dashboards/workspace-page";
import { DashboardPanel } from "@/components/dashboards/dashboard-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { isSuperAdmin } from "@/lib/admin-permissions";
import { fmtMoney } from "@/lib/currency";
import {
  adminEditUserRecord,
  adminUploadForUser,
  decideDualControl,
  enterActAsUser,
  getEditableUserRecord,
  getUserSnapshot,
  listDualControlRequests,
  requestActAsUser,
  type EditField,
} from "@/lib/admin-governance.functions";
import {
  exportUserData,
  findMergeTarget,
  forceSignOut,
  mergeAccounts,
  requestErasure,
} from "@/lib/account-lifecycle.functions";

const human = (k: string) => k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const cell = "w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm";

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(",")[1] ?? "");
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

function FieldInput({
  field,
  value,
  onChange,
  onUpload,
}: {
  field: EditField;
  value: string;
  onChange: (v: string) => void;
  onUpload: (f: File) => void;
}) {
  if (field.kind === "bool") {
    return (
      <select value={value} onChange={(e) => onChange(e.target.value)} className={cell}>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (field.kind === "json" || field.kind === "list" || value.length > 80) {
    return (
      <textarea
        rows={field.kind === "json" ? 4 : 2}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${cell} ${field.kind === "json" ? "font-mono text-xs" : ""}`}
        placeholder={field.kind === "list" ? "One per line" : undefined}
      />
    );
  }
  return (
    <div className="flex gap-2">
      <input
        type={field.kind === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cell}
      />
      {field.file && (
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-1 rounded-md border border-border px-2 text-xs hover:border-primary">
          <Upload className="h-3.5 w-3.5" /> Upload
          <input
            type="file"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

/** Admin edits a user's record on their behalf (TAB 6 §6.2.2). */
export function UserRecordPage({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const fetchRecord = useServerFn(getEditableUserRecord);
  const save = useServerFn(adminEditUserRecord);
  const upload = useServerFn(adminUploadForUser);
  const askActAs = useServerFn(requestActAsUser);
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user-record", userId],
    queryFn: () => fetchRecord({ data: { user_id: userId } }),
  });
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState<string | null>("profiles");
  const [actReason, setActReason] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  const original = useMemo(() => {
    const m: Record<string, string> = {};
    for (const s of data?.sections ?? [])
      for (const f of s.fields) m[`${s.key}::${f.name}`] = f.value;
    return m;
  }, [data]);
  const changed = Object.entries(edits).filter(([k, v]) => original[k] !== v);
  const vettingTouched = changed.some(([k]) =>
    data?.sections.some((s) => s.fields.some((f) => `${s.key}::${f.name}` === k && f.vetting)),
  );

  const mut = useMutation({
    mutationFn: () =>
      save({
        data: {
          user_id: userId,
          reason,
          changes: changed.map(([k, value]) => {
            const [section, field] = k.split("::");
            return { section, field, value };
          }),
        },
      }),
    onSuccess: (r) => {
      toast.success(
        `Saved ${r.changed} change${r.changed === 1 ? "" : "s"}. The user has been told.${r.revetting ? ` ${r.revetting} event${r.revetting === 1 ? "" : "s"} flagged for re-vetting.` : ""}`,
      );
      setEdits({});
      setReason("");
      qc.invalidateQueries({ queryKey: ["admin-user-record", userId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const actMut = useMutation({
    mutationFn: () => askActAs({ data: { user_id: userId, reason: actReason } }),
    onSuccess: () => {
      toast.success("Request sent. A second Super Admin must approve it on the Users page.");
      setActReason("");
      qc.invalidateQueries({ queryKey: ["dual-control"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const doUpload = async (key: string, file: File) => {
    if (file.size > 10 * 1024 * 1024) return toast.error("Files must be 10 MB or smaller.");
    setUploading(key);
    try {
      const { url } = await upload({
        data: {
          user_id: userId,
          filename: file.name,
          content_type: file.type,
          base64: await readBase64(file),
        },
      });
      setEdits((e) => ({ ...e, [key]: url }));
      toast.success("Uploaded. Save to put it on their record.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <WorkspacePage
      title="Edit user record"
      subtitle="Every change is logged with before and after values, and the user is told exactly what changed and why."
      action={
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/view-as/$userId" params={{ userId }}>
            <Eye className="mr-1.5 h-4 w-4" /> View as User
          </Link>
        </Button>
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{(error as Error).message}</p>
      ) : (
        <div className="space-y-4">
          {data?.sections.map((s) => (
            <DashboardPanel
              key={s.key}
              title={s.label}
              action={
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpen(open === s.key ? null : s.key)}
                >
                  {open === s.key ? "Close" : "Edit"}
                </Button>
              }
            >
              {open === s.key ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {s.fields.map((f) => {
                    const k = `${s.key}::${f.name}`;
                    const v = edits[k] ?? f.value;
                    return (
                      <label key={k} className="block text-xs">
                        <span className="mb-1 flex items-center gap-1.5 font-medium text-muted-foreground">
                          {human(f.name)}
                          {f.vetting && (
                            <span className="rounded bg-amber-100 px-1 text-[10px] text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              vetting
                            </span>
                          )}
                          {original[k] !== v && (
                            <span className="text-[10px] text-primary">changed</span>
                          )}
                          {uploading === k && <Loader2 className="h-3 w-3 animate-spin" />}
                        </span>
                        <FieldInput
                          field={f}
                          value={v}
                          onChange={(nv) => setEdits((e) => ({ ...e, [k]: nv }))}
                          onUpload={(file) => void doUpload(k, file)}
                        />
                      </label>
                    );
                  })}
                  {!s.fields.length && (
                    <p className="text-sm text-muted-foreground">Nothing editable here.</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {s.fields.length} editable field{s.fields.length === 1 ? "" : "s"}
                </p>
              )}
            </DashboardPanel>
          ))}

          <div className="sticky bottom-4 z-10 rounded-xl border border-border bg-card p-4 shadow-lg">
            <p className="text-sm font-semibold">
              {changed.length} unsaved change{changed.length === 1 ? "" : "s"}
            </p>
            {vettingTouched && (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                This touches vetting data. Any approved or listed event will be flagged for
                re-vetting.
              </p>
            )}
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why are you making this change? The user sees this."
              className={`${cell} mt-2`}
            />
            <Button
              className="mt-2"
              disabled={!changed.length || reason.trim().length < 5 || mut.isPending}
              onClick={() => mut.mutate()}
            >
              <Pencil className="mr-1.5 h-4 w-4" /> Save and notify user
            </Button>
          </div>

          <DashboardPanel
            title="Act as User"
            description="For changes you can't make from this page. A second Super Admin must approve it first; the user is told when it's used."
          >
            <textarea
              rows={2}
              value={actReason}
              onChange={(e) => setActReason(e.target.value)}
              placeholder="What do you need to do as this user, and why?"
              className={cell}
            />
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={actReason.trim().length < 10 || actMut.isPending}
              onClick={() => actMut.mutate()}
            >
              <UserCog className="mr-1.5 h-4 w-4" /> Request Act as User
            </Button>
          </DashboardPanel>

          <AccountActions userId={userId} />
        </div>
      )}
    </WorkspacePage>
  );
}

/** Read-only shadow of a user's dashboard (TAB 6 §6.2.4). */
export function ViewAsUserPage({ userId }: { userId: string }) {
  const fetchSnap = useServerFn(getUserSnapshot);
  const {
    data: s,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-view-as", userId],
    queryFn: () => fetchSnap({ data: { user_id: userId } }),
  });
  if (isLoading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  if (error || !s)
    return <p className="text-sm text-destructive">{(error as Error)?.message ?? "Not found"}</p>;
  const List = ({ items, empty }: { items: string[]; empty: string }) =>
    items.length ? (
      <ul className="divide-y divide-border text-sm">
        {items.map((t, i) => (
          <li key={i} className="py-2">
            {t}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-sm text-muted-foreground">{empty}</p>
    );
  return (
    <div className="space-y-4">
      <div
        role="status"
        className="flex flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
      >
        <span className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> You are viewing as {s.name}, read only
        </span>
        <Link to="/dashboard/user-record/$userId" params={{ userId }} className="text-xs underline">
          Edit record instead
        </Link>
      </div>
      <WorkspacePage
        title={s.name}
        subtitle={`${s.email ?? ""} · ${s.roles.join(", ") || "no role"} · joined ${new Date(s.joined).toLocaleDateString()} · ${s.suspended ? "suspended" : s.active ? "active" : "pending approval"}`}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardPanel title="Events">
            <List
              items={s.events.map(
                (e) =>
                  `${e.name} · ${e.status}${e.start_date ? ` · ${new Date(e.start_date).toLocaleDateString()}` : ""}${e.attendance_size ? ` · ${e.attendance_size.toLocaleString()} expected` : ""}`,
              )}
              empty="No events."
            />
          </DashboardPanel>
          <DashboardPanel title="Deals">
            <List
              items={s.deals.map(
                (d) =>
                  `${d.event ?? "Deal"} · ${d.status.replace(/_/g, " ")} · ${d.value != null ? fmtMoney(d.currency ?? "USD", d.value) : "no value"} · as ${d.side}`,
              )}
              empty="No deals."
            />
          </DashboardPanel>
          <DashboardPanel title="Budgets">
            <List
              items={s.budgets.map((b) => `${b.market} · ${fmtMoney(b.currency, b.total)} a year`)}
              empty="No market budgets."
            />
          </DashboardPanel>
          <DashboardPanel title="Matches">
            <List
              items={s.matches.map(
                (m) => `${m.pairing_type.replace(/_/g, " ")} · ${m.status} · ${m.total}`,
              )}
              empty="No matches."
            />
          </DashboardPanel>
          <DashboardPanel title="Payments">
            <List
              items={s.payments.map(
                (p) => `${p.direction} · ${p.status} · ${fmtMoney(p.currency, p.amount)}`,
              )}
              empty="No payments recorded."
            />
          </DashboardPanel>
          <DashboardPanel title="Other">
            <List
              items={[
                `Brand-Readiness: ${s.readiness ?? "—"}`,
                `Workspaces: ${s.workspaces.map((w) => `${w.name} (${w.role})`).join(", ") || "—"}`,
                `Message IGE threads: ${s.inboxThreads}`,
                `Last sign-in: ${s.lastLogin ? new Date(s.lastLogin).toLocaleString() : "—"}`,
              ]}
              empty=""
            />
          </DashboardPanel>
          <DashboardPanel title="Recent notifications">
            <List
              items={s.notifications.map(
                (n) => `${new Date(n.created_at).toLocaleDateString()} · ${n.title}`,
              )}
              empty="None."
            />
          </DashboardPanel>
        </div>
      </WorkspacePage>
    </div>
  );
}

/** Dual control queue for Act as User (TAB 6 §6.9). */
export function DualControlPanel() {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const superAdmin = isSuperAdmin(roles);
  const list = useServerFn(listDualControlRequests);
  const decide = useServerFn(decideDualControl);
  const enter = useServerFn(enterActAsUser);
  const { data } = useQuery({ queryKey: ["dual-control"], queryFn: () => list() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["dual-control"] });
  const decideMut = useMutation({
    mutationFn: (v: { id: string; approve: boolean; action: string }) =>
      decide({ data: { id: v.id, approve: v.approve } }),
    onSuccess: (_r, v) => {
      toast.success(
        !v.approve
          ? "Denied."
          : v.action === "act_as_user"
            ? "Approved for 30 minutes."
            : "Approved and carried out.",
      );
      refresh();
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const enterMut = useMutation({
    mutationFn: (id: string) => enter({ data: { id } }),
    onSuccess: async ({ url }) => {
      refresh();
      try {
        await navigator.clipboard.writeText(url);
        toast.success(
          "Single-use sign-in link copied. Paste it into a private window so your own session stays signed in.",
          { duration: 10000 },
        );
      } catch {
        window.prompt("Open this single-use link in a private window:", url);
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const open = (data ?? []).filter(
    (r) =>
      r.status === "pending" || (r.action === "act_as_user" && r.status === "approved" && r.mine),
  );
  if (!open.length) return null;
  return (
    <DashboardPanel
      title="Waiting for a second Super Admin"
      description="Dual control: suspending an account, Act as User, Managed Service matches and data erasure only happen once a second Super Admin approves."
    >
      <ul className="divide-y divide-border text-sm">
        {open.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div>
              <p className="font-medium text-foreground">
                {r.action_label}: {r.target_name}
              </p>
              <p className="text-xs text-muted-foreground">Asked by {r.requester_name}</p>
              <p className="text-xs text-muted-foreground">{r.reason}</p>
              {r.status === "approved" && r.expires_at && (
                <p className="text-xs text-secondary-deep">
                  Approved by {r.decided_by_name}, usable until{" "}
                  {new Date(r.expires_at).toLocaleTimeString()}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {r.status === "pending" && superAdmin && !r.mine && (
                <>
                  <Button
                    size="sm"
                    disabled={decideMut.isPending}
                    onClick={() => {
                      if (
                        r.action === "act_as_user" ||
                        confirm(
                          `Approve "${r.action_label}" for ${r.target_name}? It takes effect now.`,
                        )
                      )
                        decideMut.mutate({ id: r.id, approve: true, action: r.action });
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={decideMut.isPending}
                    onClick={() => decideMut.mutate({ id: r.id, approve: false, action: r.action })}
                  >
                    Deny
                  </Button>
                </>
              )}
              {r.status === "pending" && (r.mine || !superAdmin) && (
                <span className="text-xs text-muted-foreground">
                  Waiting for a second Super Admin
                </span>
              )}
              {r.status === "approved" && r.mine && (
                <Button
                  size="sm"
                  disabled={enterMut.isPending}
                  onClick={() => {
                    if (confirm("Enter Act as User? This is logged and the user is told."))
                      enterMut.mutate(r.id);
                  }}
                >
                  Get sign-in link
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}

/**
 * Admin Actions (TAB 6 §6.2.2): force sign-out, GDPR/NDPR export and
 * erasure, and merging a duplicate account into this one.
 */
function AccountActions({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { roles } = useAuth();
  const superAdmin = isSuperAdmin(roles);
  const signOut = useServerFn(forceSignOut);
  const exportData = useServerFn(exportUserData);
  const erase = useServerFn(requestErasure);
  const find = useServerFn(findMergeTarget);
  const merge = useServerFn(mergeAccounts);
  const [eraseReason, setEraseReason] = useState("");
  const [dupEmail, setDupEmail] = useState("");
  const [dup, setDup] = useState<{
    id: string;
    name: string;
    email: string | null;
    created_at: string;
  } | null>(null);
  const [mergeReason, setMergeReason] = useState("");

  const signOutMut = useMutation({
    mutationFn: () => signOut({ data: { user_id: userId } }),
    onSuccess: (r) =>
      toast.success(
        `Signed out of ${r.sessions} session${r.sessions === 1 ? "" : "s"}. Any open tab loses access within the hour.`,
      ),
    onError: (e: Error) => toast.error(e.message),
  });
  const exportMut = useMutation({
    mutationFn: () => exportData({ data: { user_id: userId } }),
    onSuccess: ({ json }) => {
      const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `ige-user-export-${userId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded. Send it to the person through a secure channel.");
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const eraseMut = useMutation({
    mutationFn: () => erase({ data: { user_id: userId, reason: eraseReason } }),
    onSuccess: () => {
      setEraseReason("");
      toast.success(
        "Erasure request sent. A second Super Admin must approve it on the Users page.",
      );
      qc.invalidateQueries({ queryKey: ["dual-control"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const findMut = useMutation({
    mutationFn: () => find({ data: { email: dupEmail } }),
    onSuccess: (r) => {
      if (!r) toast.error("No account with that email.");
      else if (r.id === userId) toast.error("That's this account. Enter the duplicate's email.");
      else setDup(r);
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const mergeMut = useMutation({
    mutationFn: () =>
      merge({ data: { from_user_id: dup!.id, into_user_id: userId, reason: mergeReason } }),
    onSuccess: (r) => {
      toast.success(
        `Merged. ${r.moved} records moved${r.kept ? `, ${r.kept} kept on the closed duplicate (they clashed with this account)` : ""}.`,
      );
      setDup(null);
      setDupEmail("");
      setMergeReason("");
      qc.invalidateQueries({ queryKey: ["admin-user-record", userId] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <DashboardPanel title="Account actions" description="Each is logged in the Audit Log.">
      <div className="space-y-5 text-sm">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={signOutMut.isPending}
            onClick={() => {
              if (confirm("Sign this person out everywhere?")) signOutMut.mutate();
            }}
          >
            <LogOut className="mr-1.5 h-4 w-4" /> Force sign out
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={exportMut.isPending}
            onClick={() => exportMut.mutate()}
          >
            <Download className="mr-1.5 h-4 w-4" /> Export their data (GDPR / NDPR)
          </Button>
        </div>

        {superAdmin && (
          <div className="space-y-2 border-t border-border pt-4">
            <p className="font-medium text-foreground">Merge a duplicate into this account</p>
            <p className="text-xs text-muted-foreground">
              Everything on the duplicate moves here; the duplicate is closed. This can't be undone.
            </p>
            {!dup ? (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={dupEmail}
                  onChange={(e) => setDupEmail(e.target.value)}
                  placeholder="Duplicate account's email"
                  className={cell}
                />
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!dupEmail.includes("@") || findMut.isPending}
                  onClick={() => findMut.mutate()}
                >
                  Find
                </Button>
              </div>
            ) : (
              <div className="space-y-2 rounded-lg border border-border p-3">
                <p>
                  Duplicate: <span className="font-medium">{dup.name}</span> ({dup.email}), joined{" "}
                  {new Date(dup.created_at).toLocaleDateString()}
                </p>
                <textarea
                  rows={2}
                  value={mergeReason}
                  onChange={(e) => setMergeReason(e.target.value)}
                  placeholder="Why are these the same person?"
                  className={cell}
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={mergeReason.trim().length < 5 || mergeMut.isPending}
                    onClick={() => {
                      if (
                        confirm(`Move everything from ${dup.email} into this account and close it?`)
                      )
                        mergeMut.mutate();
                    }}
                  >
                    <Merge className="mr-1.5 h-4 w-4" /> Merge
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setDup(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-4">
          <p className="font-medium text-destructive">Erase personal data</p>
          <p className="text-xs text-muted-foreground">
            For a GDPR / NDPR erasure request. Removes their personal details and closes the account
            for good; deal and payment records are kept pseudonymised, as the law requires. A second
            Super Admin must approve.
          </p>
          <textarea
            rows={2}
            value={eraseReason}
            onChange={(e) => setEraseReason(e.target.value)}
            placeholder="How and when did the person ask?"
            className={cell}
          />
          <Button
            size="sm"
            variant="destructive"
            disabled={eraseReason.trim().length < 10 || eraseMut.isPending}
            onClick={() => eraseMut.mutate()}
          >
            <Trash2 className="mr-1.5 h-4 w-4" /> Request erasure
          </Button>
        </div>
      </div>
    </DashboardPanel>
  );
}
