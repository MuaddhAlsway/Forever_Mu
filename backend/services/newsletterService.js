import validator from "validator";

import newsletterModel from "../models/newsletterModel.js";

import {
  buildUnsubscribeToken,
  verifyUnsubscribeToken,
  buildUnsubscribeUrl,
} from "./unsubscribeToken.js";

import {
  sendEmail,
  hasTransport,
} from "./emailTransport.js";

import {
  renderWelcome,
} from "./emailTemplates.js";


// =========================================
// LIMITS
// =========================================
// Length checked BEFORE the shape check so an
// oversized body is rejected without running a
// regex over megabytes of text.

const MAX_EMAIL_LENGTH = 254;

const MAX_NAME_LENGTH = 100;


// =========================================
// EMAIL NORMALIZATION
// =========================================
// One canonical form for the whole feature:
//
//   "  TEST@Example.COM " -> "test@example.com"
//
// Normalizing BEFORE every read and write is
// what makes the unique index reliable.
// `TEST@EXAMPLE.COM` and `test@example.com`
// are therefore the same subscriber, not two.

export const normalizeEmail = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .trim()
    .toLowerCase()
    // Strip a UTF-8 BOM / zero-width junk that
    // copy-paste from mail clients can carry.
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim();
};


// =========================================
// VALIDATION
// =========================================
// Returns a customer-safe message. Never
// returns a raw database or Node error.

