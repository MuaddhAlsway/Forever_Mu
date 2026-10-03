import mongoose from "mongoose";

import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import {
  PAYMENT_STATUS,
  resolveOrderCurrency,
  formatMoney,
} from "../config/storeConfig.js";

// =========================================
// PAYMENT STATE UPDATES
// =========================================
// The ONLY place allowed to mark an order
// paid. Called from COD (never - COD is
// settled on delivery), the verified Stripe
// webhook, and a verified Stripe Session
// retrieval.
//
// Every transition:
//   - requires the order to exist
//   - requires the expected provider
//   - is idempotent
//   - clears the cart on first success only
// =========================================

/**
 * Resolve the cart to clear.
 *
 * For online payments we clear the user's
 * cart when the payment is confirmed, NOT
 * when the session was created, so a failed
 * or cancelled checkout never destroys the
 * basket.
 */
const clearCart = async (userId) => {
  await userModel.findByIdAndUpdate(userId, {
    cartData: {},
  });
};

/**
 * Mark an order paid.
 *
 * @param {string} orderId      internal MongoDB _id
 * @param {string} userId       owner, guards against cross-user writes
 * @param {object} options
 * @param {string} options.provider       expected paymentProvider
 * @param {string} options.reference      gateway reference id
 * @param {object} options.meta           extra gateway metadata
 * @param {boolean} options.clearCart     clear the persisted cart
 */
export const markOrderPaid = async (
  orderId,
  userId,
  {
    provider,
    reference,
    meta = {},
    clearCart: shouldClearCart = false,
  } = {}
) => {
  const order = await orderModel.findById(orderId);

  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
    };
  }

  // Ownership check.
  if (String(order.userId) !== String(userId)) {
    return {
      ok: false,
      code: "ORDER_NOT_OWNED",
    };
  }

  // Provider check: a capture from one gateway
  // must never mark another gateway's order
  // paid.
  if (
    provider &&
    order.paymentProvider &&
    order.paymentProvider !== provider
  ) {
    return {
      ok: false,
      code: "PROVIDER_MISMATCH",
    };
  }

  // Idempotency: already paid, nothing to do.
  if (
    order.paymentStatus === PAYMENT_STATUS.PAID
  ) {
    return {
      ok: true,
      alreadyPaid: true,
      order,
    };
  }

  const wasFirstSuccess =
    order.paymentStatus !== PAYMENT_STATUS.PAID;

  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.payment = true;

  if (reference) {
    order.paymentReference = reference;
  }

  order.paymentMeta = {
    ...(order.paymentMeta || {}),
    ...meta,
    paidAt: Date.now(),
  };

  await order.save();

  // Clear the cart only on the transition
  // into paid, so duplicate webhook
  // deliveries cannot wipe a cart the user
  // has since refilled.
  if (shouldClearCart && wasFirstSuccess) {
    await clearCart(userId);
  }

  return {
    ok: true,
    alreadyPaid: false,
    order,
  };
};

/**
 * Mark an order failed or cancelled.
 *
 * Used when a gateway reports an explicit
 * failure/cancellation. Never downgrades
 * an already-paid order.
 */
export const markOrderNotPaid = async (
  orderId,
  {
    provider,
    status = PAYMENT_STATUS.FAILED,
    reference,
    meta = {},
  } = {}
) => {
  const order = await orderModel.findById(orderId);

  if (!order) {
    return {
      ok: false,
      code: "ORDER_NOT_FOUND",
    };
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    return {
      ok: true,
      order,
    };
  }

  if (
    provider &&
    order.paymentProvider &&
    order.paymentProvider !== provider
  ) {
    return {
      ok: false,
      code: "PROVIDER_MISMATCH",
    };
  }

  order.paymentStatus = status;
  order.payment = false;

  if (reference) {
    order.paymentReference = reference;
  }

  order.paymentMeta = {
    ...(order.paymentMeta || {}),
    ...meta,
    updatedAt: Date.now(),
  };

  await order.save();

  return { ok: true, order };
};

/**
 * Public-safe payment projection.
 *
 * Never leaks gateway secrets or raw
 * metadata to customers. Admin surfaces may
 * use the fuller order document.
 */
export const toPaymentSummary = (order) => {
  const displayCurrency =
    resolveOrderCurrency(order);

  return {
    orderId: order._id,
    paymentMethod: order.paymentMethod,
    paymentProvider:
      order.paymentProvider || order.paymentMethod,
    paymentStatus:
      order.paymentStatus ||
      (order.payment
        ? PAYMENT_STATUS.PAID
        : PAYMENT_STATUS.PENDING),
    payment: Boolean(order.payment),
    currency: displayCurrency,
    // Legacy orders recorded only `amount`; their
    // subtotal/delivery split is genuinely unknown
    // so it is reported as null instead of a fake 0.
    subtotal:
      order.subtotal === undefined ||
      order.subtotal === null
        ? null
        : order.subtotal,
    deliveryFee:
      order.deliveryFee === undefined ||
      order.deliveryFee === null
        ? null
        : order.deliveryFee,
    amount: order.amount,
    formattedAmount: formatMoney(
      order.amount,
      displayCurrency
    ),
  };
};

export default {
  markOrderPaid,
  markOrderNotPaid,
  toPaymentSummary,
};