import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from "../config/storeConfig.js";

import {
  buildTrustedItems,
  computeTotals,
  validateAddress,
  OrderValidationError,
} from "../services/orderTotalsService.js";

import {
  markOrderNotPaid,
  markOrderPaid,
  toPaymentSummary,
} from "../services/paymentStateService.js";

import {
  assertSessionMatchesOrder,
  constructStripeEvent,
  createCheckoutSession,
  isHandledEvent,
  isStripeConfigured,
  retrieveCheckoutSession,
  STRIPE_EVENTS,
} from "../services/payments/stripeService.js";

// =========================================
// PAYMENT CONTROLLER
// =========================================
// TRUST MODEL
// =========================================
// The CLIENT may send only:
//   items [{ _id, size, quantity }]
//   address
//
// NEVER TRUSTED from the client:
//   item.price, item.name, item.image,
//   amount, delivery fee, userId,
//   payment status, payment reference,
//   gateway return URLs
//
// Money maths always comes from
// orderTotalsService, the payment state always
// comes from paymentStateService, and the
// paid transition always comes from a VERIFIED
// Stripe event (webhook) or a verified Stripe
// Session retrieval. A success redirect by
// itself never marks an order paid.
// =========================================

const requireAuthUser = async (
  userId,
  res
) => {
  if (!userId) {
    res.status(401).json({
      success: false,
      message: "User not authorized",
    });
    return null;
  }

  const user = await userModel
    .findById(userId)
    .select("_id email cartData");

  if (!user) {
    res.status(401).json({
      success: false,
      message:
        "Authenticated user no longer exists",
    });
    return null;
  }

  return user;
};

const fail = (res, error) => {
  const statusCode =
    error?.statusCode ||
    (error instanceof OrderValidationError
      ? error.statusCode
      : 500);

  if (!statusCode || statusCode >= 500) {
    console.error(
      "Payment error:",
      error
    );
  }

  return res.status(statusCode).json({
    success: false,
    message: error.message,
  });
};

// =========================================
// STRIPE: CREATE CHECKOUT
// =========================================
// POST /api/payment/stripe/checkout
//
// Order of operations:
//   1. validate + compute trusted totals
//   2. save a PENDING order
//   3. create the Stripe Checkout Session
//   4. return the redirect URL
//
// The cart is NOT cleared here. It is cleared
// only when a verified payment arrives, so an
// abandoned checkout never empties the basket.
// =========================================

const createStripeCheckout = async (
  req,
  res
) => {
  try {
    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Stripe is not configured on this server",
      });
    }

    const user =
      await requireAuthUser(req.userId, res);

    if (!user) return;

    const { items, address } = req.body;

    // =========================
    // TRUSTED CALCULATION
    // =========================

    validateAddress(address);

    const trustedItems =
      await buildTrustedItems(items);

    const totals =
      computeTotals(trustedItems);

    const orderDate = Date.now();

    // =========================
    // PENDING ORDER
    // =========================
    // Created BEFORE the gateway session so a
    // webhook can always resolve an order.

    const savedOrder = await orderModel.create({
      userId: user._id,
      items: trustedItems,
      address,
      amount: totals.amount,
      currency: totals.currency,
      deliveryFee: totals.deliveryFee,
      subtotal: totals.subtotal,
      status: "Order Placed",
      trackingHistory: [
        {
          status: "Order Placed",
          date: orderDate,
        },
      ],
      paymentMethod: "stripe",
      paymentProvider: "stripe",
      paymentStatus: PAYMENT_STATUS.PENDING,
      payment: false,
      paymentReference: null,
      paymentMeta: {},
      date: orderDate,
    });

    // =========================
    // GATEWAY SESSION
    // =========================

    let session;

    try {
      session = await createCheckoutSession({
        trustedItems,
        totals,
        orderId: String(savedOrder._id),
        userId: String(user._id),
        email: address.email,
      });
    } catch (gatewayError) {
      // The order exists but no session was
      // created. Mark it cancelled so it never
      // lingers as an unpaid pending order.
      await markOrderNotPaid(savedOrder._id, {
        provider: "stripe",
        status: PAYMENT_STATUS.FAILED,
        meta: {
          failureReason:
            gatewayError.code || "session_create_failed",
        },
      });

      throw gatewayError;
    }

    savedOrder.paymentReference =
      session.id;

    savedOrder.paymentMeta = {
      checkoutSessionId: session.id,
      sessionStatus: session.status,
      sessionUrl: session.url,
    };

    await savedOrder.save();

    // =========================
    // RETURN REDIRECT
    // =========================

    return res.status(201).json({
      success: true,
      orderId: String(savedOrder._id),
      sessionId: session.id,
      // The browser is redirected here. The
      // order is NOT yet paid.
      redirectUrl: session.url,
      paymentStatus:
        savedOrder.paymentStatus,
      amount: totals.amount,
      currency: totals.currency,
    });
  } catch (error) {
    return fail(res, error);
  }
};

