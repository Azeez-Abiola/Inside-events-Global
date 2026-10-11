/**
 * Fiscal quarters counted from the month a brand chose as the start of its
 * annual year (TAB 4 §4.1 Module 1, v6.3): "IGE then counts Q1 to Q4 from that
 * month, and every allocation slider, pace indicator, report and Business Case
 * uses those four quarters."
 */

export interface FiscalQuarter {
  /** 1–4 */
  q: number;
  /** Inclusive, YYYY-MM-DD. */
  start: string;
  /** Inclusive, YYYY-MM-DD. */
  end: string;
  /** e.g. "Apr – Jun 2026" */
  label: string;
}

const iso = (y: number, m0: number, d: number) =>
  new Date(Date.UTC(y, m0, d)).toISOString().slice(0, 10);

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** The four quarters of the fiscal year that contains `today`. */
export function fiscalYear(startMonth: number, today = new Date()): FiscalQuarter[] {
  const sm0 = Math.min(12, Math.max(1, startMonth)) - 1;
  const y = today.getUTCFullYear();
  // The fiscal year began this calendar year if we are past its start month.
  const startYear = today.getUTCMonth() >= sm0 ? y : y - 1;
  return [0, 1, 2, 3].map((i) => {
    const firstMonth = sm0 + i * 3;
    const sy = startYear + Math.floor(firstMonth / 12);
    const sm = firstMonth % 12;
    const lastMonth = firstMonth + 2;
    const ey = startYear + Math.floor(lastMonth / 12);
    const em = lastMonth % 12;
    return {
      q: i + 1,
      start: iso(sy, sm, 1),
      end: iso(ey, em + 1, 0),
      label: `${MONTHS[sm]} – ${MONTHS[em]} ${ey}`,
    };
  });
}

/** Which quarter `today` falls in, and how far through it we are (0–1). */
export function quarterProgress(startMonth: number, today = new Date()) {
  const quarters = fiscalYear(startMonth, today);
  const t = today.toISOString().slice(0, 10);
  const idx = Math.max(
    0,
    quarters.findIndex((q) => t >= q.start && t <= q.end),
  );
  const q = quarters[idx];
  const start = Date.parse(`${q.start}T00:00:00Z`);
  const end = Date.parse(`${q.end}T23:59:59Z`);
  const elapsed = Math.min(1, Math.max(0, (today.getTime() - start) / (end - start)));
  return { quarters, index: idx, elapsed };
}

export function quarterOf(date: string, quarters: FiscalQuarter[]): number | null {
  const d = date.slice(0, 10);
  const q = quarters.find((x) => d >= x.start && d <= x.end);
  return q ? q.q : null;
}

export type Pace = "on" | "ahead" | "behind";

/**
 * Burn rate against the quarter's allocation and the calendar date. The spec's
 * default alert threshold is 15% (TAB 4 §4.1 Module 3, Spend Pace Alert).
 */
export function spendPace(
  spent: number,
  allocation: number,
  elapsed: number,
  threshold = 0.15,
): { pace: Pace; expected: number; deviation: number } {
  const expected = allocation * elapsed;
  if (allocation <= 0 || expected <= 0) return { pace: "on", expected, deviation: 0 };
  const deviation = (spent - expected) / allocation;
  if (deviation > threshold) return { pace: "ahead", expected, deviation };
  if (deviation < -threshold) return { pace: "behind", expected, deviation };
  return { pace: "on", expected, deviation };
}
