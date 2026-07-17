import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mail, ShieldOff, UserCog, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { setUserSuspended } from "@/lib/admin.functions";
import { inviteSubAdmin, listSubAdmins, resendSubAdminInvite } from "@/lib/admin-team.functions";
import { ADMIN_PERMISSION_AUDIT } from "@/lib/admin-permissions";
import { DashboardPanel, DashboardTable, DashboardTableHead } from "@/components/dashboards/dashboard-shell";
import { DashboardTableSkeleton } from "@/components/dashboards/dashboard-skeletons";
import { Button } from "@/components/ui/button";
import { TextArea } from "@/components/signup/profile-fields";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type SubAdmin = {
  id: string;
  email: string | null;
  display_name: string | null;
  created_at: string;
  last_login_at: string | null;
  is_suspended: boolean;
};

export function AdminTeamPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [deactivateTarget, setDeactivateTarget] = useState<SubAdmin | null>(null);
  const [reason, setReason] = useState("");
  const invite = useServerFn(inviteSubAdmin);
  const resend = useServerFn(resendSubAdminInvite);
  const suspend = useServerFn(setUserSuspended);
  const fetchTeam = useServerFn(listSubAdmins);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-team"],
    queryFn: () => fetchTeam(),
  });

  const inviteMut = useMutation({
    mutationFn: () => invite({ data: { name: name.trim(), email: email.trim() } }),
    onSuccess: () => {
      toast.success("Sub-admin invited — they will receive login credentials by email");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
      setOpen(false);
      setName("");
      setEmail("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const resendMut = useMutation({
    mutationFn: (userId: string) => resend({ data: { user_id: userId } }),
    onSuccess: () => {
      toast.success("Invite email resent with a new temporary password");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const suspendMut = useMutation({
    mutationFn: (v: { user_id: string; suspended: boolean; reason?: string }) =>
      suspend({ data: v }),
    onSuccess: (_res, vars) => {
      toast.success(vars.suspended ? "Sub-admin account deactivated" : "Sub-admin account reactivated");
      qc.invalidateQueries({ queryKey: ["admin-team"] });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setDeactivateTarget(null);
      setReason("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const admins = (data?.admins ?? []) as SubAdmin[];

  return (
    <>
      <div className="space-y-6">
        <DashboardPanel title="Sub-admin permissions" description="What platform sub-admins can and cannot do.">
          <div className="grid gap-6 md:grid-cols-2 text-sm">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
              <h4 className="font-semibold text-foreground">Sub-admins can</h4>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
                {ADMIN_PERMISSION_AUDIT.sub_admin_can.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-5">
              <h4 className="font-semibold text-foreground">Super admin only</h4>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
                {ADMIN_PERMISSION_AUDIT.super_admin_only.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel
          title="Sub-admin accounts"
          description="Invite team members by name and email. Status stays Pending until their first sign-in."
          action={
            <Button type="button" className="bg-brand-gradient text-white" onClick={() => setOpen(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite sub-admin
            </Button>
          }
          bodyClassName="p-0"
        >
          {isLoading ? (
            <DashboardTableSkeleton rows={4} cols={5} />
          ) : !admins.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No sub-admins yet.</div>
          ) : (
            <DashboardTable>
              <DashboardTableHead>
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Last login</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </DashboardTableHead>
              <tbody className="divide-y divide-border/60">
                {admins.map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-3 font-medium">{a.display_name ?? "—"}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{a.email}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {a.last_login_at ? new Date(a.last_login_at).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {a.is_suspended ? (
                        <span className="font-medium text-destructive">Deactivated</span>
                      ) : a.last_login_at ? (
                        <span className="font-medium text-emerald-700">Active</span>
                      ) : (
                        <span className="font-medium text-amber-700">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {a.is_suspended ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={suspendMut.isPending}
                            onClick={() =>
                              suspendMut.mutate({ user_id: a.id, suspended: false })
                            }
                          >
                            Reactivate
                          </Button>
                        ) : (
                          <>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={resendMut.isPending || suspendMut.isPending}
                              onClick={() => resendMut.mutate(a.id)}
                            >
                              {resendMut.isPending && resendMut.variables === a.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <>
                                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                                  {a.last_login_at ? "Resend credentials" : "Resend invite"}
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              disabled={resendMut.isPending || suspendMut.isPending}
                              onClick={() => {
                                setDeactivateTarget(a);
                                setReason("");
                              }}
                            >
                              <ShieldOff className="mr-1.5 h-3.5 w-3.5" />
                              Deactivate
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </DashboardTable>
          )}
        </DashboardPanel>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite sub-admin</DialogTitle>
            <DialogDescription>
              They will receive an email with a temporary password and a link to sign in.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              inviteMut.mutate();
            }}
          >
            <div>
              <label className="mb-1.5 block text-sm font-medium">Full name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Email</label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={inviteMut.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMut.isPending} className="bg-brand-gradient text-white">
                {inviteMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send invite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Sheet open={!!deactivateTarget} onOpenChange={(o) => { if (!o) setDeactivateTarget(null); }}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5" /> Deactivate sub-admin
            </SheetTitle>
            <SheetDescription>{deactivateTarget?.email}</SheetDescription>
          </SheetHeader>
          {deactivateTarget && (
            <div className="mt-6 space-y-4">
              <TextArea
                label="Deactivation reason (shown to user)"
                rows={3}
                value={reason}
                onChange={setReason}
                placeholder="Breach of platform standards, unauthorised access…"
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={suspendMut.isPending}
                onClick={() =>
                  suspendMut.mutate({
                    user_id: deactivateTarget.id,
                    suspended: true,
                    reason: reason.trim() || "Deactivated by IGE admin",
                  })
                }
              >
                Confirm deactivation
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
