import { Webhook } from "standardwebhooks";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import {
  enqueueAuthEmailFromHook,
  enqueueEmailChangeEmails,
  redactEmail,
  type SupabaseAuthEmailData,
  type SupabaseAuthHookUser,
} from "@/lib/email/auth-hook";
import {
  SHORT_OTP_MAX_PER_HOUR,
  generateShortOtp,
  hashShortOtp,
  shortOtpExpiry,
} from "@/lib/email/short-otp";

/**
 * Signup is the only flow whose screen asks for a typed code, so it is the
 * only one we shorten. Password recovery and email change go out as links and
 * keep Supabase's own token untouched.
 */
const SHORTENED_ACTIONS = new Set(["signup"]);

/**
 * Swap Supabase's 6-to-10 digit token for a short one of our own and record
 * the mapping back to its token_hash. Returns the code to print in the email,
 * or null to leave the email exactly as Supabase intended.
 *
 * Never throws: an email that goes out with Supabase's longer code is a worse
 * experience, but an email that does not go out at all blocks the signup
 * entirely — and this handler failing is what makes signUp return a 500.
 */
async function mintShortCode(
  // Untyped on purpose: `email_otp_aliases` postdates the last
  // `supabase gen types` run, so the generated schema rejects it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  email: string,
  emailData: SupabaseAuthEmailData,
): Promise<string | null> {
  if (!SHORTENED_ACTIONS.has(emailData.email_action_type)) return null;
  if (!emailData.token_hash) return null;

  try {
    const since = new Date(Date.now() - 60 * 60_000).toISOString();
    const { count } = await supabase
      .from("email_otp_aliases")
      .select("id", { count: "exact", head: true })
      .ilike("email", email)
      .gte("created_at", since);

    // Burn-and-retry is how you brute force a 4-digit code without ever
    // exhausting the attempt limit on a single one. Cap the supply.
    if ((count ?? 0) >= SHORT_OTP_MAX_PER_HOUR) {
      console.warn("Short OTP rate limit hit", { email_redacted: redactEmail(email) });
      return null;
    }

    const code = generateShortOtp();
    const { error } = await supabase.from("email_otp_aliases").insert({
      email: email.toLowerCase(),
      token_hash: emailData.token_hash,
      email_action_type: emailData.email_action_type,
      code_hash: hashShortOtp(code),
      expires_at: shortOtpExpiry(),
    });
    if (error) {
      console.error("Could not store short OTP alias", { error: error.message });
      return null;
    }

    void supabase.rpc("purge_expired_email_otp_aliases").then(
      () => {},
      () => {},
    );
    return code;
  } catch (error) {
    console.error("Short OTP minting failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

function getHookSecret(): string | null {
  const raw = process.env.SEND_EMAIL_HOOK_SECRET || process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!raw) return null;
  return raw.replace(/^v1,whsec_/, "");
}

export const Route = createFileRoute("/api/auth/send-email-hook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const hookSecret = getHookSecret();
        if (!hookSecret) {
          console.error("SEND_EMAIL_HOOK_SECRET is not configured");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        const supabaseUrl = process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (!supabaseUrl || !supabaseServiceKey) {
          console.error("Missing Supabase environment variables");
          return Response.json({ error: "Server configuration error" }, { status: 500 });
        }

        const payloadText = await request.text();
        const headers = Object.fromEntries(request.headers.entries());

        let user: SupabaseAuthHookUser;
        let email_data: SupabaseAuthEmailData;

        try {
          const wh = new Webhook(hookSecret);
          const verified = wh.verify(payloadText, headers) as {
            user: SupabaseAuthHookUser;
            email_data: SupabaseAuthEmailData;
          };
          user = verified.user;
          email_data = verified.email_data;
        } catch (error) {
          console.error("Auth hook verification failed", { error });
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        const emailType = email_data.email_action_type;
        console.log("Auth send-email hook", {
          emailType,
          email_redacted: redactEmail(user.email),
        });

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        try {
          if (emailType === "email_change") {
            await enqueueEmailChangeEmails(supabase, user, email_data);
          } else if (emailType === "reauthentication") {
            await enqueueAuthEmailFromHook(supabase, user, email_data, {
              token: email_data.token,
            });
          } else {
            const shortCode = await mintShortCode(supabase, user.email, email_data);
            await enqueueAuthEmailFromHook(
              supabase,
              user,
              email_data,
              shortCode ? { token: shortCode } : undefined,
            );
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("Failed to enqueue auth email", { emailType, error: message });
          return Response.json({ error: message }, { status: 500 });
        }

        return Response.json({ success: true, queued: true });
      },
    },
  },
});
