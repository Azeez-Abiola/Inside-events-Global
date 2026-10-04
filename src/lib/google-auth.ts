/**
 * Continue with Google (TAB 2 §2.1, §2.3, §2.4).
 *
 * OAuth 2.0 / OpenID Connect through Supabase's Google provider. Google
 * returns a verified email, so an account created this way skips the
 * verification step entirely.
 *
 * The selected role rides along in the callback URL rather than in OAuth
 * state, because Supabase owns the state parameter. `/auth/callback` reads it
 * and attaches the role before sending the person into onboarding.
 */
import { supabase } from "@/integrations/supabase/client";

export interface GoogleSignInOptions {
  /** Role chosen on the role-selection screen. Sign-up only. */
  role?: string;
  /** Where to land once the account is resolved. */
  redirect?: string;
  /**
   * Whether the person ticked Remember me before clicking the Google button.
   * It survives the redirect in the callback URL, because the OAuth round trip
   * reloads the page and loses component state.
   */
  rememberMe?: boolean;
}

export function googleCallbackUrl(opts: GoogleSignInOptions = {}): string {
  const base = `${window.location.origin}/auth/callback`;
  const params = new URLSearchParams();
  if (opts.role) params.set("role", opts.role);
  if (opts.redirect) params.set("redirect", opts.redirect);
  if (opts.rememberMe) params.set("remember", "1");
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

/**
 * Starts the Google redirect. Resolves with an error message to show, or null
 * when the browser is already on its way to Google.
 */
export async function startGoogleSignIn(opts: GoogleSignInOptions = {}): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: googleCallbackUrl(opts),
      queryParams: {
        // Always show the chooser: people routinely hold a personal and a work
        // Google account, and IGE treats those as separate IGE accounts.
        prompt: "select_account",
      },
    },
  });
  if (!error) return null;
  if (/provider is not enabled/i.test(error.message)) {
    return "Google sign-in isn't switched on yet. Use your email and password for now.";
  }
  return error.message;
}
