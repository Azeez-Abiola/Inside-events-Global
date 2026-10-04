/**
 * Remember me and the 24-hour session rule (TAB 2 §2.4, TAB 12 §12.4).
 *
 * "'Remember me' keeps the person signed in on that device when the browser
 *  closes and pre-fills their email next time. For security, every marketplace
 *  and dashboard session ends 24 hours after sign in, whether or not Remember
 *  me was ticked, and the person is asked to sign in again. A notice appears
 *  five minutes before the session ends."
 *
 * Supabase refreshes its own token indefinitely, so the 24-hour ceiling is
 * ours to enforce: we stamp the moment of sign-in and sign the person out once
 * that stamp is a day old.
 *
 * Without Remember me the session also ends when the browser closes. There is
 * no event for that, so an open tab writes a heartbeat and a boot that finds a
 * stale one concludes the browser was shut. sessionStorage would be the
 * obvious sentinel but it is per-tab, so opening a second tab would read as a
 * closed browser and sign the person out of both.
 */

const SIGNED_IN_AT = "ige.session.signed_in_at";
const REMEMBER_ME = "ige.session.remember_me";
const REMEMBERED_EMAIL = "ige.session.email";
const HEARTBEAT = "ige.session.heartbeat";

export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const SESSION_WARNING_MS = 5 * 60 * 1000;

/** How often an open tab says it is still there. */
export const HEARTBEAT_INTERVAL_MS = 30 * 1000;

/**
 * How stale a heartbeat has to be before we call it a closed browser. Well
 * clear of the interval, because a sleeping laptop stops running timers and
 * signing someone out for closing their lid is not what the spec asks for.
 */
export const HEARTBEAT_GRACE_MS = 5 * 60 * 1000;

function store(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    // Private mode or blocked site data: the 24-hour rule degrades to
    // Supabase's own expiry rather than locking the person out.
    return null;
  }
}

/** Call immediately after a successful sign-in. */
export function markSignedIn(opts: { rememberMe: boolean; email?: string }) {
  const ls = store();
  if (!ls) return;
  try {
    const now = Date.now();
    ls.setItem(SIGNED_IN_AT, String(now));
    ls.setItem(REMEMBER_ME, opts.rememberMe ? "1" : "0");
    if (opts.rememberMe && opts.email) ls.setItem(REMEMBERED_EMAIL, opts.email);
    if (!opts.rememberMe) ls.removeItem(REMEMBERED_EMAIL);
    ls.setItem(HEARTBEAT, String(now));
  } catch {
    /* storage full or blocked — nothing to do */
  }
}

/** Clear every marker. Call on sign-out. */
export function clearSessionMarkers() {
  try {
    const ls = store();
    ls?.removeItem(SIGNED_IN_AT);
    ls?.removeItem(REMEMBER_ME);
    ls?.removeItem(HEARTBEAT);
    // The remembered email deliberately survives sign-out — that is the whole
    // point of Remember me pre-filling it next time.
  } catch {
    /* ignore */
  }
}

/** The email to pre-fill on the sign-in screen, if Remember me was ticked. */
export function rememberedEmail(): string {
  try {
    return store()?.getItem(REMEMBERED_EMAIL) ?? "";
  } catch {
    return "";
  }
}

export function wasRemembered(): boolean {
  try {
    return store()?.getItem(REMEMBER_ME) === "1";
  } catch {
    return false;
  }
}

/** Called on a timer by the open tab, and once on boot. */
export function beat(now = Date.now()) {
  try {
    store()?.setItem(HEARTBEAT, String(now));
  } catch {
    /* ignore */
  }
}

export type SessionVerdict =
  | { state: "ok"; expiresAt: number }
  | { state: "expiring"; expiresAt: number }
  | { state: "expired"; reason: "max_age" | "browser_closed" }
  | { state: "unknown" };

/**
 * Where the current session stands against the policy.
 *
 * `unknown` means we have no stamp — a session that predates this code, or
 * storage we cannot read. We leave those alone: signing someone out because we
 * cannot find a timestamp is worse than letting Supabase's own expiry handle it.
 */
export function evaluateSession(now = Date.now()): SessionVerdict {
  const ls = store();
  if (!ls) return { state: "unknown" };

  let raw: string | null = null;
  try {
    raw = ls.getItem(SIGNED_IN_AT);
  } catch {
    return { state: "unknown" };
  }
  if (!raw) return { state: "unknown" };

  const signedInAt = Number(raw);
  if (!Number.isFinite(signedInAt)) return { state: "unknown" };

  // Browser-close rule applies only when Remember me was left unticked.
  if (!wasRemembered()) {
    const lastBeat = Number(ls.getItem(HEARTBEAT));
    if (Number.isFinite(lastBeat) && lastBeat > 0 && now - lastBeat > HEARTBEAT_GRACE_MS) {
      return { state: "expired", reason: "browser_closed" };
    }
  }

  const expiresAt = signedInAt + SESSION_MAX_AGE_MS;
  if (now >= expiresAt) return { state: "expired", reason: "max_age" };
  if (now >= expiresAt - SESSION_WARNING_MS) return { state: "expiring", expiresAt };
  return { state: "ok", expiresAt };
}
