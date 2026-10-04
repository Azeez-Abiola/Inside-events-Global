/**
 * The 37 IGE event types (Dev Doc v6.4, Appendix B).
 *
 * "Every event on IGE, published or private, is classified as one of these 37
 * types. They cover every sector, B2B, consumer, community and private, so that
 * even a private mixer that is not seeking sponsorship can be listed and managed
 * on IGE. Show the description as helper text in the dropdown."
 *
 * This is the single source of truth. `event-taxonomy.ts` and
 * `onboarding-constants.ts` both re-export from here — do not fork the list.
 */

export interface EventTypeDef {
  value: string;
  description: string;
}

export const IGE_EVENT_TYPES: readonly EventTypeDef[] = [
  {
    value: "Conference",
    description:
      "A multi-session gathering built around keynotes, panels and presentations on an industry or theme, usually running one to three days.",
  },
  {
    value: "Summit",
    description:
      "A high-level convening of senior leaders, policymakers or executives focused on agenda-setting conversations and commitments.",
  },
  {
    value: "Trade Mission",
    description:
      "An organised delegation of businesses that travels to another country or region to explore trade, investment and partnership opportunities.",
  },
  {
    value: "Business Forum",
    description:
      "A structured platform for business leaders to discuss economic, sectoral or policy issues, often with B2B matchmaking.",
  },
  {
    value: "Industry Expo",
    description:
      "A large sector-specific show where companies display products and services to buyers, partners and the trade public.",
  },
  {
    value: "Exhibition",
    description:
      "A curated display event, commercial or thematic, where exhibitors showcase work, products or ideas to visitors.",
  },
  {
    value: "Product Launch",
    description:
      "An event staged to introduce a new product or service to media, customers, partners and the market.",
  },
  {
    value: "Brand Activation Event",
    description:
      "An experiential event designed to get consumers interacting directly with a brand to build awareness and loyalty.",
  },
  {
    value: "Corporate Networking Mixer",
    description:
      "An informal gathering where professionals and corporates meet, connect and build relationships.",
  },
  {
    value: "Executive Roundtable",
    description:
      "A small, closed-door discussion among senior decision-makers on a focused strategic topic.",
  },
  {
    value: "Private Dinner",
    description:
      "An exclusive, invite-only dinner for high-value guests, used for relationship building, deal-making or VIP engagement.",
  },
  {
    value: "Investor Demo Day",
    description:
      "An event where startups present their businesses to investors, typically at the end of an accelerator or incubator programme.",
  },
  {
    value: "Startup Pitch Event",
    description:
      "A competition or showcase where founders pitch ideas to judges, investors or an audience for funding, prizes or visibility.",
  },
  {
    value: "Founder Meetup",
    description:
      "A peer gathering of entrepreneurs to share experiences, learn and build community.",
  },
  {
    value: "Community Meetup",
    description:
      "A recurring or one-off gathering of a community of interest, such as tech, creatives or professionals, to connect and learn.",
  },
  {
    value: "Cultural Festival",
    description:
      "A celebration of heritage, traditions, food, music and art, often drawing large public and diaspora audiences.",
  },
  {
    value: "Music or Entertainment Event",
    description:
      "Concerts, shows, comedy nights and other entertainment experiences aimed at mass or niche audiences.",
  },
  {
    value: "Fashion Event",
    description:
      "Runway shows, fashion weeks and designer showcases that bring together designers, buyers, media and fashion enthusiasts.",
  },
  {
    value: "Art Exhibition",
    description:
      "A showcase of visual art, such as paintings, sculpture, photography or installations, in galleries or curated spaces.",
  },
  {
    value: "Award Ceremony",
    description:
      "An event recognising excellence and achievement within an industry, community or organisation.",
  },
  {
    value: "Gala Night",
    description:
      "A formal, high-end evening event, often for fundraising, celebration or prestige, with dinner and entertainment.",
  },
  {
    value: "Workshop",
    description:
      "A hands-on, interactive session where participants learn and apply a specific skill or process.",
  },
  {
    value: "Masterclass",
    description:
      "An expert-led session where a recognised authority shares deep knowledge on a specialised subject.",
  },
  {
    value: "Training Programme",
    description:
      "A structured learning programme, often multi-day or multi-week, built to develop capacity or certify participants.",
  },
  {
    value: "Bootcamp",
    description:
      "An intensive, fast-paced programme that builds practical skills in a short timeframe, such as tech, business or leadership.",
  },
  {
    value: "Retreat",
    description:
      "An immersive getaway, often off-site, for reflection, team bonding, wellness or strategic planning.",
  },
  {
    value: "Roadshow",
    description:
      "A travelling series of events across multiple cities or locations to promote a brand, product, investment or message.",
  },
  {
    value: "Pop-up Event",
    description:
      "A temporary, short-duration experience, such as a shop, lounge or activation, created to generate buzz and engagement.",
  },
  {
    value: "University or Campus Event",
    description:
      "Events held in or for tertiary institutions, including career fairs, student festivals, lectures and youth engagements.",
  },
  {
    value: "CSR or Impact Event",
    description:
      "Events driven by corporate social responsibility or social impact goals, such as outreaches, sustainability drives and community projects.",
  },
  {
    value: "Government or Policy Event",
    description:
      "Events convened by or with government bodies to discuss, launch or shape policy, regulation or public programmes.",
  },
  {
    value: "Diaspora Event",
    description:
      "Events that connect people of African descent abroad with home countries, including homecomings, reunions and diaspora investment fora.",
  },
  {
    value: "Market Entry Event",
    description:
      "Events that help brands or businesses enter a new market through introductions, local partnerships and market intelligence.",
  },
  {
    value: "Launch Tour",
    description:
      "A multi-stop series of launch events rolling out a product, book, album or brand across several locations.",
  },
  {
    value: "Hybrid Event",
    description:
      "An event that combines in-person and virtual attendance, extending reach beyond the physical venue.",
  },
  {
    value: "Virtual Event",
    description:
      "A fully online event, such as a conference, summit or showcase, hosted on digital platforms.",
  },
  {
    value: "Webinar Series",
    description:
      "A recurring set of online seminars or talks delivered over time on a theme or learning track.",
  },
] as const;

/** Flat list, for selects and validation. */
export const EVENT_TYPE_VALUES: string[] = IGE_EVENT_TYPES.map((t) => t.value);

const DESCRIPTION_BY_VALUE = new Map(IGE_EVENT_TYPES.map((t) => [t.value, t.description]));

/** Helper text for the dropdown. Returns undefined for legacy values not in the 37. */
export function eventTypeDescription(value: string | null | undefined): string | undefined {
  return value ? DESCRIPTION_BY_VALUE.get(value) : undefined;
}

/**
 * Pre-v6.4 listings carry event types from the old 13- and 37-entry lists.
 * Anything not in the 37 is shown as-is until the owner re-saves, so a stale
 * value never silently disappears from a listing.
 */
export function isLegacyEventType(value: string | null | undefined): boolean {
  return !!value && !DESCRIPTION_BY_VALUE.has(value);
}
