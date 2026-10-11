/**
 * The scoring half of the Automated Matchmaking Engine (TAB 19 §19.3–19.4).
 *
 * Pure functions, no database: given the fields each side disclosed for the
 * purpose of being matched (TAB 3 matching-flagged fields), produce a 0–100
 * score and the plain-language reasons behind it. Deterministic and
 * explainable — the "Why" line is always a real field overlap, never filler
 * (§3.8.2: "Production should replace the random component with a
 * deterministic, explainable score").
 *
 * No protected characteristic is ever an input (§19.10).
 */

export type PairingType =
  | "organiser_sponsor"
  | "referral_event"
  | "pro_event"
  | "media_event"
  | "creative_sponsor"
  | "service_booking";

export interface FieldSignal {
  field: string;
  /** Human label for the Why line, e.g. "Sector". */
  label: string;
  primary: boolean;
  subject: string[];
  candidate: string[];
  /** Optional custom comparator; defaults to normalised set overlap. */
  compare?: (a: string[], b: string[]) => number;
}

export interface Explanation {
  field: string;
  label: string;
  primary: boolean;
  subjectValue: string;
  candidateValue: string;
  /** 0–1 overlap for this field. */
  overlap: number;
  /** Points this field added to the composite. */
  contribution: number;
  internalText: string;
  /** What a user may see: the basis, never the counterpart's figures. */
  userText: string | null;
}

export interface ScoreResult {
  base: number;
  secondary: number;
  composite: number;
  explanations: Explanation[];
}

const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Tokens that make "Banking & Financial Services" meet "Finance". */
const SYNONYMS: Record<string, string[]> = {
  finance: ["banking and financial services", "fintech", "finance"],
  tech: ["technology", "tech", "fintech", "tech community"],
  creative: [
    "film and creative economy",
    "creative industries",
    "media and entertainment",
    "creative",
  ],
  fashion: ["fashion and beauty", "fashion"],
  health: ["health and wellness", "pharmaceuticals", "health"],
  government: ["government and public sector", "government"],
  hospitality: ["hospitality and tourism", "hospitality"],
  entrepreneurs: ["entrepreneurs", "young professionals"],
  diaspora: [
    "diaspora",
    "diaspora uk",
    "diaspora france",
    "diaspora north america",
    "diaspora europe",
    "diaspora americas",
  ],
  entertainment: ["media and entertainment", "entertainment", "culture"],
};

function expand(values: string[]): Set<string> {
  const out = new Set<string>();
  for (const v of values) {
    const n = norm(v);
    if (!n || n === "other") continue;
    out.add(n);
    for (const [k, group] of Object.entries(SYNONYMS)) {
      if (n === k || group.includes(n)) {
        out.add(k);
        for (const g of group) out.add(g);
      }
    }
  }
  return out;
}

/**
 * Overlap relative to the smaller side: a sponsor interested in one sector
 * that the event covers is a full match on that field, not 1/20th of one.
 */
export function setOverlap(a: string[], b: string[]): { score: number; shared: string[] } {
  const A = expand(a);
  const B = expand(b);
  if (!A.size || !B.size) return { score: 0, shared: [] };
  // Count shared originals on the subject side for a readable Why line.
  const shared = a.filter((x) => {
    const e = expand([x]);
    return [...e].some((t) => B.has(t));
  });
  const otherShared = b.filter((x) => [...expand([x])].some((t) => A.has(t)));
  const sizes = [
    a.filter((x) => norm(x) && norm(x) !== "other").length,
    b.filter((x) => norm(x) && norm(x) !== "other").length,
  ];
  const lo = Math.min(...sizes);
  const hi = Math.max(...sizes);
  const hits = Math.max(shared.length, otherShared.length);
  if (!lo) return { score: 0, shared };
  // Mostly relative to the smaller side, with a quarter weight on the larger
  // so a broad overlap still ranks above a narrow one.
  const score = Math.min(1, 0.75 * Math.min(1, hits / lo) + 0.25 * Math.min(1, hits / hi));
  return { score, shared };
}

