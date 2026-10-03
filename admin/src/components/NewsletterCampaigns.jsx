import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  toast,
} from "react-toastify";


// =========================================
// ICONS
// =========================================

const SendIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
  >
    <path d="m22 2-7 20-4-9-9-4 20-7Z" />

    <path d="M22 2 11 13" />
  </svg>
);


const AlertIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-5 h-5"
  >
    <path d="M12 9v4" />

    <path d="M12 17h.01" />

    <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
  </svg>
);


// =========================================
// COMPONENT
// =========================================
// Campaign composer plus delivery history.
//
// The audience is NEVER chosen here. This screen
// submits a subject, a message and an optional
// call to action, and the backend resolves who
// receives it from the subscribers whose status is
// "subscribed". There is no recipient picker, by
// design.

function NewsletterCampaigns({
  token,
  activeCount,
  onSent,
}) {

  const backendUrl = (() => {
    const rawUrl = (
      import.meta.env.VITE_BACKEND_URL ||
      "http://localhost:4000"
    );
    
    // Trim whitespace
    let url = rawUrl.trim();
    
    // Remove ALL trailing slashes
    url = url.replace(/\/+$/, "");
    
    // Debug in development
    if (import.meta.env.DEV) {
      console.log("Backend URL normalization:");
      console.log("  Raw:", JSON.stringify(rawUrl));
      console.log("  Normalized:", JSON.stringify(url));
    }
    
    return url;
  })();

  // ---- COMPOSER ----

  const [subject, setSubject] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [ctaText, setCtaText] =
    useState("");

  const [ctaUrl, setCtaUrl] =
    useState("");

  const [sending, setSending] =
    useState(false);

  // ---- TRANSPORT ----
  // Read once so Send can be disabled before the
  // admin presses it, instead of failing after.

  const [transport, setTransport] =
    useState({
      loaded: false,
      configured: false,
      missing: [],
    });

  // ---- HISTORY ----

  const [campaigns, setCampaigns] =
    useState([]);

  const [historyLoading, setHistoryLoading] =
    useState(true);

  const [historyKey, setHistoryKey] =
    useState(null);

  const historyLoadingNow =
    historyLoading && historyKey === null;


  // =========================================
  // TRANSPORT STATUS
  // =========================================

  const fetchTransport =
    useCallback(async () => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/newsletter/admin/transport`,
          {
            headers: {
              token,
            },
          }
        );

        const data = response.data || {};

        setTransport({
          loaded: true,
          configured: !!data.configured,
          missing: data.missing || [],
        });
      } catch {
        setTransport({
          loaded: true,
          configured: false,
          missing: [],
        });
      }
    }, [backendUrl, token]);


  // =========================================
  // HISTORY
  // =========================================

  const fetchCampaigns =
    useCallback(async () => {
      try {
        setHistoryLoading(true);

        const response = await axios.get(
          `${backendUrl}/api/newsletter/admin/campaigns`,
          {
            headers: {
              token,
            },
            params: {
              limit: 10,
            },
          }
        );

        const data = response.data || {};

        if (data.success) {
          setCampaigns(
            data.campaigns || []
          );
        }
      } catch {
        setCampaigns([]);
      } finally {
        setHistoryLoading(false);

        setHistoryKey("loaded");
      }
    }, [backendUrl, token]);


useEffect(() => {
  // Both fetches only call setState after an
  // `await`, so neither can cascade a render. The
  // rule cannot see through the useCallback
  // boundary, and the same fetch-on-mount pattern
  // is already used in Newsletter.jsx, List.jsx and
  // Orders.jsx.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchTransport();

  fetchCampaigns();
}, [fetchTransport, fetchCampaigns]);


  // =========================================
  // SEND
  // =========================================

  const canSend =
    transport.configured &&
    !sending &&
    subject.trim() !== "" &&
    message.trim() !== "";

  const send = async () => {
    if (!canSend) {
      return;
    }

    setSending(true);

    try {
      const response = await axios.post(
        backendUrl + "/api/newsletter/admin/send",

        // Content only. No recipient list is sent,
        // because the backend resolves the audience.
        {
          subject: subject.trim(),
          message: message.trim(),
          ctaText: ctaText.trim(),
          ctaUrl: ctaUrl.trim(),
        },
        {
          headers: {
            token,
          },
        }
      );

      const data = response.data || {};

      if (data.success) {
        const s = data.summary || {};

        toast.success(
          `Campaign sent. ${s.sent ?? 0} delivered${
            s.failed
              ? `, ${s.failed} failed`
              : ""
          }${s.skipped ? `, ${s.skipped} skipped` : ""}.`
        );

        setSubject("");
        setMessage("");
        setCtaText("");
        setCtaUrl("");

        fetchCampaigns();

        // Subscriber counts and stats may have
        // moved, so the parent refreshes too.
        onSent?.();
      } else {
        toast.error(
          data.message || "Failed to send campaign"
        );
      }
    } catch (error) {
      const data = error?.response?.data;

      toast.error(
        data?.message ||
          "Failed to send campaign"
      );

      // A provider that was configured when the
      // page loaded may have been removed since.
      fetchTransport();
    } finally {
      setSending(false);
    }
  };


  // =========================================
  // RENDER
  // =========================================

  const field =
    "w-full border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-400 disabled:bg-gray-50 disabled:text-gray-400";

  return (
    <div className="w-full">

      {/* ================= TRANSPORT WARNING ============ */}
      {/* Shown before anything can be sent, naming the
          exact variables that are missing. A campaign
          is never recorded as sent without a real
          provider accepting it. */}

      {transport.loaded &&
        !transport.configured && (
          <div className="flex items-start gap-3 border border-amber-300 bg-amber-50 p-4 mb-6">
            <span className="text-amber-600 mt-0.5">
              <AlertIcon />
            </span>

            <div className="text-sm">
              <p className="font-medium text-amber-900">
                Email delivery is not configured
              </p>

              <p className="text-amber-800 mt-1">
                {transport.missing.length > 0
                  ? `Add ${transport.missing.join(" and ")} to backend/.env, then restart the server.`
                  : "No email provider is configured."}{" "}
                Sending is disabled until then, so
                no campaign can be falsely recorded
                as delivered.
              </p>
            </div>
          </div>
        )}

      {/* ================= COMPOSER ================= */}

      <div className="border border-gray-200 p-5 mb-8">
        <h2 className="text-lg font-medium mb-1">
          Create Campaign
        </h2>

        <p className="text-sm text-gray-500 mb-4">
          Goes to all{" "}
          <span className="font-medium text-gray-800">
            {activeCount}
          </span>{" "}
          active subscriber(s). Unsubscribed
          addresses are excluded automatically.
        </p>

        <label className="block text-sm font-medium mb-1">
          Subject
        </label>

        <input
          type="text"
          value={subject}
          maxLength={200}
          onChange={(event) =>
            setSubject(event.target.value)
          }
          placeholder="Our New Collection"
          className={field}
          disabled={sending}
        />

        <label className="block text-sm font-medium mt-4 mb-1">
          Message
        </label>

        <textarea
          value={message}
          rows={6}
          maxLength={20000}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Discover our latest products..."
          className={`${field} resize-y`}
          disabled={sending}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              CTA text (optional)
            </label>

            <input
              type="text"
              value={ctaText}
              maxLength={60}
              onChange={(event) =>
                setCtaText(event.target.value)
              }
              placeholder="Shop Now"
              className={field}
              disabled={sending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              CTA link (optional)
            </label>

            <input
              type="url"
              value={ctaUrl}
              maxLength={2000}
              onChange={(event) =>
                setCtaUrl(event.target.value)
              }
              placeholder="https://your-store.com/new"
              className={field}
              disabled={sending}
            />
          </div>
        </div>

        <button
          onClick={send}
          disabled={!canSend}
          className="mt-5 flex items-center gap-2 bg-black text-white text-xs px-8 py-4 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SendIcon />

          {sending
            ? "SENDING..."
            : "SEND CAMPAIGN"}
        </button>
      </div>

      {/* ================= HISTORY ================= */}

      <h2 className="text-lg font-medium mb-3">
        Campaign History
      </h2>

      <div className="border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">
                Subject
              </th>

              <th className="px-4 py-3 font-medium">
                Status
              </th>

              <th className="px-4 py-3 font-medium">
                Audience
              </th>

              <th className="px-4 py-3 font-medium">
                Sent
              </th>

              <th className="px-4 py-3 font-medium">
                Failed
              </th>

              <th className="px-4 py-3 font-medium">
                Date
              </th>
            </tr>
          </thead>

          <tbody>
            {historyLoadingNow && (
              <tr>
                <td
                  colSpan="6"
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Loading campaigns…
                </td>
              </tr>
            )}

            {!historyLoadingNow &&
              campaigns.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    No campaigns sent yet.
                  </td>
                </tr>
              )}

            {!historyLoadingNow &&
              campaigns.map((campaign) => (
                <tr
                  key={campaign._id}
                  className="border-t border-gray-100"
                >
                  <td className="px-4 py-3">
                    {campaign.subject}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs border rounded ${
                        campaign.status ===
                        "completed"
                          ? "text-green-700 bg-green-50 border-green-300"
                          : campaign.status ===
                              "sending"
                            ? "text-blue-700 bg-blue-50 border-blue-300"
                            : "text-red-700 bg-red-50 border-red-300"
                      }`}
                    >
                      {campaign.status}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    {campaign.audienceCount}
                  </td>

                  <td className="px-4 py-3">
                    {campaign.sentCount}
                  </td>

                  <td className="px-4 py-3">
                    {campaign.failedCount}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(
                      campaign.createdAt
                    ).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default NewsletterCampaigns;