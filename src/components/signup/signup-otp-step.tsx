import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  AUTH_EMAIL_OTP_MAX,
  isValidEmailOtp,
  normalizeEmailOtp,
} from "@/lib/auth-email";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from "@/components/ui/input-otp";

type Props = {
  email: string;
  onVerified: () => Promise<void>;
  onResend: () => Promise<void>;
};

export function SignupOtpStep({ email, onVerified, onResend }: Props) {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  async function handleVerify(raw: string) {
    const code = normalizeEmailOtp(raw);
    if (!isValidEmailOtp(code)) return;
    setVerifying(true);
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "signup",
    });
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
        We sent a verification code to <strong className="text-foreground">{email}</strong>.
        Enter all {AUTH_EMAIL_OTP_MAX} digits from your email.
      </p>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={AUTH_EMAIL_OTP_MAX}
          value={otp}
          onChange={(value) => {
            setOtp(value);
            if (normalizeEmailOtp(value).length === AUTH_EMAIL_OTP_MAX) {
              void handleVerify(value);
            }
          }}
          disabled={verifying}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
            <InputOTPSlot index={6} />
            <InputOTPSlot index={7} />
          </InputOTPGroup>
        </InputOTP>
        {verifying && (
          <p className="text-xs text-muted-foreground">Verifying…</p>
        )}
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
