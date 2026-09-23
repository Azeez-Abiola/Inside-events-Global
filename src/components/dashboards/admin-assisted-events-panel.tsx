/**
 * Launch-phase assist flow: an admin builds a listing for an organiser who
 * reached out before signing up. The listing is owned by the organiser's own
 * account from the start; the claim invite is a separate, deliberate step so
 * their first sign-in lands on a finished listing.
 */
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Send, UserPlus, Pencil, CheckCircle2, Clock } from "lucide-react";
import { StatusBadge } from "@/components/app-shell";
import {
  DashboardPanel,
  DashboardTable,
  DashboardTableHead,
} from "@/components/dashboards/dashboard-shell";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  adminCreateEventForOrganiser,
  adminInviteOrganiser,
  adminListAssistedEvents,
  adminLookupOrganiser,
  type OrganiserLookup,
} from "@/lib/admin-events.functions";

type AssistedEvent = {
  id: string;
  name: string | null;
  status: string;
  city: string | null;
  country: string | null;
  organiser_id: string | null;
  created_at: string;
  organiser: {
    email: string | null;
    display_name: string | null;
    claimed: boolean;
    invite_sent_at: string | null;
  };
};

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminAssistedEventsPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const listFn = useServerFn(adminListAssistedEvents);
  const inviteFn = useServerFn(adminInviteOrganiser);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin", "assisted-events"],
    queryFn: () => listFn(),
  });
  const events = (data?.events ?? []) as AssistedEvent[];

  const inviteMut = useMutation({
    mutationFn: (user_id: string) => inviteFn({ data: { user_id } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "assisted-events"] });
      toast.success("Claim invite sent — the organiser can now sign in and take over the listing.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <DashboardPanel
        title="Listings created for organisers"
        description="Build a listing on an organiser's behalf, then invite them to claim it. The organiser owns it from the start."
        action={
          <Button
            type="button"
            size="sm"
            className="gap-1.5 bg-brand-gradient text-white"
            onClick={() => setOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            Create for an organiser
          </Button>
        }
        bodyClassName="p-0"
      >
        {isLoading ? (
          <DashboardTableSkeleton rows={3} cols={5} />
        ) : error ? (
          // Most likely cause: the migration adding created_by_admin hasn't run
          // yet. Say so rather than showing an empty state that looks fine.
          <div className="px-5 py-8 text-center text-sm">
            <p className="font-semibold text-foreground">Could not load admin-created listings.</p>
            <p className="mx-auto mt-1 max-w-md text-muted-foreground">
              {(error as Error).message}
            </p>
            <p className="mx-auto mt-2 max-w-md text-xs text-muted-foreground">
              If this mentions a missing column, run{" "}
              <code className="rounded bg-muted px-1 py-0.5">npm run db:admin-assisted-events</code>{" "}
              to apply the migration.
            </p>
          </div>
        ) : !events.length ? (
          <div className="px-5 py-10 text-center text-sm text-muted-foreground">
            No admin-created listings yet. Use “Create for an organiser” when someone reaches out
            before signing up.
          </div>
        ) : (
          <DashboardTable>
            <DashboardTableHead>
              <tr>
                <th className="px-5 py-3">Event</th>
                <th className="px-5 py-3">Organiser</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Account</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </DashboardTableHead>
            <tbody className="divide-y divide-border/60">
              {events.map((e) => (
                <tr key={e.id} className="hover:bg-muted/30">
                  <td className="px-5 py-3">
                    <div className="font-semibold text-foreground">
                      {e.name || "Untitled event"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {[e.city, e.country].filter(Boolean).join(", ") || "Location not set"} · added{" "}
                      {fmtDate(e.created_at)}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="text-foreground">{e.organiser.display_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{e.organiser.email ?? "—"}</div>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={e.status} />
                  </td>
                  <td className="px-5 py-3">
                    {e.organiser.claimed ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary-deep">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Claimed
                      </span>
                    ) : e.organiser.invite_sent_at ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                        <Clock className="h-3.5 w-3.5" />
                        Invited {fmtDate(e.organiser.invite_sent_at)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not invited yet</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-1.5" asChild>
                        <Link to="/events/edit/$id" params={{ id: e.id }}>
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </Link>
                      </Button>
                      {!e.organiser.claimed && e.organiser_id && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          disabled={inviteMut.isPending}
                          onClick={() => inviteMut.mutate(e.organiser_id as string)}
                        >
                          {inviteMut.isPending ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {e.organiser.invite_sent_at ? "Resend invite" : "Send invite"}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DashboardTable>
        )}
      </DashboardPanel>

      <CreateForOrganiserDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function CreateForOrganiserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const lookupFn = useServerFn(adminLookupOrganiser);
  const createFn = useServerFn(adminCreateEventForOrganiser);

  const [email, setEmail] = useState("");
  const [lookup, setLookup] = useState<OrganiserLookup | null>(null);
  const [orgName, setOrgName] = useState("");
  const [eventName, setEventName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");
  const [createdId, setCreatedId] = useState<string | null>(null);

  function reset() {
    setEmail("");
    setLookup(null);
    setOrgName("");
    setEventName("");
    setContactName("");
    setContactPhone("");
    setContactRole("");
    setCreatedId(null);
  }

  const lookupMut = useMutation({
    mutationFn: (value: string) => lookupFn({ data: { email: value } }) as Promise<OrganiserLookup>,
    onSuccess: (res) => {
      setLookup(res);
      if (res.state === "organiser" || res.state === "other_role") {
        setOrgName((prev) => prev || res.org_name || res.display_name || "");
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const createMut = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          email: email.trim(),
          org_name: orgName.trim(),
          event_name: eventName.trim() || undefined,
          contact_name: contactName.trim() || undefined,
          contact_phone: contactPhone.trim() || undefined,
          contact_role: contactRole.trim() || undefined,
          allow_add_role: lookup?.state === "other_role",
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["admin", "assisted-events"] });
      qc.invalidateQueries({ queryKey: ["admin", "vetting"] });
      setCreatedId(res.event_id);
      toast.success(
        res.account_created
          ? "Organiser account created and draft listing opened."
          : "Draft listing created under the existing organiser account.",
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canCreate =
    lookup !== null &&
    lookup.state !== "staff" &&
    orgName.trim().length > 0 &&
    !createMut.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a listing for an organiser</DialogTitle>
          <DialogDescription>
            We&apos;ll set the listing up under the organiser&apos;s own account so every future
            sponsor inquiry, deal and payout reaches them — not IGE.
          </DialogDescription>
        </DialogHeader>

        {createdId ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-brand-soft/40 p-4 text-sm">
              <p className="font-semibold text-foreground">Draft created.</p>
              <p className="mt-1 text-muted-foreground">
                Build out the listing now. When it&apos;s ready, send the organiser their claim
                invite from the table.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button asChild className="bg-brand-gradient text-white">
                <Link to="/events/edit/$id" params={{ id: createdId }}>
                  Open the event editor
                </Link>
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!lookup) {
                if (email.trim()) lookupMut.mutate(email.trim());
                return;
              }
              createMut.mutate();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">
                Organiser email
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setLookup(null);
                  }}
                  placeholder="organiser@example.com"
                  className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={!email.trim() || lookupMut.isPending}
                  onClick={() => lookupMut.mutate(email.trim())}
                >
                  {lookupMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Check"}
                </Button>
              </div>
            </div>

            {lookup && <LookupNotice lookup={lookup} />}

            {lookup && lookup.state !== "staff" && (
              <>
                <TextInput
                  label="Organisation name"
                  value={orgName}
                  onChange={setOrgName}
                  required
                />
                <TextInput
                  label="Event name"
                  value={eventName}
                  onChange={setEventName}
                  placeholder="You can rename this later in the editor"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <TextInput label="Contact name" value={contactName} onChange={setContactName} />
                  <TextInput label="Contact role" value={contactRole} onChange={setContactRole} />
                </div>
                <TextInput label="Contact phone" value={contactPhone} onChange={setContactPhone} />
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canCreate}
                className="bg-brand-gradient text-white gap-1.5"
              >
                {createMut.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <UserPlus className="h-4 w-4" />
                )}
                Create draft listing
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LookupNotice({ lookup }: { lookup: OrganiserLookup }) {
  if (lookup.state === "new") {
    return (
      <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        No IGE account yet — we&apos;ll create one for this organiser. They can&apos;t sign in until
        you send the claim invite.
      </p>
    );
  }
  if (lookup.state === "staff") {
    return (
      <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-foreground">
        That email belongs to an IGE admin account. Use the organiser&apos;s own address instead.
      </p>
    );
  }
  if (lookup.state === "organiser") {
    return (
      <p className="rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2 text-xs text-foreground">
        Existing organiser{lookup.org_name ? ` — ${lookup.org_name.replace(/\.$/, "")}` : ""}. The
        listing will be added to their account
        {lookup.claimed
          ? ", which is already active — they'll see it straight away."
          : ". They haven't signed in yet, so send them the claim invite once it's ready."}
      </p>
    );
  }
  return (
    <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-foreground">
      This account exists as {lookup.roles.join(", ") || "another role"}. Creating the listing will
      also grant them the organiser role.
    </p>
  );
}

function TextInput({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </label>
      <input
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  );
}
