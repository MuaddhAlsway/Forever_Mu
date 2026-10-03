import Stripe from "stripe";

import {
  resolveOrderCurrency,
} from "../../config/storeConfig.js";

// =========================================
// STRIPE SERVICE
// =========================================
// One-off (single payment) ecommerce using
// Stripe Checkout Sessions with a redirect.
//
// Official references:
// Sessions API
//   https://docs.stripe.com/api/checkout/sessions
// Webhook signature verification
//   https://docs.stripe.com/webhooks#verify-official-libraries
// Local testing
//   stripe listen --forward-to localhost:4000/api/payment/stripe/webhook
//
// No subscriptions, no Billing, no Connect,
// no Terminal. Only single payments.
//
// STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET
// are read from the environment and are never
// returned to the browser.
// =========================================

// Session ids we accept from our own success /
// cancel pages. Anything else is ignored.
const METADATA_ORDER_ID = "orderId";
const METADATA_USER_ID = "userId";

// Event types this integration acts on.
// Handlers are registered only for these.
export const STRIPE_EVENTS = {
  COMPLETED: "checkout.session.completed",
  EXPIRED: "checkout.session.expired",
  ASYNC_PAYMENT_SUCCEEDED:
    "checkout.session.async_payment_succeeded",
  ASYNC_PAYMENT_FAILED:
    "checkout.session.async_payment_failed",
};

const HANDLED_EVENTS = new Set(
  Object.values(STRIPE_EVENTS)
);

// =========================================
// CONFIG
// =========================================

export const getStripeConfig = () => ({
  secretKey:
    process.env.STRIPE_SECRET_KEY || "",
  webhookSecret:
    process.env.STRIPE_WEBHOOK_SECRET || "",
  frontendUrl: (
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, ""),
});

// A full-privilege secret key is required to
// create Checkout Sessions. Restricted (rk_)
// keys cannot.
export const isStripeConfigured = () =>
  Boolean(getStripeConfig().secretKey);

let stripeClient = null;

