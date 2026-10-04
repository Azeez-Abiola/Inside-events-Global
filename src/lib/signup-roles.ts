import type { LucideIcon } from "lucide-react";
import { Megaphone, Globe2, Handshake, Newspaper, Briefcase, Clapperboard } from "lucide-react";

export type SignupRole =
  | "organiser"
  | "sponsor"
  | "referral_partner"
  | "media_partner"
  | "partnerships_pro"
  | "creative_hub";

export type SignupStep = "role" | "account" | "verify" | "profile";

/**
 * The six public role cards (TAB 2 §2.2).
 *
 * "Role cards in a responsive grid, each with a clear, detailed description so
 *  a first time visitor understands exactly what that role means before
 *  choosing it, not just a one line tagline."
 *
 * `tagline` is the one-line summary used where space is tight (the signup
 * header, the onboarding rail). `desc` is the card copy and is reproduced from
 * the spec — do not trim it to fit a layout.
 */
export const SIGNUP_ROLES: {
  key: SignupRole;
  title: string;
  tagline: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    key: "organiser",
    title: "Event Organiser",
    tagline: "I run events and want sponsors.",
    desc: "You run or manage an event and want to find brand sponsors or partners for it. Choose this if you plan, produce, or own an event of any size and type and need funding, in kind support, media partners or brand partners. You can also keep an event private and use IGE purely to plan and manage it.",
    icon: Megaphone,
  },
  {
    key: "sponsor",
    title: "Brand / Sponsor",
    tagline: "I have a budget to sponsor events.",
    desc: "You represent a brand or company that sponsors events or creative productions. Choose this if you manage marketing, partnerships, or a sponsorship budget and are looking for vetted, brand ready events to invest in, or if you host your own brand events and want one place to plan and manage them.",
    icon: Globe2,
  },
  {
    key: "referral_partner",
    title: "Referral Partner",
    tagline: "I want to earn by connecting sponsors to events.",
    desc: "You run an agency, such as an experiential or marketing agency, or have a network of brands, and want to earn commission by sharing IGE event links with them. Choose this if you can introduce sponsors to events on the marketplace and want to be rewarded when that introduction leads to a paid sponsorship.",
    icon: Handshake,
  },
  {
    key: "media_partner",
    title: "Media Partner",
    tagline: "I cover, film, or document events.",
    desc: "You cover, film, photograph, or document events professionally and want to market and cover events listed on IGE. Choose this if you represent a publication, broadcaster, podcast, or content channel and want IGE to introduce you to organisers who need coverage.",
    icon: Newspaper,
  },
  {
    key: "partnerships_pro",
    title: "Partnerships Pro",
    tagline: "I manage partnerships and need a daily CRM.",
    desc: "You are a partnerships professional, affiliate, consultant, business developer or partnerships executive, in any sector, not only events. Choose this if you want a full CRM to manage contacts, clients, outreach, pipeline and commission every day, with reports you can download for your manager or clients.",
    icon: Briefcase,
  },
  {
    key: "creative_hub",
    title: "Creative Hub",
    tagline: "I make work brands could appear in.",
    desc: "You are a filmmaker, producer, director, artist, influencer or content creator with a production, show, series or project that brands could appear in. Choose this if you want to list sponsorship and brand placement opportunities in your work for brands around the world to discover.",
    icon: Clapperboard,
  },
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
  // Media, Partnerships Pro and Creative Hub keep everything in the
  // onboarding application; they have no separate profile table to check.
  if (role === "media_partner" || role === "partnerships_pro" || role === "creative_hub") {
    return true;
  }
  const table =
    role === "organiser"
      ? "organiser_profiles"
      : role === "sponsor"
        ? "sponsor_profiles"
        : "referral_partner_profiles";
  const { data } = await supabase.from(table).select("user_id").eq("user_id", userId).maybeSingle();
  return !!data;
}