/** Bands like "₦5M–₦10M" or "$25K–$100K" → [low, high] in the band's own units. */
export function parseBand(band: string): { currency: string; low: number; high: number } | null {
  if (!band) return null;
  const currency = band.includes("₦")
    ? "NGN"
    : band.includes("$")
      ? "USD"
      : band.includes("£")
        ? "GBP"
        : band.includes("€")
          ? "EUR"
          : "";
  const nums = [...band.matchAll(/(\d+(?:\.\d+)?)\s*([KkMm]?)/g)].map((m) => {
    const n = Number(m[1]);
    const mult = /k/i.test(m[2]) ? 1e3 : /m/i.test(m[2]) ? 1e6 : 1;
    return n * mult;
  });
  if (!nums.length) return null;
  if (/under/i.test(band)) return { currency, low: 0, high: nums[0] };
  if (/\+/.test(band) && nums.length === 1) return { currency, low: nums[0], high: nums[0] * 4 };
  return { currency, low: nums[0], high: nums[nums.length - 1] };
}

/**
 * How close two budget bands are, after converting both to USD
 * (TAB 12 §12.3: compared "in a common comparison currency at scoring time").
 */
export function bandProximity(
  a: string,
  b: string,
  toUsd: (amount: number, currency: string) => number | null,
): number {
  const A = parseBand(a);
  const B = parseBand(b);
  if (!A || !B) return 0;
  const a0 = toUsd(A.low, A.currency || "USD");
  const a1 = toUsd(A.high, A.currency || "USD");
  const b0 = toUsd(B.low, B.currency || "USD");
  const b1 = toUsd(B.high, B.currency || "USD");
  if (a0 == null || a1 == null || b0 == null || b1 == null) return 0;
  if (a1 >= b0 && b1 >= a0) return 1; // ranges overlap
  // Ratio of the gap to the larger range: one band apart still scores.
  const gap = a1 < b0 ? b0 / Math.max(a1, 1) : a0 / Math.max(b1, 1);
  return gap <= 2 ? 0.6 : gap <= 5 ? 0.3 : 0;
}

export function score(
  signals: FieldSignal[],
  weights: { primary: number; secondary: number },
): ScoreResult {
  const primary = signals.filter((s) => s.primary);
  const secondary = signals.filter((s) => !s.primary);
  const explanations: Explanation[] = [];

  const run = (group: FieldSignal[], weight: number) => {
    // Fields neither side filled in carry no evidence either way, so they are
    // left out of the average rather than counted as a miss.
    const usable = group.filter((g) => g.subject.length && g.candidate.length);
    if (!usable.length) return 0;
    let total = 0;
    for (const g of usable) {
      const overlap = g.compare
        ? g.compare(g.subject, g.candidate)
        : setOverlap(g.subject, g.candidate).score;
      const shared = g.compare ? [] : setOverlap(g.subject, g.candidate).shared;
      const contribution = (overlap / usable.length) * weight;
      total += overlap;
      if (overlap > 0) {
        explanations.push({
          field: g.field,
          label: g.label,
          primary: g.primary,
          subjectValue: g.subject.join(", "),
          candidateValue: g.candidate.join(", "),
          overlap,
          contribution: Math.round(contribution * 10) / 10,
          internalText: `${g.label}: ${shared.length ? shared.join(", ") : `${g.subject.join(", ")} ↔ ${g.candidate.join(", ")}`} (${Math.round(overlap * 100)}% overlap)`,
          userText: shared.length
            ? `${g.label}: ${shared.slice(0, 3).join(", ")}`
            : `${g.label} fit`,
        });
      }
    }
    return (total / usable.length) * 100;
  };

  const base = run(primary, weights.primary);
  const sec = run(secondary, weights.secondary);
  const composite = Math.round((base * weights.primary + sec * weights.secondary) / 100);
  // Primary fields lead the Why line; within each, the biggest contributors.
  explanations.sort(
    (a, b) => Number(b.primary) - Number(a.primary) || b.contribution - a.contribution,
  );
  return {
    base: Math.round(base),
    secondary: Math.round(sec),
    composite: Math.max(0, Math.min(100, composite)),
    explanations,
  };
}

/** Joined, shortened Why line for the user-facing card (§19.5). */
export function whyLine(explanations: Explanation[], max = 3): string {
  const parts = explanations
    .filter((e) => e.userText)
    .slice(0, max)
    .map((e) => e.userText as string);
  return parts.length ? parts.join(" · ") : "A strong fit on what you both told IGE";
}
