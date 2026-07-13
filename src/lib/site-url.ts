const DEFAULT_SITE_URL = "https://www.insideglobalevents.com";

function resolveSiteUrl(origin?: string): string {
  const fromEnv =
    (typeof import.meta !== "undefined" && (import.meta.env.VITE_SITE_URL as string | undefined)) ||
    process.env.SITE_URL ||
    process.env.VITE_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (origin) return origin.replace(/\/$/, "");
  return DEFAULT_SITE_URL;
}

/** Canonical public site URL — used for in-app navigation and general links. */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    if (import.meta.env.PROD) return DEFAULT_SITE_URL;
    return window.location.origin;
  }
  return resolveSiteUrl();
}

/**
 * URL embedded in auth emails (signup confirm, password reset).
 * Always points at the public site so links work from any device — even when
 * signup was triggered from local dev without a running server.
 */
export function getAuthRedirectUrl(): string {
  if (typeof window !== "undefined") {
    const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    if (import.meta.env.PROD) return DEFAULT_SITE_URL;
    return DEFAULT_SITE_URL;
  }
  return resolveSiteUrl();
}

/** Rewrite localhost auth links from Supabase to the production site URL. */
export function normalizeAuthRedirectUrl(url: string): string {
  const siteUrl = getAuthRedirectUrl();
  try {
    const parsed = new URL(url);
    const site = new URL(siteUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.protocol = site.protocol;
      parsed.host = site.host;
      return parsed.toString();
    }
  } catch {
    /* keep original */
  }
  return url;
}
