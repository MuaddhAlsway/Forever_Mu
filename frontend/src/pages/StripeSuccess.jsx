import { useContext, useEffect, useRef, useState } from "react";

import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

// =========================================
// STRIPE SUCCESS
// =========================================
// Reached by redirect from Stripe Checkout.
//
// This page NEVER decides that a payment
// succeeded. It polls the backend, and the
// backend reads Stripe and applies exactly the
// same verification the webhook uses. The
// Stripe webhook remains the authoritative
// source; this poll only closes the gap for
// customers who return before the webhook
// lands.
// =========================================

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 15;

function StripeSuccess() {
  const {
    getStripeSessionStatus,
    navigate,
    currency,
    getUserCart,
  } = useContext(ShopContext);

  const [state, setState] =
    useState("checking");

  const [payment, setPayment] =
    useState(null);

  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    const params =
      new URLSearchParams(
        window.location.search
      );

    const orderId =
      params.get("order_id");

    const sessionId =
      params.get("session_id");

    if (!orderId || !sessionId) {
      setState("invalid");
      return;
    }

    let polls = 0;
    let cancelled = false;

    const poll = async () => {
      polls += 1;

      const result =
        await getStripeSessionStatus(
          orderId,
          sessionId
        );

      if (cancelled) {
        return;
      }

      if (!result) {
        setState("error");
        return;
      }

      const status =
        result.payment?.paymentStatus;

      if (status === "paid") {
        setPayment(result.payment);
        setState("paid");

        // The backend cleared the cart with
        // the verified payment; refresh so the
        // header count matches.
        getUserCart();

        return;
      }

      if (
        status === "failed" ||
        status === "cancelled"
      ) {
        setPayment(result.payment);
        setState(status);
        return;
      }

      // Still pending. The webhook may not
      // have been delivered yet, so keep
      // asking for a short while.
      if (polls < MAX_POLLS) {
        setTimeout(poll, POLL_INTERVAL_MS);
      } else {
        setState("pending");
      }
    };

    poll();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 min-h-[60vh] text-center">

      <Title
        text1="PAYMENT"
        text2="STATUS"
      />

      {state === "checking" && (
        <>
          <p className="text-lg">
            Confirming your payment
            ...
          </p>
          <p className="text-sm text-gray-500">
            Please do not close this page.
          </p>
        </>
      )}

      {state === "paid" && (
        <>
          <p className="text-2xl text-green-700">
            Payment received
          </p>

          {payment && (
            <p className="text-sm text-gray-600">
              Amount paid:{" "}
              <b>
                {payment.currency ||
                  currency}
                {Number(
                  payment.amount
                ).toFixed(2)}
              </b>
            </p>
          )}

          <button
            onClick={() =>
              navigate("/orders")
            }
            className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
          >
            VIEW MY ORDERS
          </button>
        </>
      )}

      {state === "pending" && (
        <>
          <p className="text-2xl">
            Payment still processing
          </p>
          <p className="text-sm text-gray-500 max-w-md">
            Your payment has not been
            confirmed yet. It updates
            automatically once the bank
            responds. Your basket has not
            been removed.
          </p>
          <button
            onClick={() =>
              navigate("/orders")
            }
            className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
          >
            GO TO MY ORDERS
          </button>
        </>
      )}

      {(state === "failed" ||
        state === "cancelled") && (
        <>
          <p className="text-2xl text-red-700">
            Payment{" "}
            {state}
          </p>
          <p className="text-sm text-gray-500 max-w-md">
            No money was taken. Your
            basket is still saved.
          </p>
          <button
            onClick={() =>
              navigate("/placeorder")
            }
            className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
          >
            RETURN TO CHECKOUT
          </button>
        </>
      )}

      {state === "invalid" && (
        <>
          <p className="text-2xl">
            Invalid payment link
          </p>
          <button
            onClick={() =>
              navigate("/orders")
            }
            className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
          >
            GO TO MY ORDERS
          </button>
        </>
      )}

      {state === "error" && (
        <>
          <p className="text-2xl">
            Could not confirm payment
          </p>
          <p className="text-sm text-gray-500 max-w-md">
            We could not reach the payment
            provider. If you were charged,
            your order updates automatically
            once the payment is confirmed.
          </p>
          <button
            onClick={() =>
              navigate("/orders")
            }
            className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
          >
            GO TO MY ORDERS
          </button>
        </>
      )}

    </div>
  );
}

export default StripeSuccess;