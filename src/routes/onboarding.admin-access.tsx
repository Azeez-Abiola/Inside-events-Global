import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { Field, TextArea } from "@/components/signup/profile-fields";
import { submitAdminAccessRequest } from "@/lib/admin-access.functions";
import { ADMIN_EMAIL_DOMAINS } from "@/lib/admin-domains";

/**
 * Admin access request (TAB 3 §3.6.7).
 *
 * "Selecting 'IGE Admin' on the role-select screen routes the user to a short
 *  access-request form instead. An existing super-admin reviews and grants
 *  access manually."
 *
 * Four fields and a consent box — deliberately short, because this is a
 * request for a decision, not a profile.
 */
export const Route = createFileRoute("/onboarding/admin-access")({
  head: () => ({ meta: [{ title: "Request admin access - IGE" }] }),
  component: AdminAccessRequestPage,
});

function AdminAccessRequestPage() {
  const navigate = useNavigate();
  const submit = useServerFn(submitAdminAccessRequest);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [roleAtOrg, setRoleAtOrg] = useState("");
  const [reason, setReason] = useState("");
  const [consent, setConsent] = useState(false);
  const [sent, setSent] = useState(false);

  const domains = ADMIN_EMAIL_DOMAINS.map((d) => `@${d}`).join(" or ");

  const mutation = useMutation({
    mutationFn: () =>
      submit({
        data: {
          full_name: fullName.trim(),
          work_email: email.trim(),
          role_at_org: roleAtOrg.trim(),
          reason: reason.trim(),
          terms_consent: true,
        },
      }),
    onSuccess: (res) => {
      if (res.alreadyAdmin) {
        toast.success("You already have admin access — just sign in.");
        void navigate({ to: "/login" });
        return;
      }
      setSent(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (sent) {
    return (
      <AuthShell
        title="Request sent"
        subtitle="A super admin will review it and come back to you."
        footer={
          <Link to="/login" className="font-semibold text-primary hover:text-primary-deep">
            Back to sign in
          </Link>
        }
      >
        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <ShieldCheck className="mb-2 h-5 w-5 text-secondary" />
          Admin accounts are created by invitation, so nothing is active yet. If your request is
          granted you will get an invite email at{" "}
          <span className="font-semibold text-foreground">{email}</span> with a temporary password.
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Request admin access"
      subtitle="Admin accounts are invite-only and are not created through onboarding."
      footer={
        <>
          Not IGE staff?{" "}
          <Link
            to="/onboarding/role"
            className="font-semibold text-primary hover:text-primary-deep"
          >
            Choose a different role
          </Link>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (!consent) {
            toast.error("Please accept the Terms and Privacy Policy.");
            return;
          }
          mutation.mutate();
        }}
      >
        <Field label="Full name" value={fullName} onChange={setFullName} required />
        <div>
          <Field
            label="Work email address"
            type="email"
            value={email}
            onChange={setEmail}
            required
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Must be {domains}. Requests from any other domain are rejected automatically.
          </p>
        </div>
        <Field
          label="Role at ABW / IGE"
          value={roleAtOrg}
          onChange={setRoleAtOrg}
          required
          placeholder="e.g. Partnerships Lead"
        />
        <TextArea
          label="Why do you need admin access?"
          value={reason}
          onChange={setReason}
          rows={4}
          maxLength={2000}
          hint="Read by a super admin. Say what you need to do, not just that you need access."
        />

        <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-input accent-[hsl(var(--primary))]"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="font-semibold text-primary underline underline-offset-2">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-semibold text-primary underline underline-offset-2">
              Privacy Policy
            </Link>
            .
          </span>
        </label>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {mutation.isPending ? "Sending…" : "Request access"}
        </button>
      </form>
    </AuthShell>
  );
}
