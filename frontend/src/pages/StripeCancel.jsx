import { useContext, useEffect, useRef } from "react";

import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

// =========================================
// STRIPE CANCEL
// =========================================
// Reached when the customer backs out of the
// hosted Stripe Checkout page.
//
// The browser never decides the order state.
// It asks the backend to record the
// cancellation, and the backend refuses to
// downgrade an order whose payment has
// already been verified.
// =========================================

function StripeCancel() {
  const {
    cancelStripeCheckout,
    navigate,
  } = useContext(ShopContext);

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

    if (orderId) {
      // Fire and forget: the result only
      // matters for bookkeeping, and the cart
      // is never cleared from here.
      cancelStripeCheckout(orderId);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 min-h-[60vh] text-center">

      <Title
        text1="PAYMENT"
        text2="CANCELLED"
      />

      <p className="text-sm text-gray-500 max-w-md">
        No payment was taken and your
        basket has been kept exactly as it
        was.
      </p>

      <button
        onClick={() =>
          navigate("/cart")
        }
        className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
      >
        BACK TO CART
      </button>

    </div>
  );
}

export default StripeCancel;