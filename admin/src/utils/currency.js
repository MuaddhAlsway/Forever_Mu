// =========================================
// CURRENCY FORMATTING (ADMIN)
// =========================================
// Display only. Mirrors
// backend/config/storeConfig.js `formatMoney`
// and frontend/src/utils/currency.js so every
// surface renders the same amount identically.
//
// Historical orders keep their stored currency:
// the backend sends `displayCurrency`, which
// resolves an explicitly stored currency first
// (so a legacy SAR order stays SAR) and only then
// falls back.

const CURRENCY_PRESENTATION = {
  USD: { symbol: "$", decimals: 2, code: "USD" },
  SAR: { symbol: "SAR ", decimals: 2, code: "SAR" },
};

const DEFAULT_PRESENTATION = {
  symbol: "",
  decimals: 2,
  code: "USD",
};

export function getCurrencyPresentation(
  currency = "USD"
) {
  const code = String(currency || "USD")
    .toUpperCase();

  return (
    CURRENCY_PRESENTATION[code] ||
    DEFAULT_PRESENTATION
  );
}

export function isLegacyCurrency(currency) {
  return ["SAR"].includes(
    String(currency || "").toUpperCase()
  );
}

export function formatPrice(
  amount,
  currency = "USD",
  { withCode = true } = {}
) {
  const { symbol, decimals, code } =
    getCurrencyPresentation(currency);

  const value = Number(amount);
  const safe = Number.isFinite(value) ? value : 0;

  const formatted = safe.toFixed(decimals);

  return withCode
    ? `${symbol}${formatted} ${code}`
    : `${symbol}${formatted}`;
}

/**
 * The currency an order must be displayed in.
 *
 * Precedence: explicitly stored currency ->
 * backend-resolved displayCurrency -> SAR for
 * legacy rows.
 *
 * An order that carries no currency field at all
 * predates the USD switch, so it must never be
 * read as USD. A missing order defaults to USD
 * because that is the active checkout currency.
 */
export function orderCurrency(order) {
  const explicit = order?.displayCurrency || order?.currency;

  const fallback = order ? "SAR" : "USD";

  return String(explicit || fallback).toUpperCase();
}

/** Currency-correct amount for an order. */
export function orderAmount(order, field = "amount") {
  const preformatted =
    field === "amount"
      ? order?.formattedAmount
      : field === "subtotal"
      ? order?.formattedSubtotal
      : order?.formattedDeliveryFee;

  if (
    typeof preformatted === "string" &&
    preformatted.length > 0
  ) {
    return preformatted;
  }

  return formatPrice(
    order?.[field],
    orderCurrency(order)
  );
}

export default formatPrice;