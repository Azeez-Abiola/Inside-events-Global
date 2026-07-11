type ProfileRow = {
  display_name?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
};

function filled(v: unknown) {
  if (v == null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === "number") return !Number.isNaN(v);
  return true;
}

function scoreWeighted(items: { weight: number; ok: boolean }[]) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  if (!total) return 0;
  const earned = items.reduce((s, i) => s + (i.ok ? i.weight : 0), 0);
  return Math.round((earned / total) * 100);
}

/** PRD §5.1 — profile completeness drives discoverability. */
export function computeProfileComplete(
  role: string,
  profile: ProfileRow | null | undefined,
  roleData: Record<string, unknown> | null | undefined,
): number {
  if (role === "abw_admin" || role === "super_admin") {
    return scoreWeighted([
      { weight: 50, ok: filled(profile?.display_name) },
      { weight: 50, ok: filled(profile?.avatar_url) || filled(profile?.email) },
    ]);
  }

  const base = scoreWeighted([
    { weight: 20, ok: filled(profile?.display_name) },
    { weight: 20, ok: filled(profile?.avatar_url) },
    { weight: 15, ok: filled(profile?.phone) },
    { weight: 25, ok: filled(profile?.linkedin_url) },
    { weight: 20, ok: filled(profile?.email) },
  ]);

  const rd = roleData ?? {};
  let roleScore = 0;

  if (role === "organiser") {
    roleScore = scoreWeighted([
      { weight: 30, ok: filled(rd.org_name) },
      { weight: 20, ok: filled(rd.bio) },
      { weight: 15, ok: filled(rd.website) },
      { weight: 20, ok: filled(rd.event_history) },
      { weight: 15, ok: filled(rd.logo_url) },
    ]);
  } else if (role === "sponsor") {
    roleScore = scoreWeighted([
      { weight: 25, ok: filled(rd.brand_name) },
      { weight: 15, ok: filled(rd.industry) },
      { weight: 10, ok: filled(rd.company_size) },
      { weight: 15, ok: filled(rd.hq_country) },
      { weight: 15, ok: filled(rd.sponsorship_sectors) },
      { weight: 10, ok: filled(rd.target_geographies) },
      { weight: 10, ok: filled(rd.budget_range_min) || filled(rd.budget_range_max) },
    ]);
  } else if (role === "referral_partner") {
    roleScore = scoreWeighted([
      { weight: 25, ok: filled(rd.full_name) },
      { weight: 15, ok: filled(rd.professional_title) },
      { weight: 20, ok: filled(rd.sector_expertise) },
      { weight: 20, ok: filled(rd.professional_bg) },
      { weight: 20, ok: filled(rd.sponsor_network_desc) },
    ]);
  } else if (role === "media_partner") {
    roleScore = scoreWeighted([
      { weight: 30, ok: filled(rd.outlet_name) },
      { weight: 15, ok: filled(rd.outlet_type) },
      { weight: 20, ok: filled(rd.beat_sectors) },
      { weight: 15, ok: filled(rd.portfolio_url) },
      { weight: 20, ok: filled(rd.bio) },
    ]);
  } else {
    roleScore = base;
  }

  return Math.min(100, Math.round(base * 0.35 + roleScore * 0.65));
}

export function completenessHint(role: string, score: number): string {
  if (score >= 90) return "Your profile is fully optimised for discoverability.";
  if (score >= 70) return "Almost there — add a few more details to maximise visibility.";
  if (score >= 40) return "Complete your role profile to improve matching and trust signals.";
  if (role === "sponsor") return "Sponsors with complete profiles get better event recommendations.";
  if (role === "organiser") return "Complete organiser details help sponsors evaluate your listings.";
  return "Fill in your account and role profile to unlock full platform features.";
}
