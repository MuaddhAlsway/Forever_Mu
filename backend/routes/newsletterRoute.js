import express from "express";

import {
  subscribe,
  unsubscribe,
  listSubscribers,
  getStats,
  sendCampaign,
  listCampaigns,
  getCampaignDeliveries,
  getTransportStatus,
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
// middleware. Every route below refuses both a
// missing token and a real customer token.
//
// Sending is rate limited on top of that. Even a
// legitimate admin session should not be able to
// fire repeated campaigns by accident, and a
// stolen admin token should not be able to hammer
// the email provider.

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

newsletterRouter.get(
  "/admin/transport",
  adminAuth,
  getTransportStatus
);

newsletterRouter.post(
  "/admin/send",
  adminAuth,
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    keyPrefix: "newsletter-campaign",
    message:
      "Too many campaign sends. Please wait before sending again.",
  }),
  sendCampaign
);

newsletterRouter.get(
  "/admin/campaigns",
  adminAuth,
  listCampaigns
);

newsletterRouter.get(
  "/admin/campaigns/:campaignId/deliveries",
  adminAuth,
  getCampaignDeliveries
);


export default newsletterRouter;