// =========================================
// STRIPE: SESSION STATUS
// =========================================
// GET /api/payment/stripe/session
//   ?orderId=<mongoId>&sessionId=<cs_...>
//
// Used by the success page to POLL the backend
// after redirect. This endpoint reads Stripe to
// confirm a payment that the webhook may not
// have delivered yet; it is idempotent and
// applies the exact same guards as the webhook.
//
// It still never trusts the browser: it only
// acts when Stripe itself reports the Session
// as paid and the amount/currency match.
// =========================================

const getStripeSessionStatus = async (
  req,
  res
) => {
  try {
    const user =
      await requireAuthUser(req.userId, res);

    if (!user) return;

    const { orderId, sessionId } =
      req.query;

    if (!orderId || !sessionId) {
      return res.status(400).json({
        success: false,
        message:
          "orderId and sessionId are required",
      });
    }

    // =========================
    // OWNERSHIP FIRST
    // =========================
    // Authorisation is resolved before any
    // provider configuration is consulted, so
    // another customer can never learn whether
    // an order exists from a 503.

    const order =
      await orderModel.findOne({
        _id: orderId,
        // Ownership: a customer can only ever
        // poll their own order.
        userId: user._id,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.paymentProvider !== "stripe" ||
      order.paymentMethod !== "stripe"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order was not paid with Stripe",
      });
    }

    // =========================
    // ALREADY PAID
    // =========================

    if (
      order.paymentStatus === PAYMENT_STATUS.PAID
    ) {
      return res.json({
        success: true,
        payment:
          toPaymentSummary(order),
      });
    }

    // =========================
    // PROVIDER CONFIG
    // =========================

    if (!isStripeConfigured()) {
      return res.status(503).json({
        success: false,
        message:
          "Stripe is not configured on this server",
      });
    }

    // =========================
    // READ THE SESSION FROM
    // STRIPE (NOT THE BROWSER)
    // =========================

    const session =
      await retrieveCheckoutSession(
        sessionId
      );

    // The Session must belong to this order.
    if (
      session.client_reference_id &&
      String(session.client_reference_id) !==
        String(order._id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Session does not belong to this order",
      });
    }

    const match =
      assertSessionMatchesOrder(
        session,
        order
      );

    if (!match.ok) {
      // Not paid yet, expired, or mismatched.
      // Never mark anything from here.
      return res.json({
        success: true,
        payment:
          toPaymentSummary(order),
        pending: true,
        reason: match.code,
      });
    }

    const result =
      await markOrderPaid(
        order._id,
        user._id,
        {
          provider: "stripe",
          reference: session.id,
          // Cart is cleared here: the payment is
          // verified server-side.
          clearCart: true,
          meta: {
            checkoutSessionId: session.id,
            amountTotal:
              session.amount_total,
            currency: session.currency,
            verifiedBy: "session_status",
          },
        }
      );

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message:
          "Payment could not be applied",
        code: result.code,
      });
    }

    return res.json({
      success: true,
      payment:
        toPaymentSummary(result.order),
    });
  } catch (error) {
    return fail(res, error);
  }
};

