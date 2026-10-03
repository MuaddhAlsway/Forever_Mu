import mongoose from "mongoose";


// =========================================
// NEWSLETTER SUBSCRIBER
// =========================================
// Deliberately SEPARATE from userModel.
//
// A visitor subscribes with an email address
// only. There is no password, no cart, no
// orders and no payment data here, so a
// newsletter list can never be joined against
// customer accounts to leak them.
//
// This collection is the durable audience list.
// Campaign sending (welcome email, new
// collection, discount campaign) reads from
// it later, which is why the subscription
// state is stored instead of being emailed
// once and forgotten.
//
// No `timestamps: true` here because this
// project does not use it on any other model.
// The lifecycle dates below are explicit
// instead, which the newsletter needs anyway.
// =========================================


// =========================================
// EMAIL
// =========================================
// Always stored trimmed + lowercased so
// "TEST@Example.com" and " test@example.com "
// collapse onto ONE row and the unique index
// is actually meaningful.
//
// The unique index is the real duplicate
// guard: two concurrent requests can both pass
// a findOne() check, and only the index
// reliably prevents the second insert.

const emailSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254, // RFC 5321 practical ceiling
    },

    // ---- SUBSCRIPTION STATE ----

    status: {
      type: String,
      enum: {
        values: ["subscribed", "unsubscribed"],
        message: "Status must be subscribed or unsubscribed",
      },
      default: "subscribed",
      index: true,
    },

    // When the CURRENT subscription began.
    // Bumped again if someone unsubscribes and
    // later re-subscribes.
    subscribedAt: {
      type: Date,
      default: Date.now,
    },

    // First time this address ever subscribed.
    // Preserved across an unsubscribe/resubscribe
    // cycle so audience growth is measurable.
    firstSubscribedAt: {
      type: Date,
      default: Date.now,
    },

    // Set only while unsubscribed. Cleared when
    // the subscription is reactivated.
    unsubscribedAt: {
      type: Date,
      default: null,
    },

    // ---- ATTRIBUTION ----

    // Where the signup came from, so a future
    // campaign can target a single surface
    // (homepage banner, footer, checkout) without
    // a schema change.
    source: {
      type: String,
      enum: {
        values: ["homepage", "footer", "checkout", "other"],
        message: "Unsupported subscription source",
      },
      default: "homepage",
    },

    // ---- UNSUBSCRIBE CREDENTIAL ----
    // A 256-bit random token, stored ONLY as a
    // SHA-256 hash. Unsubscribing requires this
    // token, so knowing an email address is not
    // enough to unsubscribe someone.
    //
    // Hashing means a database dump cannot be
    // replayed to unsubscribe the whole list.
    //
    // `select: false` keeps it out of every
    // ordinary query result, so it cannot leak
    // through the admin list by accident.

    unsubscribeTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    unsubscribeTokenExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    // Reject unknown fields outright instead of
    // silently dropping them, so a mass
    // assignment attempt can never be stored.
    strict: "throw",
    versionKey: false,
  }
);


// Case-insensitive uniqueness. The `unique`
// flag above already builds one index, but a
// partial unique index on the normalized value
// is the actual guarantee that two spellings of
// the same address can never coexist.
emailSchema.index(
  { email: 1 },
  {
    unique: true,
    name: "newsletter_email_unique",
  }
);

// Default listing for the admin screen: newest
// subscriptions first.
emailSchema.index(
  { subscribedAt: -1 },
  {
    name: "newsletter_subscribedAt_desc",
  }
);


const newsletterModel = mongoose.model(
  "newsletter",
  emailSchema
);


export default newsletterModel;