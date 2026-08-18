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
  { key: "organiser", title: "Event Organiser", desc: "I run events and want sponsors.", icon: Megaphone },
  { key: "sponsor", title: "Brand / Sponsor", desc: "I have a budget to sponsor events.", icon: Globe2 },
  { key: "referral_partner", title: "Referral Partner", desc: "I want to earn by connecting sponsors to events.", icon: Handshake },
  { key: "media_partner", title: "Media Partner", desc: "I cover, film, or document events.", icon: Newspaper },
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

const ACCOUNT_DRAFT_KEY = "ige:signup-account-draft";

export type SignupAccountDraft = {
  fullName: string;
  phone: string;
  accountType: "individual" | "organisation";
  companyName: string;
};

export function stashSignupAccountDraft(draft: SignupAccountDraft) {
  try {
    sessionStorage.setItem(ACCOUNT_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    /* ignore */
  }
}

export function readSignupAccountDraft(): SignupAccountDraft | null {
  try {
    const raw = sessionStorage.getItem(ACCOUNT_DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SignupAccountDraft;
  } catch {
    return null;
  }
}

export function clearSignupAccountDraft() {
  try {
    sessionStorage.removeItem(ACCOUNT_DRAFT_KEY);
  } catch {
    /* ignore */
  }
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
