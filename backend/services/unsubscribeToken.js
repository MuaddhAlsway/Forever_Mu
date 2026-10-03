import crypto from "node:crypto";


// =========================================
// DERIVED UNSUBSCRIBE TOKEN
// =========================================
// Campaign sending has to embed a per-recipient
// unsubscribe link, which means the link must be
// reproducible at send time. That rules out a
// stored one-way hash.
//
// The token is therefore DERIVED from the
// subscriber id and a version counter, signed
// with a server-side secret:
//
//   payload = "<id>.<version>"
//   token   = base64url(payload) + "." + HMAC_SHA256(secret, payload)
//
// Consequences, all of them intentional:
//
//   - No secret value is stored in MongoDB, so a
//     database dump cannot be replayed to
//     unsubscribe the entire list.
//   - A link can be regenerated whenever one is
//     needed, including during a campaign send.
//   - Verification recomputes the signature and
//     compares in constant time, so it cannot be
//     forged or brute-forced.
//   - Bumping the subscriber's version invalidates
//     every link already sent to them, which is
//     what a re-subscribe does.
//
// Rotating the secret invalidates all outstanding
// links, exactly as rotating JWT_SECRET would.
// =========================================


const getSecret = () => {
  const secret =
    process.env.NEWSLETTER_UNSUBSCRIBE_SECRET ||
    process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      "No secret available for unsubscribe tokens. " +
        "Set NEWSLETTER_UNSUBSCRIBE_SECRET."
    );
  }

  return secret;
};


const sign = (payload) =>
  crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");


// Constant-time comparison so a wrong signature
// cannot be discovered one character at a time.
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
};


export const buildUnsubscribeToken = (
  subscriberId,
  version = 1
) => {
  const payload = `${subscriberId}.${version}`;

  return `${Buffer.from(payload).toString("base64url")}.${sign(payload)}`;
};


// Returns the subscriber id when the token is
// genuinely valid, otherwise null.
export const verifyUnsubscribeToken = (token) => {
  if (
    typeof token !== "string" ||
    !token.includes(".")
  ) {
    return null;
  }

  const trimmed = token.trim();

  const separator = trimmed.lastIndexOf(".");

  if (separator <= 0) {
    return null;
  }

  const encodedPayload = trimmed.slice(0, separator);
  const providedSignature = trimmed.slice(separator + 1);

  let payload = null;

  try {
    payload = Buffer.from(
      encodedPayload,
      "base64url"
    ).toString("utf8");
  } catch {
    return null;
  }

  // Must round-trip, so a mangled payload is
  // rejected before the signature check.
  if (
    Buffer.from(payload).toString("base64url") !==
    encodedPayload
  ) {
    return null;
  }

  if (!safeEqual(sign(payload), providedSignature)) {
    return null;
  }

  const [id, version] = payload.split(".");

  if (!id || !version) {
    return null;
  }

  return {
    subscriberId: id,
    version: Number.parseInt(version, 10),
  };
};


// =========================================
// UNSUBSCRIBE LINK
// =========================================
// FRONTEND_URL cannot be used for this: it is a
// CORS origin and is http://localhost:5173 during
// development, which would send real customers a
// localhost link. A dedicated variable keeps the
// public https storefront separate.

const getPublicBaseUrl = () => {
  const base = (
    process.env.NEWSLETTER_UNSUBSCRIBE_BASE_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:5173"
  ).replace(/\/+$/, "");

  return base;
};

export const buildUnsubscribeUrl = (token) =>
  `${getPublicBaseUrl()}/newsletter/unsubscribe?token=${encodeURIComponent(token)}`;