// =========================================
// STRIPE: CANCEL
// =========================================
// POST /api/payment/stripe/cancel
//   { orderId }
//
// The browser calling this does NOT decide the
// order state; the order is only moved to
// 'cancelled' when Stripe has not reported a
// successful payment.
// =========================================

const cancelStripeCheckout = async (
  req,
  res
) => {
  try {
    const user =
      await requireAuthUser(req.userId, res);

    if (!user) return;

    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const order =
      await orderModel.findOne({
        _id: orderId,
        userId: user._id,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (
      order.paymentProvider !== "stripe"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order was not paid with Stripe",
      });
    }

    // A verified payment always wins over a
    // cancel click.
    if (
      order.paymentStatus === PAYMENT_STATUS.PAID
    ) {
      return res.json({
        success: true,
        message:
          "Payment already confirmed",
        payment:
          toPaymentSummary(order),
      });
    }

    const result =
      await markOrderNotPaid(order._id, {
        provider: "stripe",
        status: PAYMENT_STATUS.CANCELLED,
        meta: {
          cancelledBy: "user",
        },
      });

    return res.json({
      success: true,
      message:
        "Checkout cancelled",
      payment:
        toPaymentSummary(result.order),
    });
  } catch (error) {
    return fail(res, error);
  }
};

// =========================================
// STRIPE: WEBHOOK
// =========================================
// POST /api/payment/stripe/webhook
//
// Authoritative. This is the ONLY source that
// may settle an order without the customer
// polling afterwards.
//
// Events handled:
//   checkout.session.completed
//   checkout.session.async_payment_succeeded
//   checkout.session.async_payment_failed
//   checkout.session.expired
//
// Official guidance followed:
//   - verify the Stripe-Signature against the
//     RAW body
//   - return 2xx quickly
//   - ignore unhandled event types
//   - be idempotent (event ids are stored)
//   - do not depend on event ordering
// =========================================

