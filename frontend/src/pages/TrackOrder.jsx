import {
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useParams,
} from "react-router-dom";

import axios from "axios";

import {
  ShopContext,
} from "../context/ShopContext";


// =========================================
// ICONS
// =========================================

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-4 h-4"
  >
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
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
    <path d="M20 11a8 8 0 0 0-14.9-4" />
    <path d="M4 4v5h5" />
    <path d="M4 13a8 8 0 0 0 14.9 4" />
    <path d="M20 20v-5h-5" />
  </svg>
);


const PackageIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-6 h-6"
  >
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </svg>
);


const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    className="w-3.5 h-3.5"
  >
    <path d="m5 12 4 4L19 6" />
  </svg>
);


const TruckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-5 h-5"
  >
    <path d="M3 6h11v11H3z" />
    <path d="M14 10h4l3 3v4h-7z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
);


const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-5 h-5"
  >
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);


const CardIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    className="w-5 h-5"
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
// TRACK ORDER
// =========================================

function TrackOrder() {

  // =========================================
  // CONTEXT
  // =========================================

  const {
    navigate,
    backendUrl,
    token,
    currency,
    formatPrice,
    orderAmount,
  } = useContext(ShopContext);

  // =========================================
  // ORDER CURRENCY
  // =========================================
  // The order's OWN stored currency. The backend
  // resolves it, so a legacy SAR order is shown as
  // SAR and never relabelled USD.

  const currencyOf =
    (order) =>
      order?.displayCurrency ||
      order?.currency ||
      currency;


  // =========================================
  // PARAMS
  // =========================================

  const { orderId } =
    useParams();


  // =========================================
  // STATE
  // =========================================

  const [
    order,
    setOrder,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    refreshing,
    setRefreshing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  // =========================================
  // GET ORDER
  // =========================================

  const getOrderData =
    async (
      silent = false
    ) => {

      try {

        if (!silent) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }


        setError("");


        if (!token) {

          navigate("/login");

          return;

        }


        const response =
          await axios.post(
            backendUrl +
              "/api/order/track",

            {
              orderId,
            },

            {
              headers: {
                token,
              },
            }
          );


        if (
          response.data.success
        ) {

          setOrder(
            response.data.order
          );

        } else {

          setError(
            response.data.message ||
              "Order not found"
          );

        }

      } catch (error) {

        console.error(
          "Track order error:",
          error
        );


        setError(
          error.response?.data
            ?.message ||
            error.message ||
            "Failed to load order"
        );

      } finally {

        setLoading(false);
        setRefreshing(false);

      }

    };


  // =========================================
  // LOAD ORDER
  // =========================================

  useEffect(() => {

    if (!token) {

      navigate("/login");

      return;

    }


    if (orderId) {

      getOrderData();

    }

  }, [
    orderId,
    token,
  ]);


  // =========================================
  // PRODUCT IMAGE
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
          return method || "N/A";

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
  // DATE
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
  // TIME
  // =========================================

  const formatTime =
    (date) => {

      if (!date) {
        return "";
      }


      return new Date(
        date
      ).toLocaleTimeString(
        undefined,
        {
          hour: "2-digit",
          minute: "2-digit",
        }
      );

    };


  // =========================================
  // TOTAL ITEMS
  // =========================================

  const getTotalItems =
    () => {

      return (
        order?.items?.reduce(
          (
            total,
            item
          ) =>
            total +
            Number(
              item.quantity || 0
            ),
          0
        ) || 0
      );

    };


  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="border-t min-h-[70vh] py-12 sm:py-16">

        <div className="max-w-6xl mx-auto">

          <div className="animate-pulse">

            <div className="h-4 w-28 bg-gray-200 rounded mb-8"></div>


            <div className="h-10 w-72 bg-gray-200 rounded-lg mb-4"></div>

            <div className="h-4 w-96 max-w-full bg-gray-100 rounded mb-10"></div>


            <div className="h-52 bg-gray-100 rounded-3xl mb-6"></div>


            <div className="grid lg:grid-cols-[1.5fr_0.8fr] gap-6">

              <div className="h-96 bg-gray-100 rounded-3xl"></div>

              <div className="h-96 bg-gray-100 rounded-3xl"></div>

            </div>

          </div>

        </div>

      </div>

    );

  }


  // =========================================
  // ERROR
  // =========================================

  if (
    error ||
    !order
  ) {

    return (

      <div className="border-t min-h-[70vh] flex items-center justify-center py-16">

        <div className="max-w-md w-full text-center">

          <div className="w-16 h-16 rounded-2xl bg-gray-100 mx-auto flex items-center justify-center text-gray-500">

            <PackageIcon />

          </div>


          <h1 className="text-2xl font-semibold tracking-tight mt-6">
            Order unavailable
          </h1>


          <p className="text-sm text-gray-500 mt-3 leading-6">

            {error ||
              "We couldn't find this order."}

          </p>


          <button
            onClick={() =>
              navigate("/orders")
            }
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-black text-white px-6 py-3 text-sm font-medium hover:bg-gray-800 transition cursor-pointer"
          >

            <ArrowLeftIcon />

            Back to Orders

          </button>

        </div>

      </div>

    );

  }


  // =========================================
  // CURRENT TRACKING EVENT
  // =========================================

  const trackingHistory =
    order.trackingHistory || [];


  const currentTracking =
    trackingHistory[
      trackingHistory.length - 1
    ];


  const itemCount =
    getTotalItems();


  // =========================================
  // UI
  // =========================================

  return (

    <div className="border-t bg-[#fafafa] min-h-screen">

      <div className="max-w-6xl mx-auto py-10 sm:py-14 lg:py-16">

        {/* ========================================= */}
        {/* BACK */}
        {/* ========================================= */}

        <button
          onClick={() =>
            navigate("/orders")
          }
          className="group inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black transition mb-8 cursor-pointer"
        >

          <span className="group-hover:-translate-x-1 transition-transform">

            <ArrowLeftIcon />

          </span>

          Back to orders

        </button>


        {/* ========================================= */}
        {/* PAGE HEADER */}
        {/* ========================================= */}

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">

          <div>

            <p className="text-xs font-medium tracking-[0.2em] uppercase text-gray-400 mb-3">
              Order tracking
            </p>


            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.04em] text-gray-950">

              Track your order

            </h1>


            <p className="text-sm sm:text-base text-gray-500 mt-4">

              Order{" "}

              <span className="font-medium text-gray-800">

                #
                {getShortOrderId(
                  order._id
                )}

              </span>

              {" "}•{" "}

              {formatDate(
                order.date
              )}

            </p>

          </div>


          <button
            onClick={() =>
              getOrderData(true)
            }
            disabled={
              refreshing
            }
            className="inline-flex self-start lg:self-auto items-center justify-center gap-2 h-11 px-5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition disabled:opacity-50 cursor-pointer"
          >

            <span
              className={
                refreshing
                  ? "animate-spin"
                  : ""
              }
            >

              <RefreshIcon />

            </span>


            {refreshing
              ? "Refreshing..."
              : "Refresh"}

          </button>

        </div>


        {/* ========================================= */}
        {/* HERO STATUS */}
        {/* ========================================= */}

        <div className="relative overflow-hidden bg-black text-white rounded-[28px] p-6 sm:p-8 lg:p-10 mb-6">

          <div className="absolute -right-20 -top-24 w-64 h-64 rounded-full border border-white/10"></div>

          <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border border-white/10"></div>


          <div className="relative z-10">

            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">

              <div>

                <div className="inline-flex items-center gap-2 bg-white/10 border border-white/10 rounded-full px-3 py-1.5 mb-6">

                  <span className="relative flex w-2 h-2">

                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping"></span>

                    <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-400"></span>

                  </span>


                  <span className="text-xs font-medium text-white/80">
                    Current status
                  </span>

                </div>


                <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.03em]">

                  {order.status ||
                    "Status unavailable"}

                </h2>


                {currentTracking && (

                  <p className="text-sm text-white/50 mt-3">

                    Last updated{" "}

                    {formatDate(
                      currentTracking.date
                    )}{" "}

                    at{" "}

                    {formatTime(
                      currentTracking.date
                    )}

                  </p>

                )}

              </div>


              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 md:text-right">

                <div>

                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    Items
                  </p>

                  <p className="text-lg font-medium mt-2">
                    {itemCount}
                  </p>

                </div>


                <div>

                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    Payment
                  </p>

                  <p className="text-lg font-medium mt-2">

                    {order.payment
                      ? "Paid"
                      : "Pending"}

                  </p>

                </div>


                <div>

                  <p className="text-xs text-white/40 uppercase tracking-wider">
                    Total
                  </p>

                  <p className="text-lg font-medium mt-2">

                    {orderAmount(
                      order
                    )}

                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>


        {/* ========================================= */}
        {/* MAIN GRID */}
        {/* ========================================= */}

        <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.85fr] gap-6">

          {/* ========================================= */}
          {/* LEFT */}
          {/* ========================================= */}

          <div className="flex flex-col gap-6">

            {/* ========================================= */}
            {/* TRACKING HISTORY */}
            {/* ========================================= */}

            <section className="bg-white border border-gray-200/80 rounded-[24px] shadow-sm p-6 sm:p-8">

              <div className="flex items-start justify-between gap-5 mb-8">

                <div>

                  <h2 className="text-xl font-semibold tracking-tight text-gray-950">
                    Journey
                  </h2>


                  <p className="text-sm text-gray-500 mt-2">
                    Live updates for your order.
                  </p>

                </div>


                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">

                  <TruckIcon />

                </div>

              </div>


              {trackingHistory.length >
              0 ? (

                <div>

                  {trackingHistory
                    .slice()
                    .reverse()
                    .map(
                      (
                        tracking,
                        index
                      ) => {

                        const isCurrent =
                          index === 0;


                        const isLast =
                          index ===
                          trackingHistory.length -
                            1;


                        return (

                          <div
                            key={`${tracking.status}-${tracking.date}-${index}`}
                            className="relative flex gap-5"
                          >

                            {/* TIMELINE */}

                            <div className="flex flex-col items-center">

                              <div
                                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                  isCurrent
                                    ? "bg-black text-white"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >

                                <CheckIcon />

                              </div>


                              {!isLast && (

                                <div className="w-px flex-1 min-h-16 bg-gray-200"></div>

                              )}

                            </div>


                            {/* EVENT */}

                            <div
                              className={
                                isLast
                                  ? "pt-1.5"
                                  : "pt-1.5 pb-8"
                              }
                            >

                              <div className="flex flex-wrap items-center gap-3">

                                <h3
                                  className={`font-medium ${
                                    isCurrent
                                      ? "text-gray-950"
                                      : "text-gray-700"
                                  }`}
                                >

                                  {
                                    tracking.status
                                  }

                                </h3>


                                {isCurrent && (

                                  <span className="bg-gray-100 rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.12em] font-medium text-gray-500">
                                    Latest
                                  </span>

                                )}

                              </div>


                              <p className="text-sm text-gray-400 mt-2">

                                {formatDate(
                                  tracking.date
                                )}

                                {" • "}

                                {formatTime(
                                  tracking.date
                                )}

                              </p>

                            </div>

                          </div>

                        );

                      }
                    )}

                </div>

              ) : (

                <div className="bg-gray-50 rounded-2xl py-12 px-5 text-center">

                  <div className="w-12 h-12 bg-white rounded-xl border border-gray-200 mx-auto flex items-center justify-center text-gray-400">

                    <TruckIcon />

                  </div>


                  <p className="font-medium mt-4">
                    No tracking updates yet
                  </p>


                  <p className="text-sm text-gray-400 mt-2">
                    Updates will appear here when your order progresses.
                  </p>

                </div>

              )}

            </section>


            {/* ========================================= */}
            {/* ORDER ITEMS */}
            {/* ========================================= */}

            <section className="bg-white border border-gray-200/80 rounded-[24px] shadow-sm overflow-hidden">

              <div className="flex items-center justify-between px-6 sm:px-8 py-6 border-b border-gray-100">

                <div>

                  <h2 className="text-xl font-semibold tracking-tight">
                    Your items
                  </h2>


                  <p className="text-sm text-gray-500 mt-1">

                    {itemCount}{" "}

                    {itemCount === 1
                      ? "item"
                      : "items"}

                    {" "}in this order

                  </p>

                </div>


                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">

                  <PackageIcon />

                </div>

              </div>


              <div className="divide-y divide-gray-100">

                {order.items?.map(
                  (
                    item,
                    index
                  ) => {

                    const image =
                      getProductImage(
                        item.image
                      );


                    const total =
                      Number(
                        item.price || 0
                      ) *
                      Number(
                        item.quantity || 0
                      );


                    return (

                      <div
                        key={`${item._id}-${item.size}-${index}`}
                        className="p-5 sm:p-6 flex gap-5"
                      >

                        {/* IMAGE */}

                        <div className="w-24 h-28 sm:w-28 sm:h-32 rounded-2xl bg-gray-100 overflow-hidden shrink-0">

                          {image ? (

                            <img
                              src={image}
                              alt={
                                item.name
                              }
                              className="w-full h-full object-cover"
                            />

                          ) : (

                            <div className="w-full h-full flex items-center justify-center text-gray-400">

                              <PackageIcon />

                            </div>

                          )}

                        </div>


                        {/* PRODUCT INFO */}

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">

                          <div>

                            <h3 className="font-medium text-gray-950 sm:text-lg truncate">
                              {item.name}
                            </h3>


                            <div className="flex flex-wrap items-center gap-2 mt-3">

                              {item.size && (

                                <span className="bg-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">

                                  Size{" "}

                                  <span className="font-medium text-gray-900">
                                    {item.size}
                                  </span>

                                </span>

                              )}


                              <span className="bg-gray-100 rounded-lg px-2.5 py-1.5 text-xs text-gray-600">

                                Qty{" "}

                                <span className="font-medium text-gray-900">
                                  {item.quantity}
                                </span>

                              </span>

                            </div>

                          </div>


                          <div className="flex items-end justify-between gap-4 mt-4">

                            <p className="text-xs text-gray-400">

                              {formatPrice(
                                item.price || 0,
                                currencyOf(order)
                              )}

                              {" "}each

                            </p>


                            <p className="font-semibold text-gray-950">

                              {formatPrice(
                                total,
                                currencyOf(order)
                              )}

                            </p>

                          </div>

                        </div>

                      </div>

                    );

                  }
                )}

              </div>


              {/* ORDER TOTAL */}

              <div className="bg-gray-50 px-6 sm:px-8 py-5 flex items-center justify-between">

                <span className="text-sm font-medium text-gray-500">
                  Order total
                </span>


                <span className="text-xl font-semibold tracking-tight">

                  {orderAmount(order)}

                </span>

              </div>

            </section>

          </div>


          {/* ========================================= */}
          {/* RIGHT SIDEBAR */}
          {/* ========================================= */}

          <aside className="flex flex-col gap-6">

            {/* ========================================= */}
            {/* ORDER SUMMARY */}
            {/* ========================================= */}

            <section className="bg-white border border-gray-200/80 rounded-[24px] shadow-sm p-6">

              <p className="text-xs uppercase tracking-[0.16em] font-medium text-gray-400">
                Order summary
              </p>


              <div className="mt-6 space-y-5">

                <div>

                  <p className="text-xs text-gray-400">
                    Order ID
                  </p>

                  <p className="font-medium mt-1">
                    #
                    {getShortOrderId(
                      order._id
                    )}
                  </p>

                </div>


                <div className="h-px bg-gray-100"></div>


                <div>

                  <p className="text-xs text-gray-400">
                    Placed on
                  </p>

                  <p className="text-sm font-medium mt-1">

                    {formatDate(
                      order.date
                    )}

                    {" at "}

                    {formatTime(
                      order.date
                    )}

                  </p>

                </div>


                <div className="h-px bg-gray-100"></div>


                <div>

                  <p className="text-xs text-gray-400">
                    Full order reference
                  </p>

                  <p className="text-xs text-gray-600 break-all mt-2 leading-5">
                    {order._id}
                  </p>

                </div>

              </div>

            </section>


            {/* ========================================= */}
            {/* PAYMENT */}
            {/* ========================================= */}

            <section className="bg-white border border-gray-200/80 rounded-[24px] shadow-sm p-6">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">

                  <CardIcon />

                </div>


                <div>

                  <h2 className="font-semibold">
                    Payment
                  </h2>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Transaction details
                  </p>

                </div>

              </div>


              <div className="space-y-4">

                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-gray-500">
                    Method
                  </span>


                  <span className="text-sm font-medium text-right">

                    {getPaymentMethod(
                      order.paymentMethod
                    )}

                  </span>

                </div>


                <div className="flex items-center justify-between gap-4">

                  <span className="text-sm text-gray-500">
                    Status
                  </span>


                  <span
                    className={`text-xs font-medium px-2.5 py-1.5 rounded-full ${
                      order.payment
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >

                    {order.payment
                      ? "Paid"
                      : "Pending"}

                  </span>

                </div>


                <div className="h-px bg-gray-100"></div>


                <div className="flex items-end justify-between">

                  <span className="text-sm font-medium">
                    Total
                  </span>


                  <span className="text-xl font-semibold">

                    {orderAmount(
                      order
                    )}

                  </span>

                </div>

              </div>

            </section>


            {/* ========================================= */}
            {/* DELIVERY */}
            {/* ========================================= */}

            <section className="bg-white border border-gray-200/80 rounded-[24px] shadow-sm p-6">

              <div className="flex items-center gap-3 mb-6">

                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-600">

                  <LocationIcon />

                </div>


                <div>

                  <h2 className="font-semibold">
                    Delivery
                  </h2>

                  <p className="text-xs text-gray-400 mt-0.5">
                    Shipping address
                  </p>

                </div>

              </div>


              <div>

                <p className="font-medium text-gray-950">

                  {order.address
                    ?.firstName}{" "}

                  {order.address
                    ?.lastName}

                </p>


                <div className="text-sm text-gray-500 leading-6 mt-3">

                  {order.address
                    ?.street && (

                    <p>
                      {
                        order.address
                          .street
                      }
                    </p>

                  )}


                  <p>

                    {order.address
                      ?.city}

                    {order.address
                      ?.state &&
                      `, ${order.address.state}`}

                  </p>


                  {order.address
                    ?.zipcode && (

                    <p>
                      {
                        order.address
                          .zipcode
                      }
                    </p>

                  )}


                  {order.address
                    ?.country && (

                    <p>
                      {
                        order.address
                          .country
                      }
                    </p>

                  )}

                </div>


                {(order.address?.phone ||
                  order.address
                    ?.email) && (

                  <div className="border-t border-gray-100 mt-5 pt-5 space-y-2">

                    {order.address
                      ?.phone && (

                      <p className="text-sm text-gray-600">
                        {
                          order.address
                            .phone
                        }
                      </p>

                    )}


                    {order.address
                      ?.email && (

                      <p className="text-sm text-gray-600 break-all">
                        {
                          order.address
                            .email
                        }
                      </p>

                    )}

                  </div>

                )}

              </div>

            </section>


            {/* ========================================= */}
            {/* HELP */}
            {/* ========================================= */}

            <section className="bg-gray-100 rounded-[24px] p-6">

              <p className="font-medium text-gray-900">
                Need help?
              </p>


              <p className="text-sm text-gray-500 mt-2 leading-6">
                Have a question about this order? Contact our support team.
              </p>


              <button
                onClick={() =>
                  navigate(
                    "/contact"
                  )
                }
                className="mt-5 text-sm font-medium border-b border-black pb-0.5 cursor-pointer"
              >
                Contact support
              </button>

            </section>

          </aside>

        </div>


        {/* ========================================= */}
        {/* BOTTOM ACTION */}
        {/* ========================================= */}

        <div className="mt-8 pt-8 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          <p className="text-xs text-gray-400">
            Tracking information updates when your order status changes.
          </p>


          <button
            onClick={() =>
              navigate("/orders")
            }
            className="inline-flex items-center gap-2 text-sm font-medium hover:text-gray-500 transition cursor-pointer"
          >

            <ArrowLeftIcon />

            View all orders

          </button>

        </div>

      </div>

    </div>
  );
}

export default TrackOrder;