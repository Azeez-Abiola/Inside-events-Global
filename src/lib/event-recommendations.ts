export type SponsorMatchContext = {
  sponsorship_sectors: string[];
  target_geographies: string[];
  budget_range_min: number | null;
  budget_range_max: number | null;
  preferred_currency?: string;
  profile_complete: number;
};

export type EventForMatch = {
  id: string;
  primary_sector?: string | null;
  country?: string | null;
  city?: string | null;
  attendance_size?: number | null;
  organiser_id?: string | null;
  starting?: { price: number; currency: string } | null;
  created_at?: string;
  start_date?: string | null;
};

function norm(s: string | null | undefined) {
  return (s ?? "").trim().toLowerCase();
}

function geoMatch(targetGeos: string[], country: string | null | undefined) {
  const c = norm(country);
  if (!c || !targetGeos.length) return 0;
  const geos = targetGeos.map(norm);
  if (geos.includes(c)) return 25;
  if (geos.some((g) => g.includes("global") || g === "worldwide")) return 12;
  if (geos.some((g) => g.includes("africa") && (c.includes("nigeria") || c.includes("kenya") || c.includes("south africa")))) return 15;
  if (geos.some((g) => g.includes("europe") && (c.includes("uk") || c.includes("france") || c.includes("germany")))) return 15;
  return 0;
}

function sectorMatch(sectors: string[], primary: string | null | undefined) {
  const p = norm(primary);
  if (!p || !sectors.length) return 0;
  const list = sectors.map(norm);
  if (list.includes(p)) return 35;
  if (list.some((s) => p.includes(s) || s.includes(p))) return 18;
  return 0;
}

function budgetMatch(
  min: number | null,
  max: number | null,
  starting: { price: number; currency: string } | null | undefined,
) {
  if (!starting?.price) return 4;
  const price = Number(starting.price);
  const ceiling = max ?? min;
  const floor = min ?? 0;
  if (ceiling && price <= ceiling && price >= floor * 0.8) return 20;
  if (ceiling && price <= ceiling * 1.25) return 12;
  if (floor && price >= floor) return 8;
  return 2;
}

/** Weighted sponsor–event fit (non-AI). PRD discoverability signals. */
export function scoreEventForSponsor(
  event: EventForMatch,
  ctx: SponsorMatchContext,
  organiserComplete = 0,
): number {
  let score = 0;
  score += sectorMatch(ctx.sponsorship_sectors, event.primary_sector);
  score += geoMatch(ctx.target_geographies, event.country);
  score += budgetMatch(ctx.budget_range_min, ctx.budget_range_max, event.starting ?? null);
  score += Math.round((ctx.profile_complete / 100) * 10);
  score += Math.round((organiserComplete / 100) * 10);
  if ((event.attendance_size ?? 0) >= 500) score += 3;
  return Math.min(100, score);
}

export function rankEventsForSponsor<T extends EventForMatch>(
  events: T[],
  ctx: SponsorMatchContext,
  organiserCompleteMap: Record<string, number> = {},
): (T & { matchScore: number })[] {
  return events
    .map((e) => ({
      ...e,
      matchScore: scoreEventForSponsor(e, ctx, organiserCompleteMap[e.organiser_id ?? ""] ?? 0),
    }))
    .sort((a, b) => b.matchScore - a.matchScore);
}

/** Boost listings from organisers with complete profiles (secondary discoverability). */
export function applyOrganiserDiscoverability<T extends { organiser_id?: string | null }>(
  events: T[],
  organiserCompleteMap: Record<string, number>,
): T[] {
  return [...events].sort((a, b) => {
    const ac = organiserCompleteMap[a.organiser_id ?? ""] ?? 0;
    const bc = organiserCompleteMap[b.organiser_id ?? ""] ?? 0;
    return bc - ac;
  });
}
