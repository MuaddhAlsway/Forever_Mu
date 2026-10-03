// =========================================
// EMAIL TRANSPORT
// =========================================
// One seam between the campaign system and
// whichever provider actually delivers mail.
//
// Today that provider is Resend, called over its
// plain HTTP API with fetch, so no new npm
// dependency is introduced.
//
// The important property: when nothing is
// configured, `isConfigured()` returns false and
// `send()` refuses. It never pretends to deliver.
// A campaign cannot record a single "sent" unless
// the provider actually accepted the message.
//
// To add another provider later, implement the
// same two functions and register it below. No
// campaign, model or route code needs to change.
// =========================================


export class TransportNotConfiguredError extends Error {
  constructor(message) {
    super(message);
    this.name = "TransportNotConfiguredError";
    this.code = "TRANSPORT_NOT_CONFIGURED";
  }
}


const getApiKey = () =>
  (process.env.RESEND_API_KEY || "").trim();

const getFromAddress = () =>
  (process.env.RESEND_FROM || "").trim();


// Resend refuses to send from an unverified
// domain, so the sender is validated up front to
// produce a clear message instead of a provider
// error halfway through a send.
export const isConfigured = () =>
  getApiKey().length > 0 &&
  getFromAddress().length > 0;


// Names of the variables that are still missing,
// so the admin screen can say precisely what to
// set instead of a generic failure.
export const missingConfiguration = () => {
  const missing = [];

  if (!getApiKey()) {
    missing.push("RESEND_API_KEY");
  }

  if (!getFromAddress()) {
    missing.push("RESEND_FROM");
  }

  return missing;
};


// =========================================
// RESEND DRIVER
// =========================================

const RESEND_ENDPOINT =
  "https://api.resend.com/emails";

const sendViaResend = async ({
  to,
  subject,
  html,
  text,
}) => {
  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getFromAddress(),
      to: [to],
      subject,
      html,
      text,
    }),
  });

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    // Only the provider's own message is kept,
    // never the request body, so the API key can
    // never reach a log or a delivery record.
    const detail =
      payload?.message ||
      payload?.name ||
      `HTTP ${response.status}`;

    throw new Error(
      `Resend rejected the message: ${detail}`
    );
  }

  return {
    providerMessageId:
      payload?.id || null,
  };
};


// =========================================
// ACTIVE DRIVER
// =========================================
// A test driver can be injected so the delivery
// pipeline is verifiable without a real provider
// and without pretending a real send happened.

let injectedDriver = null;

export const setTransportDriver = (driver) => {
  injectedDriver = driver;
};

export const resetTransportDriver = () => {
  injectedDriver = null;
};


const activeDriver = () =>
  injectedDriver || {
    name: "resend",
    send: sendViaResend,
  };


export const getTransportName = () =>
  activeDriver().name;


// Whether a message can actually be delivered right
// now.
//
// This is deliberately SEPARATE from
// `isConfigured()`, which stays purely about the
// environment. A test driver makes `hasTransport()`
// true so the delivery pipeline is verifiable,
// while `isConfigured()` still reports false so the
// admin API and its UI keep telling the truth about
// what is configured on this server.
export const hasTransport = () =>
  isConfigured() || injectedDriver !== null;


// Sends one message. Throws
// TransportNotConfiguredError when no provider is
// available, so callers can abort a whole send
// rather than record a fake success.
export const sendEmail = async (message) => {
  if (!hasTransport()) {
    throw new TransportNotConfiguredError(
      "Email delivery is not configured. Set " +
        (missingConfiguration().join(" and ") ||
          "an email provider") +
        " before sending campaigns."
    );
  }

  return activeDriver().send(message);
};