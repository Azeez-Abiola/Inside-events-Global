const DEFAULT_SITE_URL = "https://www.insideglobalevents.com";

/** Canonical public site URL — used for auth redirects and email links. */
export function getSiteUrl(): string {
  if (typeof window !== "undefined") {
    const fromEnv = import.meta.env.VITE_SITE_URL as string | undefined;
    if (fromEnv) return fromEnv.replace(/\/$/, "");
    if (import.meta.env.PROD) return DEFAULT_SITE_URL;
    return window.location.origin;
  }
  const fromEnv = process.env.SITE_URL || process.env.VITE_SITE_URL;
  return (fromEnv || DEFAULT_SITE_URL).replace(/\/$/, "");
}

/** Rewrite localhost auth links from Supabase to the production site URL. */
export function normalizeAuthRedirectUrl(url: string): string {
  const siteUrl = getSiteUrl();
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
