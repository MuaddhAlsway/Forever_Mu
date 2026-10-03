import * as newsletterService from "../services/newsletterService.js";

import * as campaignService from "../services/campaignService.js";

import {
  TransportNotConfiguredError,
  isConfigured,
  hasTransport,
  missingConfiguration,
  getTransportName,
} from "../services/emailTransport.js";


// =========================================
// PUBLIC: SUBSCRIBE
// =========================================
// No auth. A visitor with no account can
// subscribe with nothing but an email address.
//
// The request body is never spread into the
// database document, so `status`, `subscribedAt`
// or any other field cannot be injected from
// the client.

const subscribe = async (req, res) => {
  try {
    // Read ONLY the two fields that are allowed.
    // Anything else in the body is ignored.
    const rawEmail = req.body?.email;

    const source = newsletterService.validateSource(
      req.body?.source
    );

    const check =
      newsletterService.validateEmail(rawEmail);

    if (!check.ok) {
      return res.status(400).json({
        success: false,
        message: check.message,
      });
    }

    const result = await newsletterService.subscribe({
      email: check.email,
      source,
    });

    // The welcome email is fire-and-forget. It is
    // intentionally NOT awaited on the request
    // path: the subscription is already durable in
    // MongoDB, so a slow or failing provider must
    // never delay or fail the visitor's signup.
    if (result.unsubscribeToken) {
      newsletterService
        .sendWelcomeEmail({
          email: check.email,
          unsubscribeToken: result.unsubscribeToken,
        })
        .catch(() => {
          // Already logged inside the service.
        });
    }

    // A friendly message per outcome. The caller
    // always learns the result; no internal state
    // or database detail leaks.
    if (result.outcome === "already_subscribed") {
      return res.status(200).json({
        success: true,
        alreadySubscribed: true,
        message: "You're already subscribed.",
      });
    }

    if (result.outcome === "resubscribed") {
      return res.status(200).json({
        success: true,
        resubscribed: true,
        message: "Welcome back! Your subscription has been reactivated.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Thanks for subscribing!",
      subscriber: {
        email: result.subscriber.email,
        status: result.subscriber.status,
        subscribedAt: result.subscriber.subscribedAt,
      },
    });
  } catch (error) {
    // Logged for the operator, never returned to
    // the customer.
    console.error(
      "NEWSLETTER SUBSCRIBE ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to subscribe right now. Please try again.",
    });
  }
};


// =========================================
// PUBLIC: UNSUBSCRIBE
// =========================================
// Token required. There is deliberately NO
// route that unsubscribes an address just
// because the address was supplied, which would
// let anyone mass-unsubscribe the list.

const unsubscribe = async (req, res) => {
  try {
    const token = req.query?.token ?? req.body?.token;

    const result =
      await newsletterService.unsubscribeByToken(token);

    if (!result.ok) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    res.status(200).json({
      success: true,
      alreadyUnsubscribed: result.alreadyUnsubscribed,
      message: result.alreadyUnsubscribed
        ? "You were already unsubscribed."
        : "You have been unsubscribed successfully.",
    });
  } catch (error) {
    console.error(
      "NEWSLETTER UNSUBSCRIBE ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message:
        "Unable to unsubscribe right now. Please try again.",
    });
  }
};


// =========================================
// ADMIN: LIST SUBSCRIBERS
// =========================================
// Behind adminAuth. Supports ?page, ?limit,
// ?search and ?status.

const listSubscribers = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query?.page, 10) || 1
    );

    const limit = Math.min(
      100,
      Math.max(
        1,
        Number.parseInt(req.query?.limit, 10) || 20
      )
    );

    const result =
      await newsletterService.listSubscribers({
        page,
        limit,
        search: req.query?.search,
        status: req.query?.status,
      });

    res.status(200).json({
      success: true,
      subscribers: result.subscribers,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error(
      "NEWSLETTER ADMIN LIST ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load subscribers.",
    });
  }
};


// =========================================
// ADMIN: STATISTICS
// =========================================
// Counted live from MongoDB on every request.

