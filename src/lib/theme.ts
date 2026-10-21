export const THEME_STORAGE_KEY = "ige-theme";

export function getPreferredDark() {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/**
 * Dark mode is a dashboard preference only. The home page, sign-in, sign-up
 * and every public page always render light, whatever the stored choice.
 */
export const DARK_MODE_PATHS = String.raw`^/(dashboard|admin|deals|messages|pipeline|profile|referrals|settings)(/|$)|^/events/?$|^/events/edit(/|$)`;

export function darkModeAllowed(pathname: string) {
  return new RegExp(DARK_MODE_PATHS).test(pathname);
}

export function applyTheme(isDark: boolean) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", isDark);
}

export function initThemeFromStorage() {
  applyTheme(getPreferredDark() && darkModeAllowed(window.location.pathname));
}

export function setTheme(isDark: boolean) {
  applyTheme(isDark && darkModeAllowed(window.location.pathname));
  localStorage.setItem(THEME_STORAGE_KEY, isDark ? "dark" : "light");
}

export const THEME_INIT_SCRIPT = `(function(){try{if(!new RegExp(${JSON.stringify(DARK_MODE_PATHS)}).test(location.pathname))return;var s=localStorage.getItem("${THEME_STORAGE_KEY}");var d=s==="dark"||(!s&&window.matchMedia("(prefers-color-scheme: dark)").matches);if(d)document.documentElement.classList.add("dark");}catch(e){}})();`;

/** Re-apply on every route change, so leaving the dashboard drops dark mode. */
export function syncThemeForPath(pathname: string) {
  applyTheme(getPreferredDark() && darkModeAllowed(pathname));
}
