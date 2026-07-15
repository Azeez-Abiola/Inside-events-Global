// Dual-currency formatting helper.
// Exchange rates are stored as "1 USD → quote" (see admin FX panel).

export type Rates = { ngn_rate?: number | null; gbp_rate?: number | null; eur_rate?: number | null } | null | undefined;

export type DisplayCurrency = "USD" | "NGN" | "EUR";

export const DISPLAY_CURRENCIES: { code: DisplayCurrency; label: string; short: string }[] = [
  { code: "USD", label: "US Dollar", short: "USD" },
  { code: "NGN", label: "Nigerian Naira", short: "NGN" },
  { code: "EUR", label: "Euro", short: "EUR" },
];

export const DISPLAY_CURRENCY_STORAGE_KEY = "ige-display-currency";

const DEFAULT_RATES: Required<Pick<NonNullable<Rates>, "ngn_rate" | "gbp_rate" | "eur_rate">> = {
  ngn_rate: 1650,
  gbp_rate: 0.79,
  eur_rate: 0.92,
};

export function fmtMoney(currency: string, amount: number) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function toUsd(amount: number, currency: string, rates: Rates): number | null {
  if (!amount && amount !== 0) return null;
  if (currency === "USD") return amount;
  const r = { ...DEFAULT_RATES, ...(rates ?? {}) };
  if (currency === "NGN" && r.ngn_rate) return amount / Number(r.ngn_rate);
  if (currency === "GBP" && r.gbp_rate) return amount / Number(r.gbp_rate);
  if (currency === "EUR" && r.eur_rate) return amount / Number(r.eur_rate);
  return null;
}

/** Convert a USD-normalised amount into the user's selected display currency. */
export function fromUsd(usd: number, display: DisplayCurrency, rates: Rates): number {
  if (display === "USD") return usd;
  const r = { ...DEFAULT_RATES, ...(rates ?? {}) };
  if (display === "NGN") return usd * Number(r.ngn_rate);
  if (display === "EUR") return usd * Number(r.eur_rate);
  return usd;
}

export function fmtUsdAmount(usd: number | null | undefined, display: DisplayCurrency, rates: Rates): string {
  if (usd == null || Number.isNaN(usd)) return "—";
  return fmtMoney(display, fromUsd(usd, display, rates));
}

export function fmtDual(currency: string, amount: number | null | undefined, rates: Rates): string {
  if (amount == null) return "-";
  const native = fmtMoney(currency, amount);
  if (currency === "USD") return native;
  const usd = toUsd(amount, currency, rates);
  return usd != null ? `${native} (≈ ${fmtMoney("USD", usd)})` : native;
}

/** Dynamic label suffix for KPI tiles, e.g. "Deal volume (GMV)" → "Deal volume (GMV, NGN)" */
export function currencyLabelSuffix(display: DisplayCurrency) {
  return display === "USD" ? "" : ` (${display})`;
}
