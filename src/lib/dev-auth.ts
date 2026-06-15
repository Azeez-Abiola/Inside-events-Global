// ───────────────────────────────────────────────────────────────
// DEV-ONLY mock auth. Lets you impersonate any role locally without
// a database, service key, or email confirmation. Tree-shaken out of
// production builds because every gate is behind `import.meta.env.DEV`.
// ───────────────────────────────────────────────────────────────
export const DEV_AUTH_ENABLED = import.meta.env.DEV;

export type AppRole =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "abw_admin"
  | "super_admin";

const STORAGE_KEY = "ige:dev-roles";
const CHANGE_EVENT = "ige:dev-roles-changed";

// A stable fake user. The UUID is valid-shaped so anything that parses it won't choke.
export const DEV_USER = {
  id: "00000000-0000-0000-0000-0000000000de",
  email: "dev@ige.test",
  user_metadata: {},
  app_metadata: {},
} as const;

export function getDevRoles(): AppRole[] | null {
  if (!DEV_AUTH_ENABLED || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? (parsed as AppRole[]) : null;
  } catch {
    return null;
  }
}

export function setDevRoles(roles: AppRole[] | null) {
  if (!DEV_AUTH_ENABLED || typeof window === "undefined") return;
  try {
    if (!roles || roles.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(roles));
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  } catch {
    // ignore
  }
}

export function onDevRolesChange(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export const ROLE_LABELS: Record<AppRole, string> = {
  organiser: "Organiser",
  sponsor: "Sponsor",
  referral_partner: "Referral Partner",
  media_partner: "Media Partner",
  abw_admin: "ABW Admin",
  super_admin: "Super Admin",
};
