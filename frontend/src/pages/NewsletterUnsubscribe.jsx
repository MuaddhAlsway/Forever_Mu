import {
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { Link } from "react-router-dom";

import {
  ShopContext,
} from "../context/ShopContext.jsx";


// =========================================
// COMPONENT
// =========================================
// The destination of the "Unsubscribe" link inside
// every newsletter email.
//
// The token arrives in the query string and is
// sent to the backend, which verifies its
// signature. Nothing about the subscriber is
// decided in the browser: this page only reports
// what the backend answered, so a tampered URL
// cannot unsubscribe anyone on its own.
//
// A GET request is used because that is what a
// link click produces, and the backend operation
// is idempotent, so a double-click or a re-opened
// email is harmless.
// =========================================

function NewsletterUnsubscribe() {

  const { backendUrl } =
    useContext(ShopContext);

  // Read during render rather than in an effect, so
  // a link with no token never needs a state update.
  const token =
    new URLSearchParams(window.location.search)
      .get("token");

  const [state, setState] = useState(() =>
    token
      ? { phase: "loading", message: "" }
      : {
          phase: "invalid",
          message:
            "This unsubscribe link is missing its token. Open the link straight from your email again.",
        }
  );

  // React 18+ runs effects twice in development, so
  // the request is guarded to fire once per page.
  const requested = useRef(false);

  useEffect(() => {
    if (!token || requested.current) {
      return;
    }

    requested.current = true;

    const run = async () => {
      try {
        const response = await fetch(
          `${backendUrl}/api/newsletter/unsubscribe?token=${encodeURIComponent(
            token
          )}`
        );

        const data = await response
          .json()
          .catch(() => ({}));

        if (data.success) {
          setState({
            phase: "done",
            message:
              data.message ||
              "You have been unsubscribed successfully.",
          });

          return;
        }

        setState({
          phase: "invalid",
          message:
            data.message ||
            "This unsubscribe link is not valid or has expired.",
        });
      } catch {
        setState({
          phase: "error",
          message:
            "We could not reach the server. Please try again in a moment.",
        });
      }
    };

    run();
  }, [backendUrl, token]);


  const tone =
    state.phase === "done"
      ? "text-green-700"
      : state.phase === "loading"
        ? "text-gray-500"
        : "text-red-600";

  const heading =
    state.phase === "done"
      ? "You have been unsubscribed"
      : state.phase === "loading"
        ? "Unsubscribing…"
        : "We could not unsubscribe you";

  return (
    <div className="py-16 flex flex-col items-center text-center">

      <h1 className="text-3xl font-medium text-gray-800">
        {heading}
      </h1>

      <p
        role="status"
        aria-live="polite"
        className={`mt-4 max-w-md ${tone}`}
      >
        {state.phase === "loading"
          ? "One moment please."
          : state.message}
      </p>

      {/* Re-subscribing is always possible: the
          address is already on file, so submitting
          it again reactivates the same record. */}

      <p className="mt-6 text-sm text-gray-500 max-w-md">
        Changed your mind? You can subscribe again
        at any time and you will not be emailed twice.
      </p>

      <Link
        to="/"
        className="mt-8 inline-block bg-black text-white text-xs px-10 py-4"
      >
        BACK TO SHOP
      </Link>

    </div>
  );
}

export default NewsletterUnsubscribe;