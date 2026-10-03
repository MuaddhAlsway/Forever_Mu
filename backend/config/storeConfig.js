// =========================================
// STORE CONFIGURATION
// =========================================
// Single source of truth for money-related
// values. The backend is the ONLY authority.
// React may read these for display only.
// =========================================

// Currency used for every new order and for
// online payment providers.
//
// Historical orders keep whatever currency they
// were stored with; never reinterpret them.
export const CURRENCY = "USD";

// Lower-case ISO-4217 code required by the
// Stripe API (`currency`).
export const PROVIDER_CURRENCY = CURRENCY.toLowerCase();

// Currencies that no longer belong to this store
// but may still be attached to stored orders.
export const LEGACY_CURRENCIES = ["SAR"];

// Currency assumed for orders that predate the
// `currency` field entirely.
//
// Verified against the production database: the
// only currency-less orders were written by the
// original SAR store (they carry no `subtotal` /
// `deliveryFee` split either). They are therefore
// still SAR money and must not be relabelled USD.
//
// This is a READ-TIME fallback only. Stored
// documents are never rewritten.
export const LEGACY_FALLBACK_CURRENCY = "SAR";

// Flat delivery fee added to every order, in
// CURRENCY units (USD 10.00).
export const DELIVERY_FEE = 10;

// =========================================
// CURRENCY FORMATTING
// =========================================
// Single place that maps a currency code to its
// display symbol and decimal places. Used for
// every price the API returns so the frontend
// never has to guess.

const CURRENCY_PRESENTATION = {
  USD: { symbol: "$", decimals: 2, code: "USD" },
  SAR: { symbol: "SAR ", decimals: 2, code: "SAR" },
};

const DEFAULT_PRESENTATION = { symbol: "", decimals: 2, code: "USD" };

export function getCurrencyPresentation(currency = CURRENCY) {
  const code = String(currency || CURRENCY).toUpperCase();
  return CURRENCY_PRESENTATION[code] || DEFAULT_PRESENTATION;
}

export function isLegacyCurrency(currency) {
  return LEGACY_CURRENCIES.includes(
    String(currency || "").toUpperCase()
  );
}

/**
 * Resolve the currency an order must DISPLAY in.
 *
 * 1. An explicitly stored `currency` always wins,
 *    so a historical SAR order stays SAR.
 * 2. Only when the field is absent do we fall
 *    back to LEGACY_FALLBACK_CURRENCY.
 *
 * Every new order stores `currency` explicitly
 * (see computeTotals), so step 2 can never
 * affect a USD order.
 */
export function resolveOrderCurrency(order) {
  const stored =
    order && typeof order === "object"
      ? order.currency
      : order;

  const explicit = String(stored || "")
    .trim()
    .toUpperCase();

  if (explicit) {
    return explicit;
  }

  return LEGACY_FALLBACK_CURRENCY;
}

/**
 * Format a major-unit amount (100 -> "$100.00").
 * Defaults to the store currency so callers that
 * only care about new money can omit it.
 */
export function formatMoney(amount, currency = CURRENCY) {
  const { symbol, decimals, code } =
    getCurrencyPresentation(currency);
  const value = Number(amount);

  const safe = Number.isFinite(value) ? value : 0;
  const formatted = safe.toFixed(decimals);

  return `${symbol}${formatted} ${code}`;
}

// Guard rails for server-side order validation.
export const ORDER_LIMITS = {
  maxQuantityPerItem: 10,
  maxItemsPerOrder: 50,
};

// =========================================
// PAYMENT METHODS
// =========================================
// A payment method IS the provider. COD is
// settled internally; stripe is settled by
// Stripe Checkout. Stripe is the only online
// gateway.
// =========================================

export const PAYMENT_METHODS = [
  "cod",
  "stripe",
];

// =========================================
// PAYMENT STATUS
// =========================================
// Deliberately separate from the fulfilment
// `status` field (Order Placed -> Packing ->
// Shipped -> Out for Delivery -> Delivered).
// Fulfilment state must never imply payment
// state.
// =========================================

export const PAYMENT_STATUS = {
  PENDING: "pending",
  PAID: "paid",
  FAILED: "failed",
  CANCELLED: "cancelled",
  REFUNDED: "refunded",
  PARTIALLY_REFUNDED: "partially_refunded",
};

export const PAYMENT_STATUSES = [
  PAYMENT_STATUS.PENDING,
  PAYMENT_STATUS.PAID,
  PAYMENT_STATUS.FAILED,
  PAYMENT_STATUS.CANCELLED,
  PAYMENT_STATUS.REFUNDED,
  PAYMENT_STATUS.PARTIALLY_REFUNDED,
];

// Safe to expose to the browser.
export const publicStoreConfig = {
  currency: CURRENCY,
  deliveryFee: DELIVERY_FEE,
  paymentMethods: PAYMENT_METHODS,
};

export default publicStoreConfig;