export const getStripe = () => {
  const { secretKey } = getStripeConfig();

  if (!secretKey) {
    const error = new Error(
      "Stripe is not configured. Set STRIPE_SECRET_KEY in the backend environment."
    );
    error.code = "STRIPE_NOT_CONFIGURED";
    error.statusCode = 503;
    throw error;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
};

// Signature verification is a purely local HMAC
// computation and needs ONLY the endpoint
// signing secret. It must keep working even if
// the API key is absent, otherwise a correctly
// signed webhook would be rejected with a
// misleading "not configured" error and Stripe
// would retry it for hours.
//
// The SDK requires a non-empty key string at
// construction time but never uses it for
// constructEvent, so a placeholder is safe
// here and is never sent anywhere.
const WEBHOOK_PLACEHOLDER_KEY =
  "sk_test_webhook_verification_only";

let webhookVerifier = null;

const getWebhookVerifier = () => {
  if (!webhookVerifier) {
    webhookVerifier = new Stripe(
      getStripeConfig().secretKey ||
        WEBHOOK_PLACEHOLDER_KEY
    );
  }

  return webhookVerifier;
};

// =========================================
// ERRORS
// =========================================

export class StripeApiError extends Error {
  constructor(message, {
    status,
    type,
    code,
    statusCode = 502,
  } = {}) {
    super(message);
    this.name = "StripeApiError";
    this.stripeStatus = status;
    this.stripeType = type;
    this.stripeCode = code;
    this.statusCode = statusCode;
  }
}

// =========================================
// SIGNATURE VERIFICATION
// =========================================
// Stripe signs the RAW request body. The
// caller must pass the unparsed Buffer; see
// the raw-body middleware on the webhook
// route in paymentRoute.js.
// =========================================

export const constructStripeEvent = (
  rawBody,
  signatureHeader
) => {
  const { webhookSecret } = getStripeConfig();

  if (!webhookSecret) {
    const error = new Error(
      "Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET in the backend environment."
    );
    error.code = "STRIPE_WEBHOOK_NOT_CONFIGURED";
    error.statusCode = 503;
    throw error;
  }

  if (!signatureHeader) {
    const error = new Error(
      "Missing Stripe-Signature header"
    );
    error.code = "STRIPE_SIGNATURE_MISSING";
    error.statusCode = 400;
    throw error;
  }

  try {
    return getWebhookVerifier().webhooks.constructEvent(
      // Stripe requires the exact bytes sent.
      rawBody,
      signatureHeader,
      webhookSecret
    );
  } catch (error) {
    const wrapped = new Error(
      `Stripe signature verification failed: ${error.message}`
    );
    wrapped.code = "STRIPE_SIGNATURE_INVALID";
    wrapped.statusCode = 400;
    throw wrapped;
  }
};

// =========================================
// CHECKOUT SESSION
// =========================================
// Every amount below is server-calculated.
// The client never supplies a price.
// =========================================

/**
 * Build the Checkout Session request body.
 *
 * Pure function: returns exactly what will be
 * sent to Stripe so the payload can be asserted
 * in tests without contacting Stripe.
 *
 * Money is converted to the currency's minor
 * unit (Stripe expects halalas for SAR), and
 * the line items always sum to exactly the
 * server-calculated total.
 */
export const buildCheckoutSessionParams = ({
  trustedItems,
  totals,
  orderId,
  userId,
  email,
}) => {
  const { frontendUrl } = getStripeConfig();

  // Stripe expects a lower-case currency code.
  const currency = String(
    totals.currency
  ).toLowerCase();

  const lineItems = trustedItems.map((item) => ({
    quantity: item.quantity,
    price_data: {
      currency,
      unit_amount: toMinorUnits(item.price),
      product_data: {
        name: item.name,
        ...(Array.isArray(item.image) &&
        item.image[0]
          ? { images: [item.image[0]] }
          : {}),
      },
    },
  }));

  // The delivery fee is its own line so the
  // Stripe total always equals the server
  // total exactly, with no rounding drift.
  if (totals.deliveryFee > 0) {
    lineItems.push({
      quantity: 1,
      price_data: {
        currency,
        unit_amount: toMinorUnits(
          totals.deliveryFee
        ),
        product_data: {
          name: "Delivery fee",
        },
      },
    });
  }

  return {
    mode: "payment",
    line_items: lineItems,
    customer_email: email || undefined,
    // Lets Stripe show the order reference and
    // gives the webhook a second way to find the
    // order.
    client_reference_id: String(orderId),
    success_url: `${frontendUrl}/payment/stripe/success?order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/payment/stripe/cancel?order_id=${orderId}`,
    metadata: {
      [METADATA_ORDER_ID]: String(orderId),
      [METADATA_USER_ID]: String(userId),
    },
    // One-off payment only. 30 minutes matches
    // Stripe's minimum for expires_at and keeps
    // abandoned sessions from lingering.
    expires_at: Math.floor(
      Date.now() / 1000 + 30 * 60
    ),
  };
};

/**
 * @param {object} params
 * @param {object} params.trustedItems  from buildTrustedItems()
 * @param {object} params.totals        from computeTotals()
 * @param {string} params.orderId       internal MongoDB _id
 * @param {string} params.userId
 * @param {string} params.email
 */
export const createCheckoutSession = async (
  params
) => {
  const sessionParams =
    buildCheckoutSessionParams(params);

  try {
    return await getStripe().checkout.sessions.create(
      sessionParams
    );
  } catch (error) {
    throw new StripeApiError(
      error.message ||
        "Failed to create Stripe Checkout Session",
      {
        status: error.statusCode,
        type: error.type,
        code: error.code,
      }
    );
  }
};

// =========================================
// SESSION READ (for verification)
// =========================================

export const retrieveCheckoutSession = (
  sessionId
) => {
  try {
    return getStripe().checkout.sessions.retrieve(
      sessionId
    );
  } catch (error) {
    throw new StripeApiError(
      error.message ||
        "Failed to retrieve Stripe Checkout Session",
      {
        status: error.statusCode,
        type: error.type,
        code: error.code,
      }
    );
  }
};

// =========================================
// EVENT HELPERS
// =========================================

export const isHandledEvent = (type) =>
  HANDLED_EVENTS.has(type);

/**
 * Smallest currency unit comparison.
 *
 * amount_total arrives in the currency's minor
 * unit (e.g. cents), while our stored totals are
 * major units (USD). Comparing in minor units
 * avoids float drift.
 */
export const toMinorUnits = (major) =>
  Math.round(Number(major) * 100);

export const assertSessionMatchesOrder = (
  session,
  order
) => {
  const expectedAmount = toMinorUnits(
    order.amount
  );
  const receivedAmount = session.amount_total;

  if (receivedAmount !== expectedAmount) {
    return {
      ok: false,
      code: "AMOUNT_MISMATCH",
      expected: expectedAmount,
      received: receivedAmount,
    };
  }

  const receivedCurrency =
    String(session.currency || "")
      .toLowerCase();

  // Compare against the currency the ORDER was
  // actually stored in, never the store's current
  // currency. A historical SAR order must not be
  // validated against USD.
  const expectedCurrency =
    resolveOrderCurrency(order).toLowerCase();

  if (receivedCurrency !== expectedCurrency) {
    return {
      ok: false,
      code: "CURRENCY_MISMATCH",
      expected: expectedCurrency,
      received: receivedCurrency,
    };
  }

  // payment_status on a Checkout Session is
  // one of: paid, unpaid, no_payment_required.
  if (session.payment_status !== "paid") {
    return {
      ok: false,
      code: "SESSION_NOT_PAID",
      received: session.payment_status,
    };
  }

  return { ok: true };
};

export default {
  getStripeConfig,
  isStripeConfigured,
  getStripe,
  constructStripeEvent,
  buildCheckoutSessionParams,
  createCheckoutSession,
  retrieveCheckoutSession,
  isHandledEvent,
  assertSessionMatchesOrder,
  toMinorUnits,
  STRIPE_EVENTS,
};