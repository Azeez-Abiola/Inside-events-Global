import type { LucideIcon } from "lucide-react";
import { Megaphone, Globe2, Handshake, Newspaper } from "lucide-react";

export type SignupRole = "organiser" | "sponsor" | "referral_partner" | "media_partner";

export type SignupStep = "role" | "account" | "verify" | "profile";

export const SIGNUP_ROLES: {
  key: SignupRole;
  title: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  { key: "organiser", title: "Event Organiser", desc: "List your event and find sponsors.", icon: Megaphone },
  { key: "sponsor", title: "Brand / Sponsor", desc: "Discover vetted events to sponsor.", icon: Globe2 },
  { key: "referral_partner", title: "Referral Partner", desc: "Earn commission introducing sponsors.", icon: Handshake },
  { key: "media_partner", title: "Media Partner", desc: "Cross-promote with quality events.", icon: Newspaper },
];

export function isSignupRole(value: string | undefined | null): value is SignupRole {
  return !!value && SIGNUP_ROLES.some((r) => r.key === value);
}

export function getSignupRoleMeta(role: SignupRole) {
  return SIGNUP_ROLES.find((r) => r.key === role) ?? SIGNUP_ROLES[0];
}

/** First signup role from auth roles, else session stash, else fallback. */
export function resolveSignupRole(roles: string[], fallback: SignupRole = "sponsor"): SignupRole {
  const fromAuth = roles.find((r): r is SignupRole => isSignupRole(r));
  if (fromAuth) return fromAuth;
  const stored = readSignupRole();
  if (stored) return stored;
  return fallback;
}

const ROLE_STORAGE_KEY = "ige:signup-role";

export function stashSignupRole(role: SignupRole) {
  try {
    sessionStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    /* ignore */
  }
}

export function readSignupRole(): SignupRole | null {
  try {
    const raw = sessionStorage.getItem(ROLE_STORAGE_KEY);
    if (raw && SIGNUP_ROLES.some((r) => r.key === raw)) return raw as SignupRole;
  } catch {
    /* ignore */
  }
  return null;
}

export function clearSignupRole() {
  try {
    sessionStorage.removeItem(ROLE_STORAGE_KEY);
    sessionStorage.removeItem("ige:pending-role");
  } catch {
    /* ignore */
  }
}

export async function applySignupRole(userId: string, role: SignupRole) {
  const { supabase } = await import("@/integrations/supabase/client");
  const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
  if (error && !error.message.includes("duplicate")) throw new Error(error.message);
}

export async function hasRoleProfile(userId: string, role: SignupRole): Promise<boolean> {
  const { supabase } = await import("@/integrations/supabase/client");
  if (role === "media_partner") return true;
  const table =
    role === "organiser"
      ? "organiser_profiles"
      : role === "sponsor"
        ? "sponsor_profiles"
        : "referral_partner_profiles";
  const { data } = await supabase.from(table).select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}
