import mongoose from "mongoose";


// =========================================
// PER-RECIPIENT DELIVERY RECORD
// =========================================
// One document per recipient per campaign.
//
// Kept in its own collection rather than nested
// inside the campaign, because a campaign to a
// large audience would otherwise produce tens of
// thousands of sub-documents in a single
// document and eventually exceed MongoDB's 16MB
// limit.
//
// `status: "sent"` is only ever written after
// the email provider has ACCEPTED the message.
// A campaign that could not be delivered is
// recorded as "failed" or "skipped" and is never
// counted as sent.
// =========================================


const deliverySchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "newsletterCampaign",
      required: true,
      index: true,
    },

    // Snapshot of the address at send time. The
    // subscriber document can later be renamed or
    // removed, but the campaign history still
    // shows exactly who was targeted.
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    // Subscriber at the moment of sending. Null
    // if the record outlived the subscriber.
    subscriberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "newsletter",
      default: null,
    },

    status: {
      type: String,
      enum: {
        values: ["sent", "failed", "skipped"],
        message: "Unsupported delivery status",
      },
      required: true,
      index: true,
    },

    // Identifier returned by the email provider,
    // kept so a delivery can be traced upstream.
    providerMessageId: {
      type: String,
      default: null,
    },

    // Short, non-sensitive failure reason. Never a
    // stack trace and never an API key.
    errorMessage: {
      type: String,
      default: null,
      maxlength: 500,
    },

    attemptedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    strict: "throw",
    versionKey: false,
  }
);


// Admin drill-down for one campaign.
deliverySchema.index(
  { campaignId: 1, status: 1 },
  {
    name: "newsletterDelivery_campaign_status",
  }
);


const newsletterDeliveryModel =
  mongoose.model(
    "newsletterDelivery",
    deliverySchema
  );


export default newsletterDeliveryModel;