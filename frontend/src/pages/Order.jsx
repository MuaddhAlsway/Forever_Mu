import {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  ShopContext,
} from "../context/ShopContext";


// =========================================
// ICONS
// =========================================

const PackageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-5 h-5"
  >
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </svg>
);


const ArrowRightIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
  >
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);


const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-4 h-4"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="16"
      rx="2"
    />
    <path d="M16 3v4" />
    <path d="M8 3v4" />
    <path d="M3 10h18" />
  </svg>
);


const CreditCardIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-4 h-4"
  >
    <rect
      x="3"
      y="5"
      width="18"
      height="14"
      rx="2"
    />
    <path d="M3 10h18" />
  </svg>
);


// =========================================
// ORDER
// =========================================

function Order() {

  const {
    orders,
    currency,
    formatPrice,
    orderAmount,
    getUserOrders,
    navigate,
    token,
  } = useContext(ShopContext);


  const [
    loading,
    setLoading,
  ] = useState(true);


  // =========================================
  // LOAD USER ORDERS
  // =========================================

  useEffect(() => {

    const loadOrders =
      async () => {

        if (!token) {

          setLoading(false);

          return;

        }


        try {

          setLoading(true);

          await getUserOrders(
            token
          );

        } catch (error) {

          console.error(
            "Load orders error:",
            error
          );

        } finally {

          setLoading(false);

        }

      };


    loadOrders();

  }, [token]);


  // =========================================
  // PAYMENT METHOD
  // =========================================

  const getPaymentMethod =
    (method) => {

      switch (method) {

        case "cod":
          return "Cash on Delivery";

        case "stripe":
          return "Stripe";

        default:
          return method || "Unknown";

      }

    };


  // =========================================
  // PAYMENT STATUS
  // =========================================
  // Reads the real server state. Legacy orders
  // predate paymentStatus, so they fall back to
  // the boolean `payment` field.

  /**
   * The currency an order must be displayed in.
   *
   * `displayCurrency` is resolved by the backend:
   * an explicitly stored currency always wins, so
   * a legacy SAR order stays SAR. The store's
   * current currency is only the last resort.
   */
  const currencyOf =
    (order) =>
      order?.displayCurrency ||
      order?.currency ||
      currency;

  const paymentStatusOf = (order) =>
    order.paymentStatus ||
    (order.payment ? "paid" : "pending");

  const paymentStatusLabel = (order) => {
    const status = paymentStatusOf(order);

    switch (status) {
      case "paid":
        return "Paid";

      case "pending":
        // COD is legitimately unpaid until the
        // order is delivered and collected.
        return order.paymentMethod === "cod"
          ? "Pay on delivery"
          : "Awaiting payment";

      case "failed":
        return "Payment failed";

      case "cancelled":
        return "Payment cancelled";

      case "refunded":
        return "Refunded";

      case "partially_refunded":
        return "Partially refunded";

      default:
        return "Unknown";
    }
  };

  const paymentStatusColor = (order) => {
    switch (paymentStatusOf(order)) {
      case "paid":
        return "text-emerald-600";

      case "failed":
      case "cancelled":
        return "text-red-600";

      case "refunded":
      case "partially_refunded":
        return "text-sky-700";

      default:
        return "text-amber-600";
    }
  };


  // =========================================
  // SHORT ORDER ID
  // =========================================

  const getShortOrderId =
    (id) => {

      if (!id) {
        return "N/A";
      }


      return id
        .slice(-8)
        .toUpperCase();

    };


  // =========================================
  // FORMAT DATE
  // =========================================

  const formatDate =
    (date) => {

      if (!date) {
        return "N/A";
      }


      return new Date(
        date
      ).toLocaleDateString(
        undefined,
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

    };


  // =========================================
  // TOTAL ITEMS
  // =========================================

  const getTotalItems =
    (items = []) => {

      return items.reduce(
        (
          total,
          item
        ) =>
          total +
          Number(
            item.quantity || 0
          ),
        0
      );

    };


  // =========================================
  // IMAGE
  // =========================================

  const getProductImage =
    (image) => {

      if (!image) {
        return "";
      }


      if (
        Array.isArray(image)
      ) {

        return image[0] || "";

      }


      return image;

    };


  // =========================================
  // STATUS STYLE
  // =========================================

  const getStatusStyle =
    (status) => {

      switch (status) {

        case "Delivered":
          return {
            container:
              "bg-emerald-50 text-emerald-700 border-emerald-100",

            dot:
              "bg-emerald-500",
          };


        case "Out for Delivery":
          return {
            container:
              "bg-blue-50 text-blue-700 border-blue-100",

            dot:
              "bg-blue-500",
          };


        case "Shipped":
          return {
            container:
              "bg-violet-50 text-violet-700 border-violet-100",

            dot:
              "bg-violet-500",
          };


        case "Packing":
          return {
            container:
              "bg-amber-50 text-amber-700 border-amber-100",

            dot:
              "bg-amber-500",
          };


        default:
          return {
            container:
              "bg-gray-100 text-gray-700 border-gray-200",

            dot:
              "bg-gray-500",
          };

      }

    };


  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="border-t min-h-[70vh] py-12 sm:py-16">

        <div className="max-w-6xl mx-auto">

          {/* HEADER SKELETON */}

          <div className="animate-pulse">

            <div className="h-3 w-24 bg-gray-200 rounded mb-4"></div>

            <div className="h-10 w-52 bg-gray-200 rounded-lg"></div>

            <div className="h-4 w-80 max-w-full bg-gray-100 rounded mt-4"></div>


            {/* ORDER SKELETONS */}

            <div className="space-y-5 mt-12">

              {[1, 2].map(
                (item) => (

                  <div
                    key={item}
                    className="border border-gray-200 rounded-3xl bg-white p-6"
                  >

                    <div className="flex gap-5">

                      <div className="w-24 h-28 bg-gray-100 rounded-2xl"></div>

                      <div className="flex-1">

                        <div className="h-5 w-48 bg-gray-100 rounded"></div>

                        <div className="h-4 w-32 bg-gray-100 rounded mt-3"></div>

                        <div className="h-4 w-64 bg-gray-100 rounded mt-8"></div>

                      </div>

                    </div>

                  </div>

                )
              )}

            </div>

          </div>

        </div>

      </div>

    );

  }


  // =========================================
  // UI
  // =========================================

  return (

    <div className="border-t bg-[#fafafa] min-h-screen">

      <div className="max-w-6xl mx-auto py-10 sm:py-14 lg:py-16">

        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">

          <div>

            <p className="text-[11px] sm:text-xs font-medium uppercase tracking-[0.2em] text-gray-400 mb-3">
              Account
            </p>


            <h1 className="text-3xl sm:text-4xl font-semibold tracking-[-0.04em] text-gray-950">

              My Orders

            </h1>


            <p className="text-sm text-gray-500 mt-3 max-w-lg leading-6">

              View your purchases and follow the latest delivery updates.

            </p>

          </div>


          {orders.length >
            0 && (

            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">

              <p className="text-xs text-gray-400">
                Total orders
              </p>

              <p className="font-semibold mt-0.5">
                {orders.length}
              </p>

            </div>

          )}

        </div>


        {/* ========================================= */}
        {/* NO ORDERS */}
        {/* ========================================= */}

        {orders.length ===
        0 ? (

          <div className="bg-white border border-gray-200 rounded-[28px] py-20 px-6 text-center shadow-sm">

            <div className="w-16 h-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500">

              <PackageIcon />

            </div>


            <h2 className="text-xl font-semibold tracking-tight mt-6">
              No orders yet
            </h2>


            <p className="text-sm text-gray-500 mt-3 max-w-sm mx-auto leading-6">

              When you place your first order, you'll be able to view and track it here.

            </p>


            <button
              onClick={() =>
                navigate(
                  "/collection"
                )
              }
              className="mt-7 inline-flex items-center gap-2 bg-black text-white rounded-xl px-6 py-3 text-sm font-medium hover:bg-gray-800 transition cursor-pointer"
            >

              Start Shopping

              <ArrowRightIcon />

            </button>

          </div>

        ) : (

          /* ========================================= */
          /* ORDERS */
          /* ========================================= */

          <div className="space-y-5">

            {orders.map(
              (order) => {

                const status =
                  order.status ||
                  "Order Placed";


                const statusStyle =
                  getStatusStyle(
                    status
                  );


                const itemCount =
                  getTotalItems(
                    order.items
                  );

                // Currency this specific order was
                // placed in (USD for new orders,
                // SAR for legacy ones).
                const orderCurrency =
                  currencyOf(order);


                const firstItem =
                  order.items?.[0];


                const remainingItems =
                  Math.max(
                    (order.items?.length ||
                      0) - 1,
                    0
                  );


                return (

                  <article
                    key={
                      order._id
                    }
                    className="group bg-white border border-gray-200/80 rounded-[26px] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
                  >

                    {/* ========================================= */}
                    {/* TOP BAR */}
                    {/* ========================================= */}

                    <div className="px-5 sm:px-7 py-5 border-b border-gray-100">

                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">

                        {/* ORDER ID */}

                        <div>

                          <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400 font-medium">
                            Order
                          </p>


                          <p className="font-semibold text-gray-950 mt-1">

                            #
                            {getShortOrderId(
                              order._id
                            )}

                          </p>

                        </div>


                        {/* META */}

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">

                          {/* DATE */}

                          <div className="flex items-center gap-2 text-sm text-gray-500">

                            <CalendarIcon />

                            <span>

                              {formatDate(
                                order.date
                              )}

                            </span>

                          </div>


                          {/* PAYMENT */}

                          <div className="flex items-center gap-2 text-sm text-gray-500">

                            <CreditCardIcon />

                            <span>

                              {getPaymentMethod(
                                order.paymentMethod
                              )}

                            </span>

                          </div>


                          {/* STATUS */}

                          <div
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${statusStyle.container}`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`}
                            ></span>

                            {status}

                          </div>

                        </div>

                      </div>

                    </div>


                    {/* ========================================= */}
                    {/* ORDER BODY */}
                    {/* ========================================= */}

                    <div className="p-5 sm:p-7">

                      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-7 lg:items-center">

                        {/* ========================================= */}
                        {/* PRODUCTS */}
                        {/* ========================================= */}

                        <div className="min-w-0">

                          <div className="flex flex-col gap-5">

                            {order.items?.map(
                              (
                                item,
                                index
                              ) => {

                                const image =
                                  getProductImage(
                                    item.image
                                  );


                                const itemTotal =
                                  Number(
                                    item.price ||
                                      0
                                  ) *
                                  Number(
                                    item.quantity ||
                                      0
                                  );


                                return (

                                  <div
                                    key={`${order._id}-${item._id}-${item.size}-${index}`}
                                    className="flex gap-4 sm:gap-5"
                                  >

                                    {/* IMAGE */}

                                    <div className="w-20 h-24 sm:w-24 sm:h-28 rounded-2xl bg-gray-100 overflow-hidden shrink-0">

                                      {image ? (

                                        <img
                                          src={
                                            image
                                          }
                                          alt={
                                            item.name ||
                                            "Product"
                                          }
                                          className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                                        />

                                      ) : (

                                        <div className="w-full h-full flex items-center justify-center text-gray-400">

                                          <PackageIcon />

                                        </div>

                                      )}

                                    </div>


                                    {/* PRODUCT DETAILS */}

                                    <div className="flex-1 min-w-0 py-1">

                                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">

                                        <div className="min-w-0">

                                          <h3 className="font-medium sm:text-base text-gray-950 truncate">

                                            {
                                              item.name
                                            }

                                          </h3>


                                          <div className="flex flex-wrap gap-2 mt-3">

                                            {item.size && (

                                              <span className="bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1.5 text-xs">

                                                Size{" "}

                                                <span className="font-medium text-gray-900">

                                                  {
                                                    item.size
                                                  }

                                                </span>

                                              </span>

                                            )}


                                            <span className="bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1.5 text-xs">

                                              Qty{" "}

                                              <span className="font-medium text-gray-900">

                                                {
                                                  item.quantity
                                                }

                                              </span>

                                            </span>

                                          </div>


<p className="text-xs text-gray-400 mt-3">

                                            {formatPrice(
                                              item.price ||
                                                0,
                                              orderCurrency
                                            )}

                                            {" "}each

                                          </p>

                                        </div>


                                        <p className="font-semibold text-gray-950 shrink-0">

                                          {formatPrice(
                                            itemTotal,
                                            orderCurrency
                                          )}

                                        </p>

                                      </div>

                                    </div>

                                  </div>

                                );

                              }
                            )}

                          </div>

                        </div>


                        {/* ========================================= */}
                        {/* ORDER ACTION */}
                        {/* ========================================= */}

                        <div className="lg:w-[230px] lg:border-l lg:border-gray-100 lg:pl-7">

                          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">

                            {/* TOTAL ITEMS */}

                            <div>

                              <p className="text-xs text-gray-400">
                                Items
                              </p>


                              <p className="text-sm font-medium mt-1">

                                {itemCount}{" "}

                                {itemCount ===
                                1
                                  ? "item"
                                  : "items"}

                              </p>

                            </div>


                            {/* PAYMENT */}

                            <div>

                              <p className="text-xs text-gray-400">
                                Payment
                              </p>


                              <p
                                className={`text-sm font-medium mt-1 ${paymentStatusColor(
                                  order
                                )}`}
                              >

                                {paymentStatusLabel(
                                  order
                                )}

                              </p>

                            </div>

                          </div>


                          {/* TOTAL */}

                          <div className="border-t border-gray-100 mt-5 pt-5">

                            <div className="flex items-end justify-between">

                              <div>

                                <p className="text-xs text-gray-400">
                                  Total
                                </p>


                                <p className="text-xl font-semibold tracking-tight mt-1">

                                  {/*
                                    Rendered in the
                                    order's OWN stored
                                    currency. A legacy SAR
                                    order must never be
                                    relabelled as USD.
                                  */}
                                  {orderAmount(
                                    order
                                  )}

                                </p>

                              </div>

                            </div>

                          </div>


                          {/* TRACK */}

                          <button
                            onClick={() =>
                              navigate(
                                `/trackorder/${order._id}`
                              )
                            }
                            className="w-full mt-5 h-11 rounded-xl bg-black text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition cursor-pointer"
                          >

                            Track Order

                            <ArrowRightIcon />

                          </button>

                        </div>

                      </div>

                    </div>


                    {/* ========================================= */}
                    {/* MOBILE / BOTTOM STATUS BAR */}
                    {/* ========================================= */}

                    <div className="bg-gray-50/80 border-t border-gray-100 px-5 sm:px-7 py-4">

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                        <div className="flex items-center gap-3">

                          <span
                            className={`relative flex w-2 h-2`}
                          >

                            {status !==
                              "Delivered" && (

                              <span
                                className={`absolute inline-flex h-full w-full rounded-full opacity-40 animate-ping ${statusStyle.dot}`}
                              ></span>

                            )}


                            <span
                              className={`relative inline-flex rounded-full w-2 h-2 ${statusStyle.dot}`}
                            ></span>

                          </span>


                          <p className="text-sm">

                            <span className="text-gray-500">
                              Current status:
                            </span>{" "}

                            <span className="font-medium text-gray-900">
                              {status}
                            </span>

                          </p>

                        </div>


                        {firstItem && (

                          <p className="text-xs text-gray-400">

                            {firstItem.name}

                            {remainingItems >
                              0 &&
                              ` + ${remainingItems} more`}

                          </p>

                        )}

                      </div>

                    </div>

                  </article>

                );

              }
            )}

          </div>

        )}

      </div>

    </div>

  );
}

export default Order;