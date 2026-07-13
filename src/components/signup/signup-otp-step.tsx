import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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

  async function handleVerify(code: string) {
    if (code.length !== 6) return;
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

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        We sent a 6-digit verification code to <strong className="text-foreground">{email}</strong>.
        Enter it below to confirm your email.
      </p>

      <div className="flex flex-col items-center gap-4">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => {
            setOtp(value);
            if (value.length === 6) void handleVerify(value);
          }}
          disabled={verifying}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
          </InputOTPGroup>
          <InputOTPSeparator />
          <InputOTPGroup>
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
        {verifying && (
          <p className="text-xs text-muted-foreground">Verifying…</p>
        )}
      </div>

      <button
        type="button"
        onClick={() => void handleVerify(otp)}
        disabled={verifying || otp.length !== 6}
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
