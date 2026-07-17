import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Copy, Loader2, Mail, MessageSquareWarning } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { submitAccountComplaint } from "@/lib/complaints.functions";
import { IGE_SUPPORT_EMAIL, IGE_SUPPORT_MAILTO } from "@/lib/support-email";
import { roleLabel } from "@/lib/dashboard-meta";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const ROLE_OPTIONS = [
  { value: "organiser", label: "Event Organiser" },
  { value: "sponsor", label: "Brand / Sponsor" },
  { value: "referral_partner", label: "Referral Partner" },
  { value: "media_partner", label: "Media Partner" },
];

export function SuspendedAccountGate({ children }: { children: React.ReactNode }) {
  const { isSuspended, suspensionReason, roles, signOut, loading } = useAuth();
  const [complaintOpen, setComplaintOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitComplaint = useServerFn(submitAccountComplaint);

  const userRoles = roles.filter((r) => ROLE_OPTIONS.some((o) => o.value === r));
  const defaultRole = userRoles[0] ?? "organiser";
  const activeRole = selectedRole || defaultRole;

  if (loading || !isSuspended) return <>{children}</>;

  async function handleSubmitComplaint(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 20) {
      toast.error("Please describe your issue in at least 20 characters.");
      return;
    }
    setSubmitting(true);
    try {
      await submitComplaint({ data: { role: activeRole, message: message.trim() } });
      toast.success("Your message was sent to the IGE team. We'll respond by email.");
      setComplaintOpen(false);
      setMessage("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not send your message");
    } finally {
      setSubmitting(false);
    }
  }

  async function copySupportEmail() {
    try {
      await navigator.clipboard.writeText(IGE_SUPPORT_EMAIL);
      toast.success("Support email copied");
    } catch {
      toast.error("Could not copy — use hi@insideglobalevents.com");
    }
  }

  return (
    <>
      <div className="pointer-events-none opacity-40 blur-[1px] select-none" aria-hidden>
        {children}
      </div>

      <AlertDialog open onOpenChange={() => {}}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <MessageSquareWarning className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-center">Your account has been deactivated</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-center text-sm text-muted-foreground">
                <p>
                  {suspensionReason ??
                    "Your IGE account is no longer active. You cannot access the dashboard or marketplace."}
                </p>
                <p>
                  Contact our support team at{" "}
                  <a href={IGE_SUPPORT_MAILTO} className="font-semibold text-primary hover:underline">
                    {IGE_SUPPORT_EMAIL}
                  </a>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button type="button" variant="outline" className="gap-2" onClick={() => void copySupportEmail()}>
              <Copy className="h-4 w-4" />
              Copy email
            </Button>
            <Button type="button" variant="outline" className="gap-2" asChild>
              <a href={IGE_SUPPORT_MAILTO}>
                <Mail className="h-4 w-4" />
                Email support
              </a>
            </Button>
            <Button type="button" className="gap-2 bg-brand-gradient text-white" onClick={() => setComplaintOpen(true)}>
              Contact support
            </Button>
          </div>

          <AlertDialogFooter className="sm:justify-center">
            <Button type="button" variant="ghost" onClick={() => void signOut()}>
              Sign out
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={complaintOpen} onOpenChange={setComplaintOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contact IGE support</DialogTitle>
            <DialogDescription>
              Tell us why you believe your account was deactivated. Our team will review your message and reply to{" "}
              your account email.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleSubmitComplaint(e)} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Your role on IGE</label>
              <select
                value={activeRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              >
                {(userRoles.length ? ROLE_OPTIONS.filter((o) => userRoles.includes(o.value as typeof roles[number])) : ROLE_OPTIONS).map(
                  (o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ),
                )}
              </select>
              {userRoles.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Signed in as {roleLabel(userRoles)}</p>
              )}
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground">Your message</label>
              <textarea
                required
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Explain your situation or appeal…"
                className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setComplaintOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="bg-brand-gradient text-white">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send to support"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
