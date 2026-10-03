import mongoose from "mongoose";

import newsletterModel from "../models/newsletterModel.js";

import newsletterCampaignModel from "../models/newsletterCampaignModel.js";

import newsletterDeliveryModel from "../models/newsletterDeliveryModel.js";

import {
  sendEmail,
  hasTransport,
  missingConfiguration,
  TransportNotConfiguredError,
  getTransportName,
} from "./emailTransport.js";

import {
  renderCampaign,
} from "./emailTemplates.js";

import {
  buildUnsubscribeToken,
  buildUnsubscribeUrl,
} from "./unsubscribeToken.js";


// =========================================
// LIMITS
// =========================================
// A campaign send runs inside one HTTP request,
// so it has to stay bounded. These caps stop a
// large list from turning into an unbounded
// request that ties up the process.
//
// When the audience outgrows this, move delivery
// to a background worker or provider-native
// campaign API. Everything below is already
// isolated in this one file, so that swap touches
// nothing else.

const DEFAULT_MAX_RECIPIENTS = 2000;

const DEFAULT_BATCH_SIZE = 50;

const DEFAULT_CONCURRENCY = 5;


const getMaxRecipients = () => {
  const parsed = Number.parseInt(
    process.env.NEWSLETTER_CAMPAIGN_MAX_RECIPIENTS,
    10
  );

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_RECIPIENTS;
};


// =========================================
// VALIDATION
// =========================================
// Returns a customer-safe message or throws with a
// message the admin screen can display verbatim.

const assertNonEmptyString = (
  value,
  field,
  maxLength
) => {
  if (typeof value !== "string") {
    throw new Error(`${field} is required.`);
  }

  const trimmed = value.trim();

  if (trimmed === "") {
    throw new Error(`${field} is required.`);
  }

  if (trimmed.length > maxLength) {
    throw new Error(
      `${field} must be ${maxLength} characters or fewer.`
    );
  }

  return trimmed;
};


export const validateCampaignInput = ({
  subject,
  message,
  ctaText,
  ctaUrl,
} = {}) => {
  const cleanSubject = assertNonEmptyString(
    subject,
    "Subject",
    200
  );

  const cleanMessage = assertNonEmptyString(
    message,
    "Message",
    20000
  );

  // CTA is optional, but the two halves must agree:
  // a label with no destination, or a destination
  // with no label, is a mistake rather than an
  // error worth rejecting the whole campaign for.
  const cleanCtaText =
    typeof ctaText === "string"
      ? ctaText.trim().slice(0, 60)
      : "";

  const cleanCtaUrl =
    typeof ctaUrl === "string"
      ? ctaUrl.trim().slice(0, 2000)
      : "";

  let finalCtaUrl = "";

  if (cleanCtaUrl) {
    let parsed = null;

    try {
      parsed = new URL(cleanCtaUrl);
    } catch {
      throw new Error(
        "CTA URL must be a valid link."
      );
    }

    if (
      parsed.protocol !== "http:" &&
      parsed.protocol !== "https:"
    ) {
      throw new Error(
        "CTA URL must start with http:// or https://"
      );
    }

    finalCtaUrl = cleanCtaUrl;
  }

  return {
    subject: cleanSubject,
    message: cleanMessage,
    ctaText: cleanCtaUrl ? cleanCtaText : "",
    ctaUrl: finalCtaUrl,
  };
};


// =========================================
// AUDIENCE
// =========================================
// The BACKEND decides who receives a campaign.
//
// There is deliberately no code path that accepts a
// list of addresses from the request. An admin
// sends a subject and a message; the audience is
// always the current set of active subscribers.
//
// The query is a bare literal with no user input
// anywhere in it, so there is no operator
// injection surface either.

export const resolveAudience = async () => {
  const subscribers =
    await newsletterModel
      .find({ status: "subscribed" })
      .select("email unsubscribeVersion")
      .lean();

  return subscribers;
};


// =========================================
// DELIVERY
// =========================================
// Runs `worker` over `items` with a fixed number
// of in-flight operations.
//
// A plain `Promise.all` over the whole audience
// would open thousands of sockets at once. This
// keeps at most `concurrency` requests alive and
// preserves result order.