const stripeWebhook = async (
  req,
  res
) => {
  let event;

  // =========================
  // VERIFY SIGNATURE
  // =========================

  try {
    event = constructStripeEvent(
      req.body,
      req.headers["stripe-signature"]
    );
  } catch (error) {
    console.warn(
      "Stripe webhook rejected:",
      error.message
    );

    return res.status(400).json({
      success: false,
      message:
        "Webhook signature verification failed",
    });
  }

  // =========================
  // IGNORE UNHANDLED TYPES
  // =========================

  if (!isHandledEvent(event.type)) {
    return res.json({
      success: true,
      ignored: true,
      type: event.type,
    });
  }

  // =========================
  // DUPLICATE DELIVERY GUARD
  // =========================
  // Stripe retries failed deliveries and can
  // resend on demand, so the same event id may
  // arrive more than once.

  const eventId = event.id;

  const duplicate = await orderModel.findOne({
    "paymentMeta.processedEvents": eventId,
  });

  if (duplicate) {
    return res.json({
      success: true,
      duplicate: true,
      eventId,
    });
  }

  const session = event.data.object;

  const metaOrderId =
    session?.metadata?.orderId || null;

  const refOrderId =
    session?.client_reference_id || null;

  // Stripe sets both when we create the Session.
  // If they ever disagree the payload cannot be
  // trusted to identify our order, so refuse it
  // rather than guessing.
  if (
    metaOrderId &&
    refOrderId &&
    String(metaOrderId) !==
      String(refOrderId)
  ) {
    return res.json({
      success: true,
      ignored: true,
      reason: "conflicting_order_reference",
    });
  }

  const orderId = metaOrderId || refOrderId;

  if (!orderId) {
    return res.json({
      success: true,
      ignored: true,
      reason: "no_order_reference",
    });
  }

  const order =
    await orderModel.findById(orderId);

  if (!order) {
    return res.json({
      success: true,
      ignored: true,
      reason: "order_not_found",
    });
  }

  // `paymentMeta` is a Mixed path, so nested
  // mutation is NOT persisted by Mongoose.
  // Every write must replace the whole object
  // and/or mark the path modified.
  const recordEvent = (target, extra = {}) => {
    const current = target.paymentMeta || {};

    const processed = Array.isArray(
      current.processedEvents
    )
      ? current.processedEvents
      : [];

    if (!processed.includes(eventId)) {
      processed.push(eventId);
    }

    // Keep the list bounded.
    target.paymentMeta = {
      ...current,
      ...extra,
      processedEvents: processed.slice(-20),
    };

    target.markModified("paymentMeta");
  };

  // =========================
  // APPLY THE EVENT
  // =========================

  if (
    event.type ===
      STRIPE_EVENTS.COMPLETED ||
    event.type ===
      STRIPE_EVENTS.ASYNC_PAYMENT_SUCCEEDED
  ) {
    const match =
      assertSessionMatchesOrder(
        session,
        order
      );

    if (!match.ok) {
      // Do not settle on a mismatch. Record it
      // for operators.
      recordEvent(order, {
        lastMismatch: {
          code: match.code,
          expected: match.expected,
          received: match.received,
          eventId,
          at: Date.now(),
        },
      });

      await order.save();

      console.warn(
        "Stripe session did not match order:",
        match
      );

      return res.json({
        success: true,
        ignored: true,
        reason: match.code,
      });
    }

    const result = await markOrderPaid(
      order._id,
      order.userId,
      {
        provider: "stripe",
        reference: session.id,
        // Webhook is authoritative, so the cart
        // is cleared on the verified payment.
        clearCart: true,
        meta: {
          checkoutSessionId: session.id,
          amountTotal: session.amount_total,
          currency: session.currency,
          paymentIntent:
            session.payment_intent || null,
          verifiedBy: "webhook",
          eventType: event.type,
        },
      }
    );

    if (result.ok) {
      const saved = await orderModel.findById(
        order._id
      );
      recordEvent(saved, {
        eventType: event.type,
      });
      await saved.save();
    }

    return res.json({
      success: true,
      received: true,
      eventType: event.type,
      alreadyPaid: result.alreadyPaid,
    });
  }

  if (
    event.type ===
      STRIPE_EVENTS.EXPIRED ||
    event.type ===
      STRIPE_EVENTS.ASYNC_PAYMENT_FAILED
  ) {
    const result =
      await markOrderNotPaid(order._id, {
        provider: "stripe",
        status:
          event.type === STRIPE_EVENTS.EXPIRED
            ? PAYMENT_STATUS.CANCELLED
            : PAYMENT_STATUS.FAILED,
        reference: session.id,
        meta: {
          eventType: event.type,
          eventId,
        },
      });

    if (result.ok) {
      const saved = await orderModel.findById(
        order._id
      );
      recordEvent(saved);
      await saved.save();
    }

    return res.json({
      success: true,
      received: true,
      eventType: event.type,
    });
  }

  return res.json({
    success: true,
    ignored: true,
    type: event.type,
  });
};

// =========================================
// PROVIDER AVAILABILITY
// =========================================
// GET /api/payment/methods
//
// Tells the frontend which online providers the
// BACKEND can actually process right now. This
// is server configuration, never a client guess.
// =========================================

const paymentMethods = async (
  req,
  res
) => {
  return res.json({
    success: true,
    paymentMethods: PAYMENT_METHODS,
    online: {
      stripe: isStripeConfigured(),
    },
  });
};

export {
  createStripeCheckout,
  getStripeSessionStatus,
  cancelStripeCheckout,
  stripeWebhook,
  paymentMethods,
};
