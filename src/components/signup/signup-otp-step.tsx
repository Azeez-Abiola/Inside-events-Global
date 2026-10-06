import { useState } from "react";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { redeemEmailOtp } from "@/lib/email-otp.functions";
import {
  AUTH_EMAIL_OTP_LENGTH,
  AUTH_EMAIL_OTP_MAX,
  isValidEmailOtp,
  normalizeEmailOtp,
} from "@/lib/auth-email";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";

type Props = {
  email: string;
  onVerified: () => Promise<void>;
  onResend: () => Promise<void>;
};

export function SignupOtpStep({ email, onVerified, onResend }: Props) {
  const redeem = useServerFn(redeemEmailOtp);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(raw: string) {
    const code = normalizeEmailOtp(raw);
    if (!isValidEmailOtp(code)) return;
    setVerifying(true);

    // Two kinds of code can legitimately arrive, so try both.
    //
    // Ours: minted by the send-email hook and exchanged for the token_hash
    // Supabase issued for the same signup. Supabase's: the longer token it
    // sends whenever our hook has not minted one — any environment running an
    // older deploy, and any code issued before this change. Without the
    // fallback, every code in flight at deploy time would stop working, and
    // local development would be unable to verify at all, since Supabase
    // calls the hook at the public URL and can never reach localhost.
    let error: { message: string } | null = null;
    try {
      const res = await redeem({ data: { email: email.trim(), code } });
      ({ error } = await supabase.auth.verifyOtp({
        token_hash: res.tokenHash,
        type: "signup",
      }));
    } catch {
      ({ error } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: code,
        type: "signup",
      }));
    }
    setVerifying(false);
    if (error) {
      toast.error(error.message);
      setOtp("");
      return;
    }
    try {
      await onVerified();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Verification failed";
      toast.error(message);
      setOtp("");
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await onResend();
    } finally {
      setResending(false);
    }
  }

  const normalized = normalizeEmailOtp(otp);
  const canVerify = isValidEmailOtp(normalized);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        We sent a verification code to <strong className="text-foreground">{email}</strong>. Enter
        all {AUTH_EMAIL_OTP_LENGTH} digits from your email.
      </p>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={AUTH_EMAIL_OTP_MAX}
          value={otp}
          onChange={(value) => {
            setOtp(value);
            // Auto-submit at the project's configured length. Verify stays
            // available from the minimum, so a shorter code is never stuck.
            if (normalizeEmailOtp(value).length === AUTH_EMAIL_OTP_LENGTH) {
              void handleVerify(value);
            }
          }}
          disabled={verifying}
        >
          {/* Drawn from the configured length rather than a fixed eight, and
              split in half only when that divides evenly. */}
          <InputOTPGroup>
            {Array.from({ length: Math.ceil(AUTH_EMAIL_OTP_LENGTH / 2) }, (_, i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            {Array.from(
              { length: Math.floor(AUTH_EMAIL_OTP_LENGTH / 2) },
              (_, i) => i + Math.ceil(AUTH_EMAIL_OTP_LENGTH / 2),
            ).map((i) => (
              <InputOTPSlot key={i} index={i} />
            ))}
          </InputOTPGroup>
        </InputOTP>
        {verifying && <p className="text-xs text-muted-foreground">Verifying…</p>}
      </div>

      <button
        type="button"
        onClick={() => void handleVerify(otp)}
        disabled={verifying || !canVerify}
        className="inline-flex w-full items-center justify-center rounded-md bg-brand-gradient px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition-transform hover:-translate-y-0.5 disabled:opacity-60"
      >
        {verifying ? "Verifying…" : "Verify email"}
      </button>

      <button
        type="button"
        onClick={() => void handleResend()}
        disabled={resending || verifying}
        className="inline-flex w-full items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-60"
      >
        {resending ? "Sending…" : "Resend code"}
      </button>
    </div>
  );
}
