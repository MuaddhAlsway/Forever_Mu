import {
  useContext,
  useState,
} from "react";

import axios from "axios";

import {
  toast,
} from "react-toastify";

import {
  ShopContext,
} from "../context/ShopContext.jsx";


// =========================================
// COMPONENT
// =========================================
// Subscribes a visitor with nothing but an
// email address. No account is required and
// none is created.
//
// The heading deliberately does NOT promise a
// discount. This project has no coupon,
// discount-code or promotion logic anywhere in
// checkout, so advertising "20% off" here
// would be a claim the store cannot honour.

function Newsletter() {

  // ---- BACKEND URL ----
  // Comes from the project's own context so the
  // host is never hardcoded in this component.

  const { backendUrl } =
    useContext(ShopContext);

  // ---- STATE ----

  const [email, setEmail] =
    useState("");

  // Blocks repeat submits while a request is in
  // flight, so one click cannot create two.

  const [loading, setLoading] =
    useState(false);

  // Inline status, shown next to the form. The
  // toast alone is not enough on its own.

  const [status, setStatus] =
    useState({
      type: "",
      text: "",
    });


  // =========================================
  // SUBMIT
  // =========================================

  const onSubmitHandler =
    async (event) => {
      // Stops the real page reload that
      // preventDefault() used to paper over.
      event.preventDefault();

      if (loading) {
        return;
      }

      // A required email input still lets
      // through values the browser considers
      // syntactically valid but the server
      // rejects, so the trim check stays.

      if (email.trim() === "") {
        setStatus({
          type: "error",
          text: "Please enter your email address.",
        });

        toast.error(
          "Please enter your email address."
        );

        return;
      }

      setLoading(true);

      setStatus({
        type: "",
        text: "",
      });

      try {
        const response = await axios.post(
          backendUrl + "/api/newsletter/subscribe",
          { email },
          {
            // Newsletter is public, so no token
            // is sent and none is required.
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        const data = response.data || {};

        if (data.success) {
          // Covers both a first subscription and a
          // reactivation, which the server
          // distinguishes with these flags.
          const message =
            data.message ||
            "Thanks for subscribing!";

          setStatus({
            type: "success",
            text: message,
          });

          toast.success(message);

          // Field cleared only on a confirmed
          // success, so a failure never loses
          // what was typed.
          setEmail("");
        } else {
          const message =
            data.message ||
            "Unable to subscribe right now. Please try again.";

          setStatus({
            type: "error",
            text: message,
          });

          toast.error(message);
        }
      } catch (error) {
        // Server rejections carry a useful
        // customer-safe message. Network and
        // unexpected failures fall back to a
        // generic line, never a raw stack trace.
        const message =
          error?.response?.data?.message ||
          "Unable to subscribe right now. Please try again.";

        setStatus({
          type: "error",
          text: message,
        });

        toast.error(message);
      } finally {
        setLoading(false);
      }
    };


  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="text-center">

      {/* ---- HEADING ---- */}
      {/* No discount is advertised because no
          discount system exists in checkout. */}

      <p className="text-2xl font-medium text-gray-800">
        Subscribe to our newsletter
      </p>

      <p className="text-gray-400 mt-3">
        Stay updated with our latest collections,
        exclusive offers, fashion trends, and
        special deals.
      </p>

      {/* ---- FORM ---- */}

      <form
        onSubmit={onSubmitHandler}
        className="w-full sm:w-1/2 items-center flex gap-3 mx-auto my-6 border pl-3"
      >
        <input
          className="w-full sm:flex-1 outline-none py-2"
          type="email"
          name="email"
          placeholder="Enter your email"
          value={email}
          onChange={(event) =>
            setEmail(event.target.value)
          }
          // Disabled mid-request so the value
          // cannot change under an in-flight
          // submit.
          disabled={loading}
          autoComplete="email"
          aria-label="Email address"
          aria-invalid={
            status.type === "error"
          }
        />

        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="bg-black text-white text-xs px-10 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "SUBSCRIBING..." : "SUBSCRIBE"}
        </button>
      </form>

      {/* ---- INLINE STATUS ----
          Kept in the DOM even when empty so the
          layout does not jump when a message
          appears. */}

      <p
        role="status"
        aria-live="polite"
        className="min-h-[1.25rem] text-sm"
      >
        {status.text && (
          <span
            className={
              status.type === "success"
                ? "text-green-600"
                : "text-red-500"
            }
          >
            {status.text}
          </span>
        )}
      </p>

    </div>
  );
}

export default Newsletter;