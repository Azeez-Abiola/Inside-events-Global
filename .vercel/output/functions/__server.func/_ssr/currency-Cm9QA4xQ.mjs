function fmtMoney(currency, amount) {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
function toUsd(amount, currency, rates) {
  if (!amount && amount !== 0) return null;
  if (currency === "USD") return amount;
  const r = rates ?? {};
  if (currency === "NGN" && r.ngn_rate) return amount / Number(r.ngn_rate);
  if (currency === "GBP" && r.gbp_rate) return amount / Number(r.gbp_rate);
  if (currency === "EUR" && r.eur_rate) return amount / Number(r.eur_rate);
  return null;
}
function fmtDual(currency, amount, rates) {
  if (amount == null) return "-";
  const native = fmtMoney(currency, amount);
  if (currency === "USD") return native;
  const usd = toUsd(amount, currency, rates);
  return usd != null ? `${native} (≈ ${fmtMoney("USD", usd)})` : native;
}
export {
  fmtMoney as a,
  fmtDual as f
};
