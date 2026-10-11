/**
 * IGE ROI Score maths (TAB 8 §8.3). Pure, so it can be tested and reused on
 * screen without a server round trip.
 */

export interface ScoredObjective {
  spend_weight_pct: number;
  target_value: number | null;
  achieved_value: number | null;
}

/**
 * Per-objective return: achieved over target, capped at 2× so one runaway
 * metric cannot carry the whole scorecard. Null where there is no target yet.
 */
export function objectiveReturn(
  o: Pick<ScoredObjective, "target_value" | "achieved_value">,
): number | null {
  if (o.target_value == null || o.achieved_value == null || o.target_value <= 0) return null;
  return Math.min(2, o.achieved_value / o.target_value);
}

/**
 * IGE ROI Score (1–100): the spend-weighted return across objectives, scaled
 * so hitting every target exactly scores 70 and doubling every target scores
 * 100. Deliberately simple and explainable; secondary to the ROO breakdown.
 */
export function roiScore(objectives: ScoredObjective[]): number | null {
  const scored = objectives.filter((o) => objectiveReturn(o) != null);
  if (!scored.length) return null;
  const weight = scored.reduce((n, o) => n + o.spend_weight_pct, 0) || 1;
  const blended =
    scored.reduce((n, o) => n + (objectiveReturn(o) as number) * o.spend_weight_pct, 0) / weight;
  return Math.max(
    1,
    Math.min(100, Math.round(blended <= 1 ? blended * 70 : 70 + (blended - 1) * 30)),
  );
}
