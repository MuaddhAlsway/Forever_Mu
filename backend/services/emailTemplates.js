// =========================================
// EMAIL TEMPLATES
// =========================================
// Renders the HTML and plain-text bodies for
// campaign and welcome messages.
//
// Everything that came from an admin or a visitor
// is HTML-escaped before it is interpolated. That
// matters because the subject and message are
// admin-supplied free text: without escaping, a
// message containing markup would be injected
// verbatim into an outgoing email.
//
// The unsubscribe footer is mandatory and is
// appended by the template itself, so an admin
// cannot send a campaign that omits it.
// =========================================


const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");


// Plain text needs its own escaping, because the
// two versions of the same message must not render
// differently.
const escapeText = (value) =>
  String(value ?? "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '"');


// Turns plain-text line breaks into paragraphs
// and single newlines into breaks, AFTER the text
// has been escaped, so no markup can be smuggled
// in through a newline.
const toHtmlParagraphs = (value) => {
  const escaped = escapeHtml(value);

  return escaped
    .split(/\r\n\r\n|\n\n/)
    .map(
      (block) =>
        `<p style="margin:0 0 16px;line-height:1.6;">${block.replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
};


const isSafeHttpUrl = (value) => {
  try {
    const parsed = new URL(value);

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
};


// Rendered into a table-based shell because that
// is what email clients still agree on. No
// external CSS, no web fonts, no remote images.
const layout = ({ title, bodyHtml, ctaHtml }) => `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e5e7eb;">
            <tr>
              <td style="padding:28px 32px 12px;">
                <h1 style="margin:0;font-size:20px;line-height:1.3;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px;font-size:15px;">
                ${bodyHtml}
              </td>
            </tr>
            ${ctaHtml}
            <tr>
              <td style="padding:20px 32px 28px;border-top:1px solid #f3f4f6;">
                <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#6b7280;">
                  You are receiving this email because you subscribed to our newsletter.
                </p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  <a href="{{UNSUBSCRIBE_URL}}" style="color:#6b7280;">Unsubscribe</a>
                  &nbsp;&middot;&nbsp;
                  <a href="{{PREFERENCES_URL}}" style="color:#6b7280;">Manage preferences</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;


// The placeholder is substituted after rendering,
// per recipient, because each recipient has their
// own unsubscribe token. One template render per
// message keeps the token out of shared state.
const withUnsubscribeUrl = (html, unsubscribeUrl) =>
  html
    .replaceAll("{{UNSUBSCRIBE_URL}}", unsubscribeUrl)
    .replaceAll(
      "{{PREFERENCES_URL}}",
      `${unsubscribeUrl}&manage=1`
    );


// =========================================
// CAMPAIGN
// =========================================

export const renderCampaign = ({
  subject,
  message,
  ctaText,
  ctaUrl,
  unsubscribeUrl,
}) => {
  const safeSubject =
    typeof subject === "string"
      ? subject.slice(0, 200)
      : "";

  const safeMessage =
    typeof message === "string"
      ? message.slice(0, 20000)
      : "";

  // A CTA is rendered only when there is BOTH a
  // label and a genuine absolute http(s) URL, so
  // a `javascript:` payload can never become a
  // clickable link in someone's inbox.
  const hasCta =
    ctaText &&
    ctaUrl &&
    isSafeHttpUrl(ctaUrl);

  const ctaHtml = hasCta
    ? `
            <tr>
              <td style="padding:8px 32px 20px;">
                <a href="${escapeHtml(ctaUrl)}"
                   style="display:inline-block;background:#000000;color:#ffffff;text-decoration:none;padding:13px 28px;font-size:14px;">
                  ${escapeHtml(ctaText)}
                </a>
              </td>
            </tr>`
    : "";

  const bodyHtml = `
                <p style="margin:0 0 16px;line-height:1.6;color:#374151;">
                  Hello,
                </p>
                ${toHtmlParagraphs(safeMessage)}
                <p style="margin:0;line-height:1.6;color:#374151;">
                  Happy shopping,<br/>
                  The Team
                </p>`;

  const html = withUnsubscribeUrl(
    layout({
      title: safeSubject,
      bodyHtml,
      ctaHtml,
    }),
    unsubscribeUrl
  );

  const textLines = [
    "Hello,",
    "",
    safeMessage,
    "",
    "Happy shopping,",
    "The Team",
    "",
    "---",
    "You are receiving this email because you subscribed to our newsletter.",
    `Unsubscribe: ${unsubscribeUrl}`,
  ];

  if (hasCta) {
    textLines.splice(
      textLines.length - 3,
      0,
      `${ctaText}: ${ctaUrl}`,
      ""
    );
  }

  return {
    subject: safeSubject,
    html,
    text: textLines.join("\n"),
  };
};


// =========================================
// WELCOME
// =========================================

export const renderWelcome = ({
  unsubscribeUrl,
  siteName = "our store",
}) => {
  const html = withUnsubscribeUrl(
    layout({
      title: "Thanks for subscribing",
      bodyHtml: `
                <p style="margin:0 0 16px;line-height:1.6;color:#374151;">
                  Hello,
                </p>
                <p style="margin:0 0 16px;line-height:1.6;color:#374151;">
                  Thanks for subscribing to ${escapeHtml(siteName)}. You will now receive our latest collections, offers and new arrivals by email.
                </p>
                <p style="margin:0;line-height:1.6;color:#374151;">
                  You can unsubscribe at any time using the link below.
                </p>`,
      ctaHtml: "",
    }),
    unsubscribeUrl
  );

  return {
    subject: "Thanks for subscribing",
    html,
    text: [
      "Hello,",
      "",
      `Thanks for subscribing to ${siteName}.`,
      "",
      "You can unsubscribe at any time using the link below.",
      "",
      "---",
      "You are receiving this email because you subscribed to our newsletter.",
      `Unsubscribe: ${unsubscribeUrl}`,
    ].join("\n"),
  };
};