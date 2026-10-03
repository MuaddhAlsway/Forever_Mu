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

// Generous ceiling, not a strict one. 10
// attempts per hour per IP is well above normal
// human use and still stops scripted abuse.
//
// The stricter 1mb body cap is applied here
// rather than globally so no existing route
// changes behaviour. This endpoint only needs an
// email address, so 1kb is generous.
newsletterRouter.post(
  "/subscribe",
  express.json({ limit: "1kb" }),
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
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