import * as newsletterService from "../services/newsletterService.js";


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


export {
  subscribe,
  unsubscribe,
  listSubscribers,
  getStats,
};