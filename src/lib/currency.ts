// Dual-currency formatting helper.
// Always shows native amount with a parenthesised USD equivalent when available.

export type Rates = { ngn_rate?: number | null; gbp_rate?: number | null; eur_rate?: number | null } | null | undefined;

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
  const r = rates ?? {};
  if (currency === "NGN" && r.ngn_rate) return amount / Number(r.ngn_rate);
  if (currency === "GBP" && r.gbp_rate) return amount / Number(r.gbp_rate);
  if (currency === "EUR" && r.eur_rate) return amount / Number(r.eur_rate);
  return null;
}

export function fmtDual(currency: string, amount: number | null | undefined, rates: Rates): string {
  if (amount == null) return "—";
  const native = fmtMoney(currency, amount);
  if (currency === "USD") return native;
  const usd = toUsd(amount, currency, rates);
  return usd != null ? `${native} (≈ ${fmtMoney("USD", usd)})` : native;
}
