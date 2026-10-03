import {
  useCallback,
  useEffect,
  useState,
} from "react";

import axios from "axios";

import {
  toast,
} from "react-toastify";

import NewsletterCampaigns from "../components/NewsletterCampaigns.jsx";


// =========================================
// ICONS
// =========================================

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-5 h-5"
  >
    <circle cx="11" cy="11" r="7" />

    <path d="m20 20-3.5-3.5" />
  </svg>
);


const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
  >
    <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5" />

    <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
  </svg>
);


const MailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-6 h-6"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
    />

    <path d="m3 7 9 6 9-6" />
  </svg>
);


// =========================================
// HELPERS
// =========================================

// Subscriber dates are rendered in the
// viewer's own locale and time zone, which is
// what an admin reconciling a campaign expects.

const formatDate = (value) => {
  if (!value) {
    return "â€”";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "â€”";
  }

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


// =========================================
// PAGE
// =========================================

function Newsletter({
  token,
}) {

  const backendUrl = (
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:4000"
  ).replace(/\/+$/, "");

  // ---- DATA ----

  const [subscribers, setSubscribers] =
    useState([]);

  const [stats, setStats] =
    useState({
      total: 0,
      active: 0,
      unsubscribed: 0,
    });

  // ---- UI STATE ----

  const [search, setSearch] =
    useState("");

  // What has actually been sent to the server.
  // Search is debounced, so keeping this
  // separate stops the list flickering on
  // every keystroke.

  const [appliedSearch, setAppliedSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [page, setPage] =
    useState(1);

  const [total, setTotal] =
    useState(0);

  const [totalPages, setTotalPages] =
    useState(1);

  const limit = 20;

  // Identifies which query is currently on
  // screen. The spinner is derived from this key
  // instead of being stored as its own boolean,
  // so the effect below never has to call
  // setState synchronously.

  const queryKey = [
    page,
    appliedSearch,
    statusFilter,
  ].join("|");

  const [loadedKey, setLoadedKey] =
    useState(null);

  const loading = loadedKey !== queryKey;


  // =========================================
  // FETCH SUBSCRIBERS
  // =========================================
  // Search and pagination are resolved by
  // MongoDB through the API. The browser only
  // ever holds the current page, so the table
  // stays fast at any list size.
  //
  // The network call and the state updates are
  // deliberately separate: `requestSubscribers`
  // owns the try/catch and touches no React
  // state, while `fetchSubscribers` only writes
  // state after an await. That keeps every state
  // update off the synchronous path.

  const requestSubscribers =
    useCallback(async (
      pageToFetch,
      searchTerm,
      status,
    ) => {
      try {
        const response = await axios.get(
          `${backendUrl}/api/newsletter/admin/subscribers`,
          {
            headers: {
              token,
            },
            params: {
              page: pageToFetch,
              limit,
              ...(searchTerm
                ? { search: searchTerm }
                : {}),
              ...(status !== "all"
                ? { status }
                : {}),
            },
          }
        );

        return {
          ok: true,
          data: response.data || {},
        };
      } catch (error) {
        return {
          ok: false,
          error,
        };
      }
    }, [backendUrl, token]);


  const fetchSubscribers =
    useCallback(async (
      pageToFetch = 1,
      searchTerm = "",
      status = "all",
    ) => {
      // Identifies the query this request
      // resolves, so the spinner clears only
      // once the CURRENT query has landed. A
      // slower earlier request cannot mark a
      // newer query as loaded.
      const key = [
        pageToFetch,
        searchTerm,
        status,
      ].join("|");

      const result = await requestSubscribers(
        pageToFetch,
        searchTerm,
        status
      );

      setLoadedKey(key);

      const data = result.ok ? result.data : null;

      // adminAuth answers with HTTP 200 and
      // success:false, so the payload has to be
      // checked rather than the status code.
      if (!result.ok || !data?.success) {
        setSubscribers([]);
        setTotal(0);
        setTotalPages(1);

        toast.error(
          result.error?.response?.data?.message ||
            data?.message ||
            "Failed to load subscribers"
        );

        return;
      }

      setSubscribers(data.subscribers || []);

      setTotal(data.total || 0);

      setTotalPages(data.totalPages || 1);

      // A page beyond the end after deleting or
      // filtering snaps back to a valid page.
      if (
        pageToFetch > 1 &&
        (data.subscribers || []).length === 0
      ) {
        setPage(1);
      }
    }, [requestSubscribers]);


  // ---- STATS ----

  const fetchStats =
    useCallback(async () => {
      try {
        const response = await axios.get(
          backendUrl + "/api/newsletter/admin/stats",
          {
            headers: {
              token,
            },
          }
        );

        const data = response.data || {};

        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch {
        // Statistics are supplementary. A
        // failure here must not blank the table.
      }
    }, [backendUrl, token]);


  // =========================================
  // EFFECTS
  // =========================================

  // Loads whichever query is currently active.
  // `page` is a dependency, so Next and Previous
  // actually re-fetch the new page instead of
  // only changing the label.

  useEffect(() => {
    // Every setState inside fetchSubscribers happens
    // after an `await`, so this cannot cascade a
    // render. The rule cannot see through the
    // useCallback boundary, and the same
    // fetch-on-mount pattern is already present in
    // List.jsx and Orders.jsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchSubscribers(page, appliedSearch, statusFilter);

    fetchStats();
  }, [
    fetchSubscribers,
    fetchStats,
    appliedSearch,
    statusFilter,
    page,
  ]);

  // Debounce keystrokes so a search is one
  // request, not one per character.

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppliedSearch(search.trim());
      setPage(1);
    }, 350);

    return () => clearTimeout(timer);
  }, [search]);


  // A manual refresh must re-run even when the
  // query key has not changed, so the loaded
  // marker is cleared first. That puts the
  // spinner back without the effect needing to
  // setState.
  const refresh = () => {
    setLoadedKey(null);

    fetchSubscribers(page, appliedSearch, statusFilter);

    fetchStats();
  };


  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="w-full">

      {/* ================= HEADER ================= */}

      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">

        <div className="flex items-center gap-3">
          <span className="p-2 border border-gray-300 rounded">
            <MailIcon />
          </span>

          <div>
            <h1 className="text-2xl font-medium">
              Newsletter Subscribers
            </h1>

            <p className="text-sm text-gray-500">
              Real subscribers stored in MongoDB
            </p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100 disabled:opacity-50"
        >
          <RefreshIcon />

          Refresh
        </button>
      </div>

      {/* ================= STATS =================
          Every number comes from a MongoDB count
          taken when the page loaded. */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">

        {[
          {
            label: "Total Subscribers",
            value: stats.total,
            tone: "border-gray-300",
          },
          {
            label: "Active Subscribers",
            value: stats.active,
            tone: "border-green-300",
          },
          {
            label: "Unsubscribed",
            value: stats.unsubscribed,
            tone: "border-red-300",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`border ${card.tone} p-4`}
          >
            <p className="text-sm text-gray-500">
              {card.label}
            </p>

            <p className="text-3xl font-medium mt-1">
              {card.value}
            </p>
          </div>
        ))}

      </div>

      {/* ================= FILTERS ================= */}

      <div className="flex flex-wrap items-center gap-3 mb-4">

        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <SearchIcon />
          </span>

          <input
            type="email"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search by email"
            className="w-full border border-gray-300 pl-10 pr-3 py-2 text-sm outline-none focus:border-pink-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(
              event.target.value
            );

            setPage(1);
          }}
          className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-pink-400"
        >
          <option value="all">
            All statuses
          </option>

          <option value="subscribed">
            Subscribed
          </option>

          <option value="unsubscribed">
            Unsubscribed
          </option>
        </select>

      </div>

      {/* ================= CAMPAIGNS =================
          Composer and history sit above the
          subscriber table. After a send, the parent
          refreshes so the counts stay truthful. */}

      <NewsletterCampaigns
        token={token}
        activeCount={stats.active}
        onSent={() => {
          fetchStats();

          setLoadedKey(null);

          fetchSubscribers(
            page,
            appliedSearch,
            statusFilter
          );
        }}
      />

      {/* ================= SUBSCRIBER TABLE ================= */}

      <div className="border border-gray-200 overflow-x-auto">

        <table className="w-full text-sm">

          <thead className="bg-gray-50">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">
                Email
              </th>

              <th className="px-4 py-3 font-medium">
                Status
              </th>

              <th className="px-4 py-3 font-medium">
                Subscribed Date
              </th>

              <th className="px-4 py-3 font-medium">
                Unsubscribed Date
              </th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan="4"
                  className="px-4 py-10 text-center text-gray-500"
                >
                  Loading subscribersâ€¦
                </td>
              </tr>
            )}

            {!loading &&
              subscribers.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-10 text-center text-gray-500"
                  >
                    {appliedSearch
                      ? "No subscribers match that search."
                      : "No subscribers yet."}
                  </td>
                </tr>
              )}

            {!loading &&
              subscribers.map((subscriber) => (
                <tr
                  key={subscriber._id}
                  className="border-t border-gray-100"
                >
                  <td className="px-4 py-3 break-all">
                    {subscriber.email}
                  </td>

                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 text-xs border rounded ${
                        subscriber.status ===
                        "subscribed"
                          ? "text-green-700 bg-green-50 border-green-300"
                          : "text-red-700 bg-red-50 border-red-300"
                      }`}
                    >
                      {subscriber.status ===
                      "subscribed"
                        ? "Subscribed"
                        : "Unsubscribed"}
                    </span>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatDate(
                      subscriber.subscribedAt
                    )}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    {subscriber.unsubscribedAt
                      ? formatDate(
                          subscriber.unsubscribedAt
                        )
                      : "â€”"}
                  </td>
                </tr>
              ))}

          </tbody>
        </table>
      </div>

      {/* ================= PAGINATION ================= */}

      <div className="flex flex-wrap items-center justify-between gap-3 mt-4 text-sm">

        <p className="text-gray-500">
          {total === 0
            ? "No subscribers"
            : `Showing ${
                (page - 1) * limit + 1
              }-${Math.min(
                page * limit,
                total
              )} of ${total}`}
        </p>

        <div className="flex items-center gap-3">

          <button
            onClick={() =>
              setPage((current) =>
                Math.max(1, current - 1)
              )
            }
            disabled={page <= 1 || loading}
            className="border border-gray-300 px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="px-2">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() =>
              setPage((current) =>
                Math.min(
                  totalPages,
                  current + 1
                )
              )
            }
            disabled={
              page >= totalPages || loading
            }
            className="border border-gray-300 px-4 py-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>

        </div>
      </div>

    </div>
  );
}

export default Newsletter;