const runWithConcurrency = async (
  items,
  concurrency,
  worker
) => {
  const results = new Array(items.length);

  let cursor = 0;

  const runner = async () => {
    while (cursor < items.length) {
      const index = cursor;

      cursor += 1;

      results[index] = await worker(
        items[index],
        index
      );
    }
  };

  const runners = Array.from(
    {
      length: Math.min(
        concurrency,
        items.length || 1
      ),
    },
    runner
  );

  await Promise.all(runners);

  return results;
};


// Sends one message and records the outcome.
// A delivery is only ever marked "sent" when the
// provider actually accepted it.
const deliverTo = async ({
  campaign,
  subscriber,
  content,
}) => {
  try {
    const result = await sendEmail({
      to: subscriber.email,
      subject: content.subject,
      html: content.html,
      text: content.text,
    });

    await newsletterDeliveryModel.create({
      campaignId: campaign._id,
      subscriberId: subscriber._id,
      email: subscriber.email,
      status: "sent",
      providerMessageId:
        result?.providerMessageId || null,
      attemptedAt: new Date(),
    });

    return "sent";
  } catch (error) {
    const isTransportDown =
      error instanceof TransportNotConfiguredError;

    await newsletterDeliveryModel.create({
      campaignId: campaign._id,
      subscriberId: subscriber._id,
      email: subscriber.email,
      status: "failed",
      // Only the message text, never a stack or
      // an API key.
      errorMessage: String(
        error?.message || "Unknown error"
      ).slice(0, 500),
      attemptedAt: new Date(),
    });

    // A transport that vanished mid-campaign stops
    // the send instead of marking every remaining
    // recipient as failed.
    if (isTransportDown) {
      throw error;
    }

    return "failed";
  }
};


// =========================================
// SEND CAMPAIGN
// =========================================

