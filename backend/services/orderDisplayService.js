import {
  isLegacyCurrency,
  resolveOrderCurrency,
  formatMoney,
} from "../config/storeConfig.js";

/**
 * Order read/display projection.
 *
 * The store used to be SAR and is now USD, so a
 * stored order can be one of three cases:
 *
 *   1. `currency` explicitly stored as a legacy
 *      code (e.g. "SAR") -> displayed as SAR,
 *      never relabelled USD.
 *   2. `currency` explicitly stored as the
 *      current code ("USD") -> displayed as USD.
 *   3. no `currency` field at all -> written by
 *      the original SAR store, displayed as SAR
 *      via resolveOrderCurrency().
 *
 * Stored documents are never rewritten; this is a
 * read-time concern only. Formatted strings are
 * included so the browser never formats money
 * itself.
 */
export const toOrderDisplay = (order) => {
  if (!order) {
    return null;
  }

  const plain =
    typeof order.toObject === "function"
      ? order.toObject()
      : { ...order };

  const displayCurrency =
    resolveOrderCurrency(plain);

  // True when the resolved currency is not the
  // store's current one, so the UI can label it
  // as a historical amount.
  const currencyIsLegacy =
    isLegacyCurrency(displayCurrency);

  const hasSubtotal =
    plain.subtotal !== undefined &&
    plain.subtotal !== null;

  const hasDeliveryFee =
    plain.deliveryFee !== undefined &&
    plain.deliveryFee !== null;

  return {
    ...plain,

    // Authoritative display currency. Explicitly
    // stored legacy currency wins over the
    // store's current currency.
    displayCurrency,

    currencyIsLegacy,

    // Unknown subtotal/delivery splits stay null
    // rather than being invented as 0.
    subtotal: hasSubtotal ? plain.subtotal : null,
    deliveryFee: hasDeliveryFee
      ? plain.deliveryFee
      : null,

    // Pre-formatted strings, currency-correct.
    formattedAmount: formatMoney(
      plain.amount,
      displayCurrency
    ),
    formattedSubtotal: hasSubtotal
      ? formatMoney(plain.subtotal, displayCurrency)
      : null,
    formattedDeliveryFee: hasDeliveryFee
      ? formatMoney(plain.deliveryFee, displayCurrency)
      : null,
  };
};

export const toOrderDisplayList = (orders) =>
  Array.isArray(orders)
    ? orders.map(toOrderDisplay)
    : [];

export default toOrderDisplay;