// =========================================
// CURRENCY FORMATTING (FRONTEND)
// =========================================
// Display only. The backend remains the sole
// authority for every real amount and for which
// currency an order is denominated in; this only
// turns an already-trusted number + currency code
// into a string.
//
// Mirrors backend/config/storeConfig.js
// `formatMoney` so API values and locally
// computed previews render identically.
//
// Historical orders keep their stored currency:
// passing an order's displayCurrency renders that
// order in its own currency (e.g. legacy SAR)
// instead of relabelling it as USD.

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

/**
 * Format an amount with its currency symbol.
 *
 *   formatPrice(210, "USD") -> "$210.00 USD"
 *   formatPrice(360, "SAR") -> "SAR 360.00 SAR"
 *
 * @param {number} amount      major units
 * @param {string} [currency]  ISO-4217 code
 * @param {object} [options]
 * @param {boolean} [options.withCode=true]
 *        append the ISO code after the symbol
 */
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
 * Prefer an order's currency-correct string that
 * the API already computed, and fall back to
 * formatting locally.
 */
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

  const explicit = order?.displayCurrency || order?.currency;

  // An order with no currency field at all predates the USD
  // switch, so it must be read as SAR rather than USD.
  const currency = explicit || (order ? "SAR" : "USD");

  return formatPrice(order?.[field], currency);
}

export default formatPrice;