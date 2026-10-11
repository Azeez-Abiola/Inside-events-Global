import { useEffect, useState, type ReactNode } from "react";
import { Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type Stage =
  | { kind: "checking" }
  | { kind: "ok" }
  | { kind: "enrol"; factorId: string; qr: string; secret: string }
  | { kind: "verify"; factorId: string }
  | { kind: "error"; message: string };

const REQUIRED = import.meta.env.VITE_ADMIN_MFA_REQUIRED !== "false";

/**
 * Admin sign-in requires two-factor authentication (TAB 12 §12.4). Admins
 * enrol an authenticator app once, then confirm a six-digit code each time
 * they sign in. The server re-checks the assurance level on high-impact
 * actions, so this screen is the convenience, not the only lock.
 */
export function AdminMfaGate({ isAdmin, children }: { isAdmin: boolean; children: ReactNode }) {
  const [stage, setStage] = useState<Stage>({ kind: "checking" });
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin || !REQUIRED) {
      setStage({ kind: "ok" });
      return;
    }
    let cancelled = false;
    (async () => {
      const { data: aal, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelled) return;
      if (error) return setStage({ kind: "error", message: error.message });
      if (aal.currentLevel === "aal2") return setStage({ kind: "ok" });
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const verified = factors?.totp.find((f) => f.status === "verified");
      if (verified) return setStage({ kind: "verify", factorId: verified.id });
      // Clear half-finished enrolments so a fresh QR code can be issued.
      for (const f of factors?.all ?? []) {
        if (f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: en, error: enErr } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `IGE admin ${Date.now()}`,
      });
      if (cancelled) return;
      if (enErr || !en)
        return setStage({
          kind: "error",
          message: enErr?.message ?? "Could not start 2FA set-up.",
        });
      setStage({ kind: "enrol", factorId: en.id, qr: en.totp.qr_code, secret: en.totp.secret });
    })();
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  if (stage.kind === "ok") return <>{children}</>;

  const submit = async (factorId: string) => {
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setErr("That code didn't work. Check your authenticator app and try again.");
    setStage({ kind: "ok" });
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
        <ShieldCheck className="mx-auto h-8 w-8 text-primary" />
        <h1 className="mt-3 font-display text-xl font-bold">Two-factor sign-in</h1>
        {stage.kind === "checking" && (
          <Loader2 className="mx-auto mt-6 h-6 w-6 animate-spin text-primary" />
        )}
        {stage.kind === "error" && (
          <p className="mt-3 text-sm text-destructive">
            {stage.message} Ask a Super Admin to check that authenticator (TOTP) sign-in is enabled
            for the IGE Supabase project.
          </p>
        )}
        {(stage.kind === "enrol" || stage.kind === "verify") && (
          <form
            className="mt-3 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              void submit(stage.factorId);
            }}
          >
            {stage.kind === "enrol" ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Admin accounts need two-factor sign-in. Scan this with an authenticator app
                  (Google Authenticator, 1Password, Authy), then enter the six-digit code.
                </p>
                <img
                  src={stage.qr}
                  alt="Authenticator QR code"
                  className="mx-auto h-44 w-44 rounded-lg bg-white p-2"
                />
                <p className="break-all font-mono text-[11px] text-muted-foreground">
                  Or enter this key: {stage.secret}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter the six-digit code from your authenticator app.
              </p>
            )}
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              aria-label="Six-digit code"
              className="w-full rounded-md border border-input bg-background px-3 py-2.5 text-center font-mono text-lg tracking-[0.4em]"
            />
            {err && <p className="text-xs text-destructive">{err}</p>}
            <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
              {busy ? "Checking…" : "Verify"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
