/**
 * Default glossary for the italic "i" information tips (TAB 3 §3.2, v6.3).
 *
 * Every section title and every field label carries a tip explaining, in plain
 * language, what it means and why IGE asks for it. Admin can override any of
 * these from the back end without a release — see the `glossary_tips` table —
 * so treat this map as the shipped baseline, not the final copy.
 *
 * Keys are stable ids: `<area>.<thing>`. Never reuse a key for different copy.
 */
export const INFO_TIPS: Record<string, string> = {
  // ── Onboarding: shared sections ────────────────────────────────────────────
  "section.matching_profile":
    "This section powers your match score. IGE uses it to work out which partners are a genuine fit for you, so the more honest it is, the better your matches.",
  "section.verification":
    "Proof that you are who you say you are. You can skip this and finish it later, but some features stay locked until it is done.",
  "section.referral_consent":
    "How you found IGE, plus the permissions we need to process your data. This is the last compulsory section.",
  "section.wishlist":
    "The partners you would most like to work with. IGE does not promise introductions, but it tells us what to look out for.",
  "section.abw_consulting":
    "AlexBoyo World can run execution strategy, planning or management for you as a paid service. Tell us if you want to talk; nothing is charged by saying yes here.",

  // ── Onboarding: shared fields ──────────────────────────────────────────────
  "field.primary_goal":
    "The single outcome that matters most to you from a partnership. It is the first thing IGE matches on.",
  "field.success_metrics":
    "How you will judge whether a partnership worked, drawn from the measures the world's sponsorship and events bodies use. Pick as many as apply — your dashboard and reports are built around them.",
  "field.roi_multiple":
    "The minimum return you would need to see to consider the spend worthwhile, expressed as a multiple of what you put in.",
  "field.multi_year":
    "Whether you are looking for a one-off or an ongoing relationship. Partners who want the same thing match more strongly.",
  "field.can_offer_partner":
    "What you can give back, not just what you want. Every role is asked this because the strongest partnerships run both ways.",
  "field.offer_narrative":
    "A few sentences in your own words on what a partner gets from working with you. Admin reads this and summarises it in approved match notifications.",
  "field.roi_offered":
    "What a sponsor actually receives from you, grouped by the three value pillars the sponsorship industry measures against: value for money, value for brand, value for business.",
  "field.roi_expected":
    "What you want back from a sponsorship, using the same three pillars. This sets the weighting in your Return on Objectives report.",
  "field.country":
    "Where you mainly operate. Used for matching, currency defaults and which events are shown to you first.",
  "field.hear_about":
    "How you found IGE. It tells us which channels are actually working, and it is the only place we can credit a partner who referred you.",
  "field.linkedin":
    "Used for verification and to give Admin context when reviewing your account. It is never shown to other users.",
  "field.agency":
    "If an agency handles this on your behalf, say so here and give us their details. Admin will keep them in the loop on anything that needs their sign-off.",

  // ── Onboarding: organiser ──────────────────────────────────────────────────
  "field.event_type":
    "One of IGE's 37 event types. Pick the one that best describes the format, not the sector — the sector is captured separately.",
  "field.event_visibility":
    "Private keeps the event in your workspace: it is not on the marketplace and is not vetted. Published sends it to Admin vetting and, once approved, puts it in front of sponsors. You can publish a private event later.",
  "field.looking_to_connect":
    "Which kinds of IGE user you want this event to reach. An organiser might want Sponsors and Media Partners; a brand-hosted event might want Organisers and Creative Hub.",
  "field.connection_notes":
    "What you want from each type of partner, in your own words. For example: 'Media partner to deliver a 60-second highlight video.'",
  "field.early_cocreation":
    "Say yes and your event appears on the Forward Events Calendar, where brands can get involved at the planning stage instead of buying a finished package.",
  "field.private_share_link":
    "Generates a view-only link for a private event. Anyone with the link sees a summary; full details still need a sign-in.",
  "field.expected_attendance":
    "Your honest estimate for this edition. Sponsors compare it against your past attendance, so an inflated number costs you credibility at vetting.",
  "field.sponsorship_tiers":
    "Your packages and what each one includes. If you do not have these yet, say so in the prospectus question and IGE can help you build them.",
  "field.sustainability":
    "Aligns with ESA's Sustainable Sponsorship guidance. Brands increasingly have to report on this, so an honest answer helps rather than hurts.",

  // ── Onboarding: sponsor ────────────────────────────────────────────────────
  "field.investment_range":
    "The budget band you can actually commit per event. IGE only shows you opportunities inside it.",
  "field.target_markets":
    "The markets you are trying to reach or enter. Weighted heavily in matching.",
  "field.fiscal_year_start":
    "The month your financial year starts. Your Marketing Budget is planned across four quarters from this month, not from January.",

  // ── Onboarding: referral partner ───────────────────────────────────────────
  "field.commission_structure":
    "IGE's commission on a sponsorship is between 3% and 15%. Your share comes out of that commission — it is never added on top of what the sponsor pays.",
  "field.network_type":
    "Who you can actually reach. This decides which events and brands IGE puts in front of you.",

  // ── Onboarding: media partner ──────────────────────────────────────────────
  "field.media_type":
    "The formats you publish in. One of the three highest-weighted fields for matching you to events that need coverage.",
  "field.media_assets":
    "The deliverables you commit to producing for an event. Organisers choose media partners on this, so list only what you can reliably deliver.",
  "field.media_quantity":
    "How many of each asset. For example: 1 highlight video, 3 reels, 150 edited photos.",
  "field.media_turnaround":
    "How quickly you deliver after the event. Faster turnaround is worth more to an organiser than extra volume.",
  "field.media_exclusive":
    "Whether you want to be the only media partner on an event. Exclusivity is worth more to you but narrows which events you are matched to.",

  // ── Onboarding: partnerships pro ───────────────────────────────────────────
  "field.pro_client_types":
    "The kinds of client you manage partnerships for. IGE's CRM is built around these.",
  "field.pro_pipeline_stages":
    "Your deal stages. The defaults suit most partnership work; you can rename, reorder or add to them later.",
  "field.pro_reports_to":
    "Sets the default format of your Weekly Activity Report — a manager, a client and you yourself each need a different cut of the same work.",

  // ── Onboarding: creative hub ───────────────────────────────────────────────
  "field.creative_type":
    "What you make. It decides which brands see your work and what kind of placement they can buy.",
  "field.creative_placements":
    "The ways a brand can appear in your production, from a logo on screen to the brand being written into the story.",
  "field.production_stage":
    "Where the project is now. Brands pay differently for something in development than for something already shot.",

  // ── Dashboard and platform ─────────────────────────────────────────────────
  "dash.profile_completion":
    "What is still outstanding on your profile and which feature each remaining item unlocks.",
  "dash.vetting_tracker":
    "Where your listing is: Submitted, Under review, or Approved and live. Admin can also ask you for changes or for verification.",
  "dash.suggested_matches":
    "Partners IGE has scored as a fit for you. Every match is reviewed by Admin before you see it — nothing here is automatic.",
  "dash.commission":
    "IGE charges between 3% and 15% of the sponsorship value, depending on deal size and terms. Partner shares come out of that, never on top.",
  "dash.brand_readiness":
    "How ready your event is to be sponsored, scored on audience clarity, attendance proof, sponsor ROI history, commercialisation readiness, experience quality and organiser credibility.",
};

/** Looks up a tip, preferring an Admin override from the glossary table. */
export function resolveTip(key: string, overrides?: Record<string, string>): string | undefined {
  return overrides?.[key] ?? INFO_TIPS[key];
}
