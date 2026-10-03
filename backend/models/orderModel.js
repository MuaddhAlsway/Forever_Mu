import mongoose from "mongoose";

import {
  PAYMENT_STATUS,
} from "../config/storeConfig.js";

const trackingSchema =
  new mongoose.Schema(
    {
      status: {
        type: String,
        required: true,
      },

      date: {
        type: Number,
        required: true,
      },
    },
    {
      _id: false,
    }
  );

const orderSchema =
  new mongoose.Schema(
    {
      userId: {
        type: String,
        required: true,
      },

      items: {
        type: Array,
        required: true,
      },

      address: {
        type: Object,
        required: true,
      },

      amount: {
        type: Number,
        required: true,
      },

      // =====================================
      // SERVER AUTHORITY FIELDS
      // =====================================
      // Written by the backend only.
      //
      // Deliberately NO schema defaults: a default
      // here would be materialised in memory when
      // a legacy order is read, which would make
      // currency-less historical orders look like
      // they were stored in the current currency.
      // Absent must stay absent so
      // resolveOrderCurrency() can tell "stored
      // SAR" apart from "never recorded".
      // Every new order sets these explicitly via
      // computeTotals().
      // =====================================

      currency: {
        type: String,
      },

      deliveryFee: {
        type: Number,
      },

      // Backend-calculated subtotal before
      // the delivery fee (amount = subtotal +
      // deliveryFee). Undefined on legacy orders
      // written before the totals split existed.
      subtotal: {
        type: Number,
      },

      status: {
        type: String,
        default:
          "Order Placed",
      },

      trackingHistory: {
        type: [
          trackingSchema,
        ],
        default: [],
      },

      // =====================================
      // PAYMENT
      // =====================================
      // Provider-independent by design. No
      // provider-specific columns: the
      // gateway's own identifiers live under
      // `paymentReference` / `paymentMeta`.
      //
      // Legacy COD orders predate
      // paymentProvider/paymentStatus and are
      // still readable; readers fall back to
      // paymentMethod + payment.
      // =====================================

      // "cod" | "stripe"
      paymentMethod: {
        type: String,
        default: "cod",
      },

      // Set for every new order. Equals
      // paymentMethod; kept separate so a
      // future method can route to another
      // provider without a schema change.
      paymentProvider: {
        type: String,
        default: null,
      },

      // pending | paid | failed |
      // cancelled | refunded |
      // partially_refunded
      // Independent of the fulfilment
      // `status` field above.
      paymentStatus: {
        type: String,
        default: PAYMENT_STATUS.PENDING,
      },

      // Legacy boolean kept for backwards
      // compatibility. Always mirrors
      // paymentStatus === "paid" on new
      // orders; never trusted as an input.
      payment: {
        type: Boolean,
        default: false,
      },

      // Gateway-side identifier, e.g. a
      // Stripe Checkout Session id. Internal MongoDB
      // _id is never stored here.
      paymentReference: {
        type: String,
        default: null,
      },

      // Gateway-owned metadata that does not
      // warrant its own column (session /
      // capture / payment-intent ids, event
      // ids, raw status strings).
      paymentMeta: {
        type: Object,
        default: {},
      },

      date: {
        type: Number,
        required: true,
      },
    },
    {
      minimize: false,
    }
  );

const orderModel =
  mongoose.models.order ||
  mongoose.model(
    "order",
    orderSchema
  );

export default orderModel;