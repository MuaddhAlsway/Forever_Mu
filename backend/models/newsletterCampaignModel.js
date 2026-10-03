import mongoose from "mongoose";


// =========================================
// NEWSLETTER CAMPAIGN
// =========================================
// One document per campaign an admin composes.
// It records what was sent, to how many people,
// and how the delivery attempt went.
//
// This holds SUMMARY counts only. Per-recipient
// results live in newsletterDeliveryModel, so a
// campaign to 50,000 subscribers does not try to
// fit 50,000 sub-documents inside one document
// and hit MongoDB's 16MB ceiling.
//
// No `timestamps: true` because this project does
// not use it on any model. createdAt / updatedAt
// are explicit fields instead.
// =========================================


const campaignSchema = new mongoose.Schema(
  {
    // ---- CONTENT ----

    subject: {
      type: String,
      required: [
        true,
        "Campaign subject is required",
      ],
      trim: true,
      maxlength: 200,
    },

    // Stored as plain text and rendered into the
    // HTML template server-side. Every user
    // supplied value is escaped at render time,
    // so a subject or message can never inject
    // markup into an outgoing email.
    message: {
      type: String,
      required: [
        true,
        "Campaign message is required",
      ],
      trim: true,
      maxlength: 20000,
    },

    // ---- OPTIONAL CALL TO ACTION ----

    ctaText: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "",
    },

    // Validated as a real absolute http(s) URL so
    // the template cannot emit a `javascript:` or
    // `data:` link inside an email.
    ctaUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },

    // ---- DELIVERY STATE ----

    status: {
      type: String,
      enum: {
        values: [
          "sending",
          "completed",
          "failed",
        ],
        message: "Unsupported campaign status",
      },
      default: "sending",
      index: true,
    },

    // How many subscribers were active at the
    // moment the audience was resolved. This is
    // the authoritative number, resolved by the
    // backend and never accepted from the client.
    audienceCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ---- OUTCOME ----

    sentCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    failedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ---- TIMING ----

    startedAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    // Populated when the whole send aborted, for
    // example because no email transport is
    // configured. Individual recipient errors are
    // not stored here; they live on the delivery
    // records.
    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },

    createdAt: {
      type: Date,
      default: Date.now,
    },

    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: "throw",
    versionKey: false,
  }
);


// Newest first for the admin history list.
campaignSchema.index(
  { createdAt: -1 },
  {
    name: "newsletterCampaign_createdAt_desc",
  }
);


const newsletterCampaignModel =
  mongoose.model(
    "newsletterCampaign",
    campaignSchema
  );


export default newsletterCampaignModel;