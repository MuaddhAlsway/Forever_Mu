import express from "express";

import {
  subscribe,
  unsubscribe,
  listSubscribers,
  getStats,
} from "../controller/newsletterController.js";

import rateLimit from "../middleware/rateLimit.js";

import adminAuth from "../middleware/adminAuth.js";

const newsletterRouter = express.Router();


// =========================================
// PUBLIC
// =========================================
// No customer auth: a visitor can subscribe
// without an account.

// Attempts allowed per window, per IP.
// Configurable so the ceiling can be tuned per
// environment without a code change; it defaults
// to 10 when the variable is absent or invalid.
//
// 10 per hour is well above normal human use and
// still stops scripted abuse. It is deliberately
// not aggressive, because a shared office or
// mobile-carrier NAT can put many real people
// behind one IP address.
const SUBSCRIBE_RATE_LIMIT =
  Number.parseInt(
    process.env.NEWSLETTER_RATE_LIMIT_MAX,
    10
  ) || 10;

const SUBSCRIBE_RATE_WINDOW_MS =
  (Number.parseInt(
    process.env.NEWSLETTER_RATE_LIMIT_WINDOW_MINUTES,
    10
  ) || 60) * 60 * 1000;


// The stricter 1kb body cap is applied on this
// route rather than globally so no existing route
// changes behaviour. This endpoint only needs an
// email address, so 1kb is generous.
newsletterRouter.post(
  "/subscribe",
  express.json({ limit: "1kb" }),
  rateLimit({
    windowMs: SUBSCRIBE_RATE_WINDOW_MS,
    max: SUBSCRIBE_RATE_LIMIT,
    keyPrefix: "newsletter-subscribe",
    message:
      "Too many subscription attempts. Please try again later.",
  }),
  subscribe
);

newsletterRouter.get("/unsubscribe", unsubscribe);


// =========================================
// ADMIN
// =========================================
// adminAuth, NOT the customer authUser
// middleware. These routes must never be
// reachable with a customer token.

newsletterRouter.get(
  "/admin/subscribers",
  adminAuth,
  listSubscribers
);

newsletterRouter.get(
  "/admin/stats",
  adminAuth,
  getStats
);


export default newsletterRouter;