export const validateEmail = (value) => {
  if (value === undefined || value === null) {
    return {
      ok: false,
      message: "Please enter your email address.",
    };
  }

  // Reject non-string bodies such as
  // { email: { $ne: null } } or arrays, which
  // would otherwise reach the query layer.
  if (typeof value !== "string") {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  if (value.trim() === "") {
    return {
      ok: false,
      message: "Please enter your email address.",
    };
  }

  if (value.length > MAX_EMAIL_LENGTH) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  const email = normalizeEmail(value);

  if (
    !validator.isEmail(email, {
      // Rejects display-name forms such as
      // "Bob <bob@example.com>" that would
      // otherwise store an unroutable address.
      allow_display_name: false,
      require_tld: true,
    })
  ) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  // Defense in depth: even with a valid shape,
  // refuse anything containing a NUL or a
  // MongoDB operator character.
  if (/[\s$]/.test(email) || email.includes("\0")) {
    return {
      ok: false,
      message: "Please enter a valid email address.",
    };
  }

  return {
    ok: true,
    email,
  };
};


export const validateSource = (value) => {
  if (value === undefined || value === null || value === "") {
    return "homepage";
  }

  if (typeof value !== "string") {
    return "homepage";
  }

  const candidate = value.trim().toLowerCase().slice(0, MAX_NAME_LENGTH);

  return ["homepage", "footer", "checkout", "other"].includes(
    candidate
  )
    ? candidate
    : "homepage";
};


// =========================================
// UNSUBSCRIBE CREDENTIAL
// =========================================
// No token is generated or stored here.
//
// Tokens are DERIVED on demand from the
// subscriber id plus a version counter, signed
// with a server-side secret. See
// unsubscribeToken.js for the reasoning.
//
// Regenerating on every subscribe is what
// revokes previously issued links: bumping the
// version invalidates every unsubscribe URL
// already sent to that subscriber.


// =========================================
// DUPLICATE KEY DETECTION
// =========================================
// MongoDB error 11000 is the unique index
// doing its job after a concurrent insert.
// It is an expected outcome, not a fault, so it
// is recognised here and never surfaced raw.

const isDuplicateKeyError = (error) =>
  error &&
  (error.code === 11000 ||
    error.code === 11001 ||
    error.name === "MongoServerError" ||
    error.name === "MongoBulkWriteError") &&
  JSON.stringify(error.keyPattern || error.keyValue || {}).includes(
    "email"
  );


// =========================================
// SUBSCRIBE
// =========================================
// Four outcomes, all of them safe and all of
// them non-duplicating:
//
//   1. brand new            -> created
//   2. already subscribed   -> untouched
//   3. previously cancelled -> reactivated
//   4. lost a concurrent
//      insert race           -> re-read and
//                               report as (1) or (2)
//
// Status is flipped instead of deleting so the
// subscriber's history survives.
//
// Every path that creates or reactivates returns
// `unsubscribeToken`, DERIVED rather than stored,
// which the welcome email needs.

const reactivateFields = ({ now, source }) => ({
  status: "subscribed",
  subscribedAt: now,
  unsubscribedAt: null,
  source,
});

export const subscribe = async ({ email, source }) => {
  const existing = await newsletterModel
    .findOne({ email })
    .lean();

  // ---- ALREADY SUBSCRIBED ----
  if (existing && existing.status === "subscribed") {
    return {
      outcome: "already_subscribed",
      subscriber: existing,
    };
  }

  const now = new Date();

  // ---- REACTIVATING A CANCELLED SUBSCRIPTION ----
  if (existing) {
    const reactivated = await newsletterModel
      .findOneAndUpdate(
        { email, status: "unsubscribed" },
        {
          $set: reactivateFields({ now, source }),

          // Bumping the version invalidates every
          // unsubscribe link already sent to this
          // address, so an old campaign email can
          // no longer act on the new subscription.
          $inc: { unsubscribeVersion: 1 },
        },
        { returnDocument: "after" }
      )
      .lean();

    if (reactivated) {
      return {
        outcome: "resubscribed",
        subscriber: reactivated,
        unsubscribeToken: buildUnsubscribeToken(
          reactivated._id,
          reactivated.unsubscribeVersion
        ),
      };
    }

    // Fell through: someone else reactivated it
    // between the read and the write. That is
    // still a success from the caller's view.
    const current = await newsletterModel.findOne({ email }).lean();

    return {
      outcome: "already_subscribed",
      subscriber: current,
    };
  }

  // ---- BRAND NEW SUBSCRIBER ----
  try {
    const created = await newsletterModel.create({
      email,
      status: "subscribed",
      subscribedAt: now,
      firstSubscribedAt: now,
      unsubscribedAt: null,
      source,
      unsubscribeVersion: 1,
    });

    const plain = created.toObject();

    return {
      outcome: "subscribed",
      subscriber: plain,
      unsubscribeToken: buildUnsubscribeToken(
        plain._id,
        plain.unsubscribeVersion
      ),
    };
  } catch (error) {
    // ---- CONCURRENT INSERT ----
    // Two simultaneous requests both saw "no
    // existing subscriber". The unique index
    // rejected the loser. Re-read and answer
    // with whichever outcome is now true rather
    // than reporting a failure.
    if (isDuplicateKeyError(error)) {
      const current = await newsletterModel.findOne({ email }).lean();

      if (current && current.status === "subscribed") {
        return {
          outcome: "already_subscribed",
          subscriber: current,
        };
      }

      if (current) {
        const reactivated = await newsletterModel
          .findOneAndUpdate(
            { email, status: "unsubscribed" },
            {
              $set: reactivateFields({ now, source }),
              $inc: { unsubscribeVersion: 1 },
            },
            { returnDocument: "after" }
          )
          .lean();

        const winner = reactivated || current;

        return {
          outcome: "resubscribed",
          subscriber: winner,
          unsubscribeToken: buildUnsubscribeToken(
            winner._id,
            winner.unsubscribeVersion
          ),
        };
      }

      return {
        outcome: "subscribed",
        subscriber: { email },
      };
    }

    throw error;
  }
};


// =========================================
// UNSUBSCRIBE
// =========================================
// Requires the emailed token. Knowing an email
// address is deliberately NOT enough.
//
// The token is verified by recomputing its HMAC
// signature in constant time; the payload yields
// the subscriber id, so the row is found without
// the subscriber's address ever being sent back
// by the visitor.

export const unsubscribeByToken = async (token) => {
  const invalid = {
    ok: false,
    reason: "invalid_token",
    message:
      "This unsubscribe link is not valid or has expired.",
  };

  if (
    typeof token !== "string" ||
    token.trim() === ""
  ) {
    return {
      ...invalid,
      message: "This unsubscribe link is not valid.",
    };
  }

  const verified = verifyUnsubscribeToken(
    token.trim()
  );

  if (!verified) {
    return invalid;
  }

  const subscriber = await newsletterModel
    .findById(verified.subscriberId)
    .lean();

  if (!subscriber) {
    return invalid;
  }

  // A token issued before a version bump no longer
  // matches, so an old campaign email cannot
  // unsubscribe someone who has since
  // re-subscribed.
  if (
    Number(subscriber.unsubscribeVersion) !==
    Number(verified.version)
  ) {
    return invalid;
  }

  // Already cancelled: idempotent success, so a
  // double-clicked link is not an error.
  if (subscriber.status === "unsubscribed") {
    return {
      ok: true,
      alreadyUnsubscribed: true,
      subscriber,
    };
  }

  const updated = await newsletterModel
    .findOneAndUpdate(
      { _id: subscriber._id, status: "subscribed" },
      {
        $set: {
          status: "unsubscribed",
          unsubscribedAt: new Date(),
        },

        // Bumping the version revokes the link
        // immediately, so it cannot be replayed.
        // It is a sibling of $set, not nested
        // inside it, or MongoDB rejects the update.
        $inc: { unsubscribeVersion: 1 },
      },
      { returnDocument: "after" }
    )
    .lean();

  return {
    ok: true,
    alreadyUnsubscribed: false,
    subscriber: updated || subscriber,
  };
};


// =========================================
// WELCOME EMAIL
// =========================================
// Strictly optional and strictly non-blocking.
//
// The subscription is already saved in MongoDB
// before this runs. A missing provider, a bounce,
// or a timeout here can never undo the signup or
// surface an error to the visitor, because the
// promise is deliberately not awaited and every
// failure is swallowed after being logged.
//
// Nothing here is faked: with no provider
// configured this is a no-op, and the log says so.

export const sendWelcomeEmail = async ({
  email,
  unsubscribeToken,
} = {}) => {
  // The token is checked FIRST so the reason reported
  // is the actual cause, rather than always naming
  // the transport.
  if (!unsubscribeToken) {
    return {
      sent: false,
      reason: "missing_token",
    };
  }

  if (!hasTransport()) {
    return {
      sent: false,
      reason: "transport_not_configured",
    };
  }

  try {
    const rendered = renderWelcome({
      unsubscribeUrl: buildUnsubscribeUrl(
        unsubscribeToken
      ),
    });

    const result = await sendEmail({
      to: email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
    });

    return {
      sent: true,
      providerMessageId:
        result?.providerMessageId || null,
    };
  } catch (error) {
    console.error(
      "NEWSLETTER WELCOME EMAIL FAILED:",
      error?.message || error
    );

    return {
      sent: false,
      reason: "send_failed",
    };
  }
};


// =========================================
// ADMIN LISTING
// =========================================
// Search and pagination run in MongoDB, never in
// React, so the admin screen stays fast no
// matter how large the list grows.
//
// Escape is applied to the search term so a
// user typing `$` or `.` searches for those
// literal characters instead of reaching the
// query language. Combined with the email-only
// key there is no operator injection surface.

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");


export const listSubscribers = async ({
  page,
  limit,
  search,
  status,
} = {}) => {
  const filter = {};

  if (typeof search === "string" && search.trim() !== "") {
    const safe = escapeRegex(
      search.trim().slice(0, MAX_EMAIL_LENGTH)
    );

    // Anchored substring match on the stored
    // (already lowercased) email.
    filter.email = {
      $regex: new RegExp(safe, "i"),
    };
  }

  if (status === "subscribed" || status === "unsubscribed") {
    filter.status = status;
  }

  const total = await newsletterModel.countDocuments(filter);

  const skip = (page - 1) * limit;

  const subscribers =
    await newsletterModel
      .find(filter)
      // Newest subscription first.
      .sort({ subscribedAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

  return {
    subscribers,
    total,
    page,
    limit,
    totalPages: Math.max(
      1,
      Math.ceil(total / limit)
    ),
  };
};


// =========================================
// ADMIN STATISTICS
// =========================================
// Counted by MongoDB aggregation, never
// hardcoded and never derived from an
// already-fetched page.

export const getStats = async () => {
  const rows = await newsletterModel.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  const byStatus = rows.reduce(
    (acc, row) => {
      acc[row._id] = row.count;
      return acc;
    },
    {}
  );

  const total = rows.reduce(
    (sum, row) => sum + row.count,
    0
  );

  const active = byStatus.subscribed || 0;
  const unsubscribed = byStatus.unsubscribed || 0;

  return {
    total,
    active,
    unsubscribed,
  };
};