export const sendCampaign = async (input) => {
  const content =
    validateCampaignInput(input);

  // Refuse BEFORE any write, so a refused send
  // leaves no half-finished campaign or delivery
  // records behind.
  if (!hasTransport()) {
    throw new TransportNotConfiguredError(
      "Email delivery is not configured. Set " +
        (missingConfiguration().join(" and ") ||
          "an email provider") +
        " before sending a campaign."
    );
  }

  const audience = await resolveAudience();

  const maxRecipients = getMaxRecipients();

  if (audience.length === 0) {
    throw new Error(
      "There are no active subscribers to send to."
    );
  }

  if (audience.length > maxRecipients) {
    throw new Error(
      `This campaign would go to ${audience.length} subscribers, above the ${maxRecipients} limit for a single send.`
    );
  }

  const campaign =
    await newsletterCampaignModel.create({
      ...content,
      status: "sending",
      audienceCount: audience.length,
      startedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  let sentCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  try {
    const batchSize = DEFAULT_BATCH_SIZE;

    for (
      let offset = 0;
      offset < audience.length;
      offset += batchSize
    ) {
      const batch = audience.slice(
        offset,
        offset + batchSize
      );

      // Someone may have unsubscribed after the
      // audience was resolved but before their
      // batch went out. Re-checking here is what
      // makes "never email an unsubscribed user"
      // true for the whole run rather than only at
      // the start.
      const stillActive =
        await newsletterModel
          .find({
            _id: {
              $in: batch.map((s) => s._id),
            },
            status: "subscribed",
          })
          .select("email unsubscribeVersion")
          .lean();

      const activeById = new Map(
        stillActive.map((s) => [
          String(s._id),
          s,
        ])
      );

      // Everyone who left the audience in the
      // meantime is recorded as skipped, not sent.
      const skipped = batch.filter(
        (s) => !activeById.has(String(s._id))
      );

      if (skipped.length > 0) {
        skippedCount += skipped.length;

        await newsletterDeliveryModel.insertMany(
          skipped.map((s) => ({
            campaignId: campaign._id,
            subscriberId: s._id,
            email: s.email,
            status: "skipped",
            errorMessage:
              "Unsubscribed before this campaign was sent",
            attemptedAt: new Date(),
          }))
        );
      }

      const toSend = batch.filter((s) =>
        activeById.has(String(s._id))
      );

      const outcomes = await runWithConcurrency(
        toSend,
        DEFAULT_CONCURRENCY,
        async (subscriber) => {
          // Regenerated per recipient from the
          // stored id and version, so no token is
          // ever persisted.
          const token =
            buildUnsubscribeToken(
              subscriber._id,
              subscriber.unsubscribeVersion || 1
            );

          const unsubscribeUrl =
            buildUnsubscribeUrl(token);

          const rendered = renderCampaign({
            ...content,
            unsubscribeUrl,
          });

          return deliverTo({
            campaign,
            subscriber,
            content: rendered,
          });
        }
      );

      sentCount += outcomes.filter(
        (o) => o === "sent"
      ).length;

      failedCount += outcomes.filter(
        (o) => o === "failed"
      ).length;
    }

    const completed =
      await newsletterCampaignModel
        .findByIdAndUpdate(
          campaign._id,
          {
            $set: {
              status: "completed",
              sentCount,
              failedCount,
              completedAt: new Date(),
              updatedAt: new Date(),
            },
          },
          { returnDocument: "after" }
        )
        .lean();

    return {
      campaign: completed,
      summary: {
        audience: audience.length,
        sent: sentCount,
        failed: failedCount,
        skipped: skippedCount,
        transport: getTransportName(),
      },
    };
  } catch (error) {
    // The campaign keeps whatever it managed to
    // record. A partial send is reported honestly
    // rather than rolled back or hidden.
    const sentSoFar =
      await newsletterDeliveryModel.countDocuments({
        campaignId: campaign._id,
        status: "sent",
      });

    const failedSoFar =
      await newsletterDeliveryModel.countDocuments({
        campaignId: campaign._id,
        status: "failed",
      });

    const skippedSoFar =
      await newsletterDeliveryModel.countDocuments({
        campaignId: campaign._id,
        status: "skipped",
      });

    const aborted =
      await newsletterCampaignModel
        .findByIdAndUpdate(
          campaign._id,
          {
            $set: {
              status: "failed",
              sentCount: sentSoFar,
              failedCount: failedSoFar,
              completedAt: new Date(),
              updatedAt: new Date(),
              errorMessage: String(
                error?.message || "Send failed"
              ).slice(0, 500),
            },
          },
          { returnDocument: "after" }
        )
        .lean();

    const wrapped = new Error(
      error?.message || "Campaign send failed"
    );

    wrapped.campaign = aborted;

    wrapped.summary = {
      audience: audience.length,
      sent: sentSoFar,
      failed: failedSoFar,
      skipped: skippedSoFar,
      transport: getTransportName(),
    };

    throw wrapped;
  }
};


// =========================================
// HISTORY
// =========================================

export const listCampaigns = async ({
  page,
  limit,
} = {}) => {
  const total =
    await newsletterCampaignModel.countDocuments(
      {}
    );

  const campaigns =
    await newsletterCampaignModel
      .find({})
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

  return {
    campaigns,
    total,
    page,
    limit,
    totalPages: Math.max(
      1,
      Math.ceil(total / limit)
    ),
  };
};


// Per-recipient results for one campaign.
export const getCampaignDeliveries = async ({
  campaignId,
  page,
  limit,
  status,
} = {}) => {
  if (
    !mongoose.isValidObjectId(campaignId)
  ) {
    return null;
  }

  const campaign =
    await newsletterCampaignModel
      .findById(campaignId)
      .lean();

  if (!campaign) {
    return null;
  }

  const filter = { campaignId };

  if (
    status === "sent" ||
    status === "failed" ||
    status === "skipped"
  ) {
    filter.status = status;
  }

  const total =
    await newsletterDeliveryModel.countDocuments(
      filter
    );

  const deliveries =
    await newsletterDeliveryModel
      .find(filter)
      .sort({ attemptedAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

  return {
    campaign,
    deliveries,
    total,
    page,
    limit,
    totalPages: Math.max(
      1,
      Math.ceil(total / limit)
    ),
  };
};