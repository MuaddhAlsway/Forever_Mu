import { useContext, useState } from "react";

import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";
import { toast } from "react-toastify";

function PlaceOrder() {
  // =========================================================
  // CONTEXT
  // =========================================================

  const {
    delivery_fee,
    formatPrice,
    getCartAmount,
    createOrder,
    startStripeCheckout,
    onlineProviders,
    navigate,
    token,
  } = useContext(ShopContext);

  // =========================================================
  // PAYMENT METHODS
  // =========================================================

  /*
   * COD is always available.
   *
   * Stripe is displayed ONLY when the backend reports that
   * Stripe is configured and available.
   *
   * Do not hardcode Stripe as available in production.
   */

  const availableMethods = ["cod", "stripe"].filter(
    (name) =>
      name === "cod" ||
      onlineProviders?.[name] === true
  );

  const [method, setMethod] = useState("cod");
  const [loading, setLoading] = useState(false);

  // =========================================================
  // DELIVERY FORM
  // =========================================================

  /*
   * IMPORTANT:
   *
   * There is intentionally NO savedAddresses here.
   *
   * Your previous crash:
   *
   * ReferenceError: savedAddresses is not defined
   *
   * happened because JSX referenced savedAddresses without
   * defining/loading it.
   *
   * For now checkout uses this delivery form directly.
   */

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  // =========================================================
  // INPUT HANDLER
  // =========================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // =========================================================
  // PAYMENT SELECTION
  // =========================================================

  const selectPaymentMethod = (paymentMethod) => {
    if (loading) return;

    setMethod(paymentMethod);
  };

  // =========================================================
  // SUBMIT ORDER
  // =========================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    // ---------------------------------------------------------
    // AUTHENTICATION
    // ---------------------------------------------------------

    if (!token) {
      toast.error("Please login to place an order");

      navigate("/login");

      return;
    }

    // ---------------------------------------------------------
    // EMPTY CART
    // ---------------------------------------------------------

    if (getCartAmount() === 0) {
      toast.error("Your cart is empty.");

      return;
    }

    // ---------------------------------------------------------
    // PAYMENT PROVIDER AVAILABILITY
    // ---------------------------------------------------------

    if (
      method !== "cod" &&
      onlineProviders?.[method] !== true
    ) {
      toast.error(
        "That payment method is not available right now."
      );

      return;
    }

    try {
      setLoading(true);

      // =====================================================
      // STRIPE
      // =====================================================

      if (method === "stripe") {
        const checkout =
          await startStripeCheckout(formData);

        if (checkout?.redirectUrl) {
          window.location.href =
            checkout.redirectUrl;

          return;
        }

        /*
         * ShopContext/startStripeCheckout should already
         * surface the provider error.
         */

        return;
      }

      // =====================================================
      // CASH ON DELIVERY
      // =====================================================

      const success =
        await createOrder(
          formData,
          method
        );

      if (success) {
        navigate("/orders");
      }
    } catch (error) {
      console.error(
        "Place order error:",
        error
      );

      toast.error(
        "Failed to place order"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // TOTALS
  // =========================================================

  const subtotal =
    getCartAmount();

  const total =
    subtotal + delivery_fee;

  // =========================================================
  // REUSABLE INPUT STYLE
  // =========================================================

  const inputClass =
    "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t pt-8 sm:pt-14 pb-20"
    >
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_430px] gap-10 xl:gap-16">

        {/* ================================================= */}
        {/* DELIVERY INFORMATION */}
        {/* ================================================= */}

        <section className="w-full">
          <div className="mb-8">
            <div className="text-xl sm:text-2xl">
              <Title
                text1="DELIVERY"
                text2="INFORMATION"
              />
            </div>

            <p className="mt-2 text-sm text-gray-500">
              Enter your shipping information to
              continue with your order.
            </p>
          </div>

          <div className="flex flex-col gap-4">

            {/* FIRST + LAST NAME */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="First name"
                autoComplete="given-name"
                className={inputClass}
              />

              <input
                required
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Last name"
                autoComplete="family-name"
                className={inputClass}
              />
            </div>

            {/* EMAIL */}

            <input
              required
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email address"
              autoComplete="email"
              className={inputClass}
            />

            {/* STREET */}

            <input
              required
              type="text"
              name="street"
              value={formData.street}
              onChange={handleChange}
              placeholder="Street address"
              autoComplete="street-address"
              className={inputClass}
            />

            {/* CITY + STATE */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
                autoComplete="address-level2"
                className={inputClass}
              />

              <input
                required
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="State"
                autoComplete="address-level1"
                className={inputClass}
              />
            </div>

            {/* ZIP + COUNTRY */}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                required
                type="text"
                name="zipcode"
                value={formData.zipcode}
                onChange={handleChange}
                placeholder="ZIP code"
                autoComplete="postal-code"
                className={inputClass}
              />

              <input
                required
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                autoComplete="country-name"
                className={inputClass}
              />
            </div>

            {/* PHONE */}

            <input
              required
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Phone number"
              autoComplete="tel"
              className={inputClass}
            />

            {/* INFORMATION */}

            <div className="mt-2 rounded-lg bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="mt-0.5 h-4 w-4 shrink-0 text-gray-500"
                  aria-hidden="true"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                  />

                  <path d="M12 16v-4" />

                  <path d="M12 8h.01" />
                </svg>

                <p className="text-xs leading-5 text-gray-500">
                  Make sure your shipping information is
                  correct before placing your order.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* CHECKOUT SIDEBAR */}
        {/* ================================================= */}

        <aside className="w-full">
          <div className="lg:sticky lg:top-24 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">

            {/* ================================================= */}
            {/* ORDER SUMMARY */}
            {/* ================================================= */}

            <section>
              <div className="text-xl">
                <Title
                  text1="ORDER"
                  text2="SUMMARY"
                />
              </div>

              <div className="mt-6 space-y-4 text-sm">

                {/* SUBTOTAL */}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">
                    Subtotal
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatPrice(subtotal)}
                  </span>
                </div>

                {/* SHIPPING */}

                <div className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">
                    Shipping
                  </span>

                  <span className="font-medium text-gray-900">
                    {formatPrice(delivery_fee)}
                  </span>
                </div>

                {/* TOTAL */}

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        Total
                      </p>

                      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-gray-400">
                        USD
                      </p>
                    </div>

                    <p className="text-xl font-semibold text-gray-950">
                      {formatPrice(total)}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* PAYMENT METHOD */}
            {/* ================================================= */}

            <section className="mt-10">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-gray-400">
                  Checkout
                </p>

                <h2 className="mt-1 text-lg font-semibold text-gray-950">
                  Payment method
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Choose how you'd like to pay.
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-4">

                {/* ================================================= */}
                {/* STRIPE */}
                {/* ================================================= */}

                {availableMethods.includes(
                  "stripe"
                ) && (
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      selectPaymentMethod(
                        "stripe"
                      )
                    }
                    aria-pressed={
                      method === "stripe"
                    }
                    className={`relative w-full rounded-xl border p-5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                      method === "stripe"
                        ? "border-[#635BFF] bg-[#FAFAFF] ring-1 ring-[#635BFF] shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-400"
                    }`}
                  >
                    {/* RECOMMENDED */}

                    <span className="absolute -top-2.5 right-4 rounded-full bg-[#635BFF] px-3 py-1 text-[9px] font-semibold tracking-[0.15em] text-white">
                      RECOMMENDED
                    </span>

                    <div className="flex items-start gap-3">

                      {/* RADIO */}

                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          method ===
                          "stripe"
                            ? "border-[#635BFF]"
                            : "border-gray-300"
                        }`}
                      >
                        {method ===
                          "stripe" && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#635BFF]" />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">

                        {/* STRIPE HEADER */}

                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-semibold text-gray-950">
                              Pay securely
                              with Stripe
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              Credit or
                              debit card
                            </p>
                          </div>

                          {assets?.stripe_logo && (
                            <img
                              src={
                                assets.stripe_logo
                              }
                              alt="Stripe"
                              className="h-6 w-auto shrink-0 object-contain"
                            />
                          )}
                        </div>

                        {/* CARD TYPES */}

                        <div className="mt-5 flex flex-wrap items-center gap-2">
                          <span className="rounded border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-[#1A1F71]">
                            VISA
                          </span>

                          <span className="rounded border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-gray-700">
                            Mastercard
                          </span>

                          <span className="rounded border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold text-[#006FCF]">
                            AMEX
                          </span>
                        </div>

                        {/* STRIPE SECURITY */}

                        <div className="mt-5 border-t border-gray-200 pt-4">
                          <div className="flex items-center gap-2">

                            {/* LOCK ICON */}

                            <svg
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              className="h-4 w-4 shrink-0 text-gray-500"
                              aria-hidden="true"
                            >
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="10"
                                rx="2"
                              />

                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>

                            <p className="text-xs font-medium text-gray-700">
                              Secure Stripe
                              Checkout
                            </p>
                          </div>

                          <p className="mt-2 text-xs leading-5 text-gray-500">
                            You'll be
                            redirected to
                            Stripe to enter
                            your payment
                            details and
                            complete your
                            purchase.
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                )}

                {/* ================================================= */}
                {/* CASH ON DELIVERY */}
                {/* ================================================= */}

                <button
                  type="button"
                  disabled={loading}
                  onClick={() =>
                    selectPaymentMethod(
                      "cod"
                    )
                  }
                  aria-pressed={
                    method === "cod"
                  }
                  className={`w-full rounded-xl border p-5 text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70 ${
                    method === "cod"
                      ? "border-black bg-gray-50 ring-1 ring-black"
                      : "border-gray-200 bg-white hover:border-gray-400"
                  }`}
                >
                  <div className="flex items-center gap-3">

                    {/* RADIO */}

                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                        method === "cod"
                          ? "border-black"
                          : "border-gray-300"
                      }`}
                    >
                      {method === "cod" && (
                        <span className="h-2.5 w-2.5 rounded-full bg-black" />
                      )}
                    </span>

                    <div>
                      <p className="font-medium text-gray-950">
                        Cash on Delivery
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Pay when your order
                        arrives.
                      </p>
                    </div>
                  </div>
                </button>
              </div>

              {/* ================================================= */}
              {/* SELECTED PAYMENT INFORMATION */}
              {/* ================================================= */}

              <div className="mt-5">
                {method === "stripe" ? (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <div className="flex items-start gap-2.5">

                      {/* SHIELD */}

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        className="mt-0.5 h-4 w-4 shrink-0 text-gray-500"
                        aria-hidden="true"
                      >
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                      </svg>

                      <p className="text-xs leading-5 text-gray-500">
                        Your payment details
                        are handled through
                        Stripe's hosted
                        checkout. Your order
                        is confirmed after
                        payment verification.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs leading-5 text-gray-500">
                      No online payment is
                      required. Pay when your
                      order arrives.
                    </p>
                  </div>
                )}
              </div>

              {/* ================================================= */}
              {/* CTA */}
              {/* ================================================= */}

              <button
                type="submit"
                disabled={loading}
                className={`mt-6 flex min-h-[54px] w-full items-center justify-center gap-2 rounded-lg px-6 py-4 text-xs font-semibold tracking-[0.08em] text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 ${
                  method === "stripe"
                    ? "bg-[#635BFF] hover:bg-[#5851e8]"
                    : "bg-black hover:bg-gray-800"
                }`}
              >
                {loading ? (
                  <>
                    {/* LOADING SPINNER */}

                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />

                    {method === "stripe"
                      ? "REDIRECTING TO STRIPE..."
                      : "PLACING ORDER..."}
                  </>
                ) : method ===
                  "stripe" ? (
                  <>
                    {/* LOCK */}

                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="10"
                        rx="2"
                      />

                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>

                    PAY SECURELY WITH STRIPE
                  </>
                ) : (
                  "PLACE ORDER"
                )}
              </button>

              {/* CTA DESCRIPTION */}

              <div className="mt-3 text-center">
                {method === "stripe" ? (
                  <p className="text-[11px] leading-5 text-gray-400">
                    You'll continue to
                    Stripe to complete your
                    payment.
                  </p>
                ) : (
                  <p className="text-[11px] leading-5 text-gray-400">
                    Pay for your order when
                    it arrives.
                  </p>
                )}
              </div>

              {/* ================================================= */}
              {/* STRIPE FOOTER */}
              {/* ================================================= */}

              {method === "stripe" &&
                availableMethods.includes(
                  "stripe"
                ) && (
                  <div className="mt-5 border-t border-gray-100 pt-5">
                    <div className="flex flex-wrap items-center justify-center gap-2 opacity-70">

                      {/* LOCK */}

                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        className="h-3.5 w-3.5 text-gray-500"
                        aria-hidden="true"
                      >
                        <rect
                          x="3"
                          y="11"
                          width="18"
                          height="10"
                          rx="2"
                        />

                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>

                      <span className="text-[9px] uppercase tracking-[0.15em] text-gray-500">
                        Secure checkout
                        powered by
                      </span>

                      {assets?.stripe_logo && (
                        <img
                          src={
                            assets.stripe_logo
                          }
                          alt="Stripe"
                          className="h-4 w-auto object-contain"
                        />
                      )}
                    </div>
                  </div>
                )}
            </section>
          </div>
        </aside>
      </div>
    </form>
  );
}

export default PlaceOrder;