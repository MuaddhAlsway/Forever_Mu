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
    // NO secret is stored in this document.
    //
    // The unsubscribe token is DERIVED, not saved:
    //
    //   token = base64url( id + "." + version )
    //           + "." + HMAC-SHA256(secret, thatPayload)
    //
    // That is required by campaign sending, which
    // must embed a per-recipient unsubscribe link
    // in every email. A stored hash cannot be
    // reversed into a link, and a stored
    // plaintext token would let anyone who reads
    // the database unsubscribe the whole list.
    //
    // Deriving it means:
    //   - nothing secret is at rest,
    //   - a link can be regenerated at send time,
    //   - verification recomputes and compares in
    //     constant time.
    //
    // Bumping this counter invalidates every link
    // already issued to that subscriber, which is
    // how a re-subscribe revokes the old link.

    unsubscribeVersion: {
      type: Number,
      default: 1,
      min: 1,
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


// The admin subscriber table is always sorted by
// newest subscription first, and it may be filtered
// by status or by search, so this covers the
// unfiltered sort.
emailSchema.index(
  { subscribedAt: -1 },
  {
    name: "newsletter_subscribedAt_desc",
  }
);


// Querying only active subscribers is the hot
// path for every campaign send, so it gets its own
// compound index instead of relying on the single
// field index above.
emailSchema.index(
  { status: 1, subscribedAt: -1 },
  {
    name: "newsletter_status_subscribedAt",
  }
);


const newsletterModel = mongoose.model(
  "newsletter",
  emailSchema
);


export default newsletterModel;