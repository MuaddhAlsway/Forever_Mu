import express from "express";

import {
  cancelStripeCheckout,
  createStripeCheckout,
  getStripeSessionStatus,
  paymentMethods,
  stripeWebhook,
} from "../controller/paymentController.js";

import authUser from "../middleware/auth.js";

// =========================================
// PAYMENT ROUTES
// =========================================
// IMPORTANT: this router is mounted in
// server.js BEFORE express.json() so the
// Stripe webhook receives the raw body it
// needs for signature verification.
//
// Every route except the webhook and the
// public method list requires a logged-in
// customer, and every amount is recomputed
// server-side.
// =========================================

const paymentRouter = express.Router();

// =========================================
// STRIPE WEBHOOK - RAW BODY
// =========================================
// Stripe signs the exact bytes it sent.
// express.json() would rewrite them and break
// verification, so this route parses the body
// itself with express.raw({ type: "*/*" }).
// It must stay FIRST in this file.

paymentRouter.post(
  "/stripe/webhook",
  express.raw({
    type: "*/*",
    limit: "1mb",
  }),
  stripeWebhook
);

// =========================================
// JSON BODY PARSING
// =========================================
// This router is mounted before the app-wide
// express.json() so the webhook above can read
// the raw body. Every other route here is a
// normal JSON API, so the parser is applied
// AFTER the webhook route. Registering it
// later means it never touches the webhook's
// already-consumed raw body.

paymentRouter.use(express.json());

// =========================================
// PROVIDER AVAILABILITY
// =========================================

paymentRouter.get(
  "/methods",
  paymentMethods
);

// =========================================
// STRIPE
// =========================================

// Start a Stripe Checkout Session and a
// pending order together.
paymentRouter.post(
  "/stripe/checkout",
  authUser,
  createStripeCheckout
);

// Poll payment status after the redirect.
// Reads Stripe, never the browser.
paymentRouter.get(
  "/stripe/session",
  authUser,
  getStripeSessionStatus
);

// User abandoned checkout.
paymentRouter.post(
  "/stripe/cancel",
  authUser,
  cancelStripeCheckout
);

export default paymentRouter;