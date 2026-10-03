import crypto from "node:crypto";

import validator from "validator";

import newsletterModel from "../models/newsletterModel.js";


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
// A 256-bit random token handed to the
// subscriber. Only its SHA-256 hash is stored.
//
// The token is regenerated on every subscribe,
// which revokes any previously issued link the
// moment someone re-subscribes.

export const createUnsubscribeToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  return {
    token,
    hash: hashUnsubscribeToken(token),
    expiresAt: new Date(
      Date.now() + UNSUBSCRIBE_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
    ),
  };
};

export const hashUnsubscribeToken = (token) =>
  crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");


export const UNSUBSCRIBE_TOKEN_TTL_DAYS = 365;


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

  const { token, hash, expiresAt } = createUnsubscribeToken();

  // ---- REACTIVATING A CANCELLED SUBSCRIPTION ----
  if (existing) {
    const reactivated = await newsletterModel
      .findOneAndUpdate(
        { email, status: "unsubscribed" },
        {
          $set: {
            status: "subscribed",
            subscribedAt: now,
            unsubscribedAt: null,
            source,
            unsubscribeTokenHash: hash,
            unsubscribeTokenExpiresAt: expiresAt,
          },
          // firstSubscribedAt is intentionally
          // NOT touched, so audience growth is
          // not double counted on re-subscribe.
        },
        { new: true }
      )
      .lean();

    if (reactivated) {
      return {
        outcome: "resubscribed",
        subscriber: reactivated,
        unsubscribeToken: token,
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
      unsubscribeTokenHash: hash,
      unsubscribeTokenExpiresAt: expiresAt,
    });

    return {
      outcome: "subscribed",
      subscriber: created.toObject(),
      unsubscribeToken: token,
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
              $set: {
                status: "subscribed",
                subscribedAt: now,
                unsubscribedAt: null,
                source,
                unsubscribeTokenHash: hash,
                unsubscribeTokenExpiresAt: expiresAt,
              },
            },
            { new: true }
          )
          .lean();

        return {
          outcome: "resubscribed",
          subscriber: reactivated || current,
          unsubscribeToken: token,
        };
      }

      return {
        outcome: "subscribed",
        subscriber: { email },
        unsubscribeToken: token,
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
// The lookup is by token HASH, so the raw token
// never reaches the database layer and the
// subscriber's own address is not required to
// find the row.

export const unsubscribeByToken = async (token) => {
  if (typeof token !== "string" || token.trim() === "") {
    return {
      ok: false,
      reason: "invalid_token",
      message: "This unsubscribe link is not valid.",
    };
  }

  const hash = hashUnsubscribeToken(token.trim());

  const subscriber = await newsletterModel
    .findOne({
      unsubscribeTokenHash: hash,
      unsubscribeTokenExpiresAt: { $gt: new Date() },
    })
    .select("+unsubscribeTokenHash +unsubscribeTokenExpiresAt")
    .lean();

  if (!subscriber) {
    return {
      ok: false,
      reason: "invalid_token",
      message: "This unsubscribe link is not valid or has expired.",
    };
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
          // Burn the credential so the link is
          // single use.
          unsubscribeTokenHash: null,
          unsubscribeTokenExpiresAt: null,
        },
      },
      { new: true }
    )
    .lean();

  return {
    ok: true,
    alreadyUnsubscribed: false,
    subscriber: updated || subscriber,
  };
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

  const subscribers = await newsletterModel
    .find(filter)
    // Newest subscription first.
    .sort({ subscribedAt: -1, _id: -1 })
    .skip(skip)
    .limit(limit)
    // The stored hash and its expiry can never
    // leave the service.
    .select("-unsubscribeTokenHash -unsubscribeTokenExpiresAt")
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