const getStats = async (req, res) => {
  try {
    const stats = await newsletterService.getStats();

    res.status(200).json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error(
      "NEWSLETTER ADMIN STATS ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load statistics.",
    });
  }
};


// =========================================
// ADMIN: TRANSPORT STATUS
// =========================================
// Lets the composer disable Send up front and name
// the exact variables that are missing, instead of
// letting an admin press Send and read a failure.

const getTransportStatus = async (req, res) => {
  res.status(200).json({
    success: true,
    configured: isConfigured(),
    provider: getTransportName(),
    missing: missingConfiguration(),
  });
};


// =========================================
// ADMIN: SEND CAMPAIGN
// =========================================
// The request carries CONTENT ONLY.
//
// subject, message, ctaText, ctaUrl are read by
// name. `emails`, `recipients`, `audience`,
// `subscribers` or anything else in the body is
// ignored outright, because the audience is
// resolved by the backend from subscribers whose
// status is "subscribed". There is no code path
// that lets a caller choose who receives mail.

const sendCampaign = async (req, res) => {
  try {
    const {
      subject,
      message,
      ctaText,
      ctaUrl,
    } = req.body || {};

    const result = await campaignService.sendCampaign({
      subject,
      message,
      ctaText,
      ctaUrl,
    });

    res.status(200).json({
      success: true,
      message:
        result.summary.sent > 0
          ? `Campaign sent to ${result.summary.sent} subscriber(s).`
          : "Campaign processed.",
      campaign: result.campaign,
      summary: result.summary,
    });
  } catch (error) {
    // An unconfigured provider is a configuration
    // problem, not a server fault, and it is
    // reported distinctly so the admin screen can
    // show what to set.
    if (
      error instanceof TransportNotConfiguredError
    ) {
      return res.status(503).json({
        success: false,
        code: error.code,
        message: error.message,
        missing: missingConfiguration(),
      });
    }

    // Validation and audience problems are the
    // admin's to fix and carry a safe message.
    if (error?.name === "Error" && !error.campaign) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // A send that started and then failed reports
    // exactly how far it got.
    if (error?.campaign) {
      return res.status(500).json({
        success: false,
        message: error.message,
        campaign: error.campaign,
        summary: error.summary,
      });
    }

    console.error(
      "NEWSLETTER CAMPAIGN SEND ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Unable to send the campaign.",
    });
  }
};


// =========================================
// ADMIN: CAMPAIGN HISTORY
// =========================================

const listCampaigns = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query?.page, 10) || 1
    );

    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.parseInt(req.query?.limit, 10) || 20
      )
    );

    const result = await campaignService.listCampaigns(
      {
        page,
        limit,
      }
    );

    res.status(200).json({
      success: true,
      campaigns: result.campaigns,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error(
      "NEWSLETTER CAMPAIGN LIST ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load campaigns.",
    });
  }
};


// =========================================
// ADMIN: PER-RECIPIENT RESULTS
// =========================================

const getCampaignDeliveries = async (req, res) => {
  try {
    const page = Math.max(
      1,
      Number.parseInt(req.query?.page, 10) || 1
    );

    const limit = Math.min(
      200,
      Math.max(
        1,
        Number.parseInt(req.query?.limit, 10) || 50
      )
    );

    const result =
      await campaignService.getCampaignDeliveries({
        campaignId: req.params?.campaignId,
        page,
        limit,
        status: req.query?.status,
      });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Campaign not found.",
      });
    }

    res.status(200).json({
      success: true,
      campaign: result.campaign,
      deliveries: result.deliveries,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    console.error(
      "NEWSLETTER DELIVERY LIST ERROR:",
      error?.message || error
    );

    res.status(500).json({
      success: false,
      message: "Unable to load delivery results.",
    });
  }
};


export {
  subscribe,
  unsubscribe,
  listSubscribers,
  getStats,
  sendCampaign,
  listCampaigns,
  getCampaignDeliveries,
  getTransportStatus,
};