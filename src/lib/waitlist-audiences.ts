import type { LucideIcon } from "lucide-react";
import { Globe2, Handshake, Megaphone, Newspaper } from "lucide-react";

/** Public workspace roles eligible for the founding waitlist (excludes admin roles). */
export type WaitlistAudience = "organiser" | "sponsor" | "referral_partner" | "media_partner";

export const WAITLIST_AUDIENCES: {
  id: WaitlistAudience;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    id: "organiser",
    label: "Event organiser",
    shortLabel: "Organiser",
    description: "List events, build sponsorship packs, and close deals on IGE.",
    icon: Megaphone,
  },
  {
    id: "sponsor",
    label: "Brand / sponsor",
    shortLabel: "Sponsor",
    description: "Discover vetted events and commit sponsorship with confidence.",
    icon: Globe2,
  },
  {
    id: "referral_partner",
    label: "Referral partner",
    shortLabel: "Referral partner",
    description: "Earn commission by introducing sponsors to fitting events.",
    icon: Handshake,
  },
  {
    id: "media_partner",
    label: "Media partner",
    shortLabel: "Media partner",
    description: "Cross-promote with vetted events — coverage, content, and co-marketing.",
    icon: Newspaper,
  },
];

export function isWaitlistAudience(value: string | undefined | null): value is WaitlistAudience {
  return WAITLIST_AUDIENCES.some((a) => a.id === value);
}

export function waitlistAudienceLabel(id: WaitlistAudience) {
  return WAITLIST_AUDIENCES.find((a) => a.id === id)?.label ?? id;
}
