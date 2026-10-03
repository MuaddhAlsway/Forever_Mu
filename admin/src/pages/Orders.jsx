import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  toast,
} from "react-toastify";

import {
  formatPrice,
  orderAmount,
  orderCurrency,
  isLegacyCurrency,
} from "../utils/currency.js";


// =========================================
// ICONS
// =========================================

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


const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-5 h-5"
  >
    <circle
      cx="11"
      cy="11"
      r="7"
    />

    <path d="m20 20-3.5-3.5" />
  </svg>
);


const ChevronIcon = ({
  open = false,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className={`w-4 h-4 transition-transform ${
      open ? "rotate-180" : ""
    }`}
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);


const ArrowIcon = () => (
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


const CloseIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    className="w-5 h-5"
  >
    <path d="m6 6 12 12" />
    <path d="m18 6-12 12" />
  </svg>
);


// =========================================
// ORDER STATUS FLOW
// =========================================

const statusFlow = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];


// =========================================
// ORDERS
// =========================================

function Orders({ token }) {

  // =========================================
  // BACKEND
  // =========================================

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


  // =========================================
  // STATE
  // =========================================

  const [
    orders,
    setOrders,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    updatingId,
    setUpdatingId,
  ] = useState("");


  const [
    expandedOrderId,
    setExpandedOrderId,
  ] = useState(null);


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    statusFilter,
    setStatusFilter,
  ] = useState("All");


  // =========================================
  // FETCH ALL ORDERS
  // =========================================

  const fetchAllOrders =
    async () => {

      try {

        setLoading(true);

        const response =
          await axios.post(
            backendUrl +
              "/api/order/list",

            {},

            {
              headers: {
                token,
              },
            }
          );


        if (
          response.data.success
        ) {

          setOrders(
            response.data.orders ||
              []
          );

        } else {

          toast.error(
            response.data.message ||
              "Failed to load orders"
          );

        }

      } catch (error) {

        console.error(
          "Fetch orders error:",
          error
        );


        toast.error(
          error.response?.data
            ?.message ||
            error.message ||
            "Failed to load orders"
        );

      } finally {

        setLoading(false);

      }

    };


  // =========================================
  // UPDATE STATUS
  // =========================================

  const updateStatus =
    async (
      orderId,
      status
    ) => {

      try {

        setUpdatingId(
          orderId
        );


        const response =
          await axios.post(
            backendUrl +
              "/api/order/status",

            {
              orderId,
              status,
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

          setOrders(
            (previousOrders) =>
              previousOrders.map(
                (order) =>
                  order._id ===
                  orderId
                    ? response.data
                        .order ||
                      {
                        ...order,
                        status,
                      }
                    : order
              )
          );


          toast.success(
            `Order moved to ${status}`
          );

        } else {

          toast.error(
            response.data.message ||
              "Failed to update status"
          );

        }

      } catch (error) {

        console.error(
          "Update status error:",
          error
        );


        toast.error(
          error.response?.data
            ?.message ||
            error.message ||
            "Failed to update status"
        );

      } finally {

        setUpdatingId("");

      }

    };


  // =========================================
  // LOAD ORDERS
  // =========================================

  useEffect(() => {

    if (token) {
      fetchAllOrders();
    }

  }, [token]);


  // =========================================
  // TOGGLE ORDER
  // =========================================

  const toggleOrderDetails =
    (orderId) => {

      setExpandedOrderId(
        (currentId) =>
          currentId === orderId
            ? null
            : orderId
      );

    };


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

        return (
          image[0] || ""
        );

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
  // PAYMENT STATUS
  // =========================================
  // Deliberately separate from the fulfilment
  // `status` badge: a delivered COD order is
  // still legitimately unpaid, so fulfilment
  // state must never imply payment state.
  // Legacy orders predate paymentStatus and
  // fall back to the boolean `payment` field.

  const paymentStatusOf =
    (order) =>
      order.paymentStatus ||
      (order.payment
        ? "paid"
        : "pending");

  const paymentStatusLabel =
    (order) => {
      const status =
        paymentStatusOf(order);

      switch (status) {
        case "paid":
          return "Paid";

        case "pending":
          // COD is collected on delivery.
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
  // SHORT ORDER ID
  // =========================================

  const getShortOrderId =
    (orderId) => {

      if (!orderId) {
        return "N/A";
      }


      return orderId
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
          day: "2-digit",
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
  // STATUS STYLE
  // =========================================

  const getStatusStyle =
    (status) => {

      switch (status) {

        case "Delivered":
          return "bg-emerald-50 text-emerald-700 border-emerald-200";

        case "Out for Delivery":
          return "bg-blue-50 text-blue-700 border-blue-200";

        case "Shipped":
          return "bg-violet-50 text-violet-700 border-violet-200";

        case "Packing":
          return "bg-amber-50 text-amber-700 border-amber-200";

        case "Order Placed":
          return "bg-gray-100 text-gray-700 border-gray-200";

        default:
          return "bg-gray-100 text-gray-700 border-gray-200";

      }

    };


  // =========================================
  // STATUS DOT
  // =========================================

  const getStatusDot =
    (status) => {

      switch (status) {

        case "Delivered":
          return "bg-emerald-500";

        case "Out for Delivery":
          return "bg-blue-500";

        case "Shipped":
          return "bg-violet-500";

        case "Packing":
          return "bg-amber-500";

        default:
          return "bg-gray-500";

      }

    };


  // =========================================
  // NEXT STATUS
  // =========================================

  const getNextStatus =
    (status) => {

      const currentIndex =
        statusFlow.indexOf(
          status
        );


      if (
        currentIndex === -1 ||
        currentIndex ===
          statusFlow.length - 1
      ) {

        return null;

      }


      return statusFlow[
        currentIndex + 1
      ];

    };


  // =========================================
  // STATISTICS
  // =========================================

  const stats =
    useMemo(() => {

      const total =
        orders.length;


      const processing =
        orders.filter(
          (order) =>
            order.status ===
              "Order Placed" ||
            order.status ===
              "Packing"
        ).length;


      const shipped =
        orders.filter(
          (order) =>
            order.status ===
              "Shipped" ||
            order.status ===
              "Out for Delivery"
        ).length;


      const delivered =
        orders.filter(
          (order) =>
            order.status ===
            "Delivered"
        ).length;


      return {
        total,
        processing,
        shipped,
        delivered,
      };

    }, [orders]);


  // =========================================
  // FILTER ORDERS
  // =========================================

  const filteredOrders =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();


      return orders.filter(
        (order) => {

          const customerName =
            `${order.address?.firstName || ""} ${order.address?.lastName || ""}`
              .trim()
              .toLowerCase();


          const email =
            (
              order.address?.email ||
              ""
            ).toLowerCase();


          const orderId =
            (
              order._id || ""
            ).toLowerCase();


          const matchesSearch =
            !query ||
            customerName.includes(
              query
            ) ||
            email.includes(
              query
            ) ||
            orderId.includes(
              query
            );


          const matchesStatus =
            statusFilter ===
              "All" ||
            order.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );

        }
      );

    }, [
      orders,
      search,
      statusFilter,
    ]);


  // =========================================
  // LOADING
  // =========================================

  if (loading) {

    return (

      <div className="w-full min-h-[60vh]">

        <div className="mb-8">

          <div className="h-7 w-32 bg-gray-200 rounded-lg animate-pulse"></div>

          <div className="h-4 w-64 bg-gray-100 rounded-lg animate-pulse mt-3"></div>

        </div>


        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

          {[1, 2, 3, 4].map(
            (item) => (

              <div
                key={item}
                className="h-28 bg-gray-100 rounded-2xl animate-pulse"
              ></div>

            )
          )}

        </div>


        <div className="h-80 bg-gray-100 rounded-2xl animate-pulse"></div>

      </div>

    );

  }


  // =========================================
  // UI
  // =========================================

  return (

    <div className="w-full pb-10">

      {/* ========================================= */}
      {/* PAGE HEADER */}
      {/* ========================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">

        <div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400 mb-2">
            Store Management
          </p>


          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">
            Orders
          </h1>


          <p className="text-sm text-gray-500 mt-2">
            Manage orders, customers and delivery progress.
          </p>

        </div>


        <button
          onClick={
            fetchAllOrders
          }
          className="inline-flex items-center justify-center gap-2 self-start lg:self-auto bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:border-gray-300 hover:bg-gray-50 transition cursor-pointer"
        >

          <RefreshIcon />

          Refresh Orders

        </button>

      </div>


      {/* ========================================= */}
      {/* STATS */}
      {/* ========================================= */}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

        {/* TOTAL */}

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-gray-500">
              Total Orders
            </p>

            <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600">

              <PackageIcon />

            </div>

          </div>


          <p className="text-3xl font-semibold tracking-tight mt-5">
            {stats.total}
          </p>

        </div>


        {/* PROCESSING */}

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-gray-500">
              Processing
            </p>

            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>

          </div>


          <p className="text-3xl font-semibold tracking-tight mt-5">
            {stats.processing}
          </p>

        </div>


        {/* SHIPPED */}

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-gray-500">
              Shipping
            </p>

            <span className="w-2.5 h-2.5 bg-violet-500 rounded-full"></span>

          </div>


          <p className="text-3xl font-semibold tracking-tight mt-5">
            {stats.shipped}
          </p>

        </div>


        {/* DELIVERED */}

        <div className="bg-white border border-gray-200/80 rounded-2xl p-5 shadow-sm">

          <div className="flex items-center justify-between">

            <p className="text-sm text-gray-500">
              Delivered
            </p>

            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span>

          </div>


          <p className="text-3xl font-semibold tracking-tight mt-5">
            {stats.delivered}
          </p>

        </div>

      </div>


      {/* ========================================= */}
      {/* MAIN PANEL */}
      {/* ========================================= */}

      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">

        {/* ========================================= */}
        {/* TOOLBAR */}
        {/* ========================================= */}

        <div className="p-4 sm:p-5 border-b border-gray-100">

          <div className="flex flex-col md:flex-row gap-3">

            {/* SEARCH */}

            <div className="relative flex-1">

              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">

                <SearchIcon />

              </div>


              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search order, customer or email..."
                className="w-full h-11 pl-11 pr-4 border border-gray-200 rounded-xl text-sm outline-none focus:border-gray-400 transition"
              />

            </div>


            {/* FILTER */}

            <select
              value={
                statusFilter
              }
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="h-11 px-4 border border-gray-200 rounded-xl bg-white text-sm text-gray-700 outline-none cursor-pointer focus:border-gray-400"
            >

              <option value="All">
                All statuses
              </option>

              {statusFlow.map(
                (status) => (

                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>

                )
              )}

            </select>

          </div>


          <p className="text-xs text-gray-400 mt-3">

            Showing{" "}

            {filteredOrders.length}{" "}

            of{" "}

            {orders.length} orders

          </p>

        </div>


        {/* ========================================= */}
        {/* EMPTY */}
        {/* ========================================= */}

        {filteredOrders.length ===
        0 ? (

          <div className="py-20 px-5 text-center">

            <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 mb-5">

              <PackageIcon />

            </div>


            <h3 className="font-semibold text-gray-900">
              No orders found
            </h3>


            <p className="text-sm text-gray-500 mt-2">
              Try changing your search or status filter.
            </p>

          </div>

        ) : (

          <div>

            {/* ========================================= */}
            {/* DESKTOP HEADER */}
            {/* ========================================= */}

            <div className="hidden xl:grid grid-cols-[minmax(280px,2fr)_1.2fr_1fr_1fr_1.2fr_110px] gap-5 px-6 py-3 bg-gray-50/80 border-b border-gray-100">

              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Order
              </p>

              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Customer
              </p>

              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Date
              </p>

              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Total
              </p>

              <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                Status
              </p>

              <div></div>

            </div>


            {/* ========================================= */}
            {/* ORDERS */}
            {/* ========================================= */}

            {filteredOrders.map(
              (order) => {

                const isExpanded =
                  expandedOrderId ===
                  order._id;


                const firstItem =
                  order.items?.[0];


                const firstImage =
                  getProductImage(
                    firstItem?.image
                  );


                const itemCount =
                  getTotalItems(
                    order.items
                  );


                const nextStatus =
                  getNextStatus(
                    order.status
                  );


                const currentStatusIndex =
                  statusFlow.indexOf(
                    order.status
                  );


                return (

                  <div
                    key={order._id}
                    className="border-b border-gray-100 last:border-b-0"
                  >

                    {/* ========================================= */}
                    {/* ORDER ROW */}
                    {/* ========================================= */}

                    <div className="px-4 sm:px-6 py-5 hover:bg-gray-50/50 transition">

                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(280px,2fr)_1.2fr_1fr_1fr_1.2fr_110px] gap-5 xl:items-center">

                        {/* ========================================= */}
                        {/* ORDER */}
                        {/* ========================================= */}

                        <div className="flex items-center gap-4 min-w-0">

                          <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0 border border-gray-100">

                            {firstImage ? (

                              <img
                                src={
                                  firstImage
                                }
                                alt={
                                  firstItem?.name ||
                                  "Product"
                                }
                                className="w-full h-full object-cover"
                              />

                            ) : (

                              <div className="w-full h-full flex items-center justify-center text-gray-400">

                                <PackageIcon />

                              </div>

                            )}

                          </div>


                          <div className="min-w-0">

                            <p className="font-semibold text-gray-900">

                              #
                              {getShortOrderId(
                                order._id
                              )}

                            </p>


                            <p className="text-sm text-gray-500 mt-1 truncate">

                              {firstItem?.name ||
                                "Order"}

                            </p>


                            <p className="text-xs text-gray-400 mt-1">

                              {itemCount}{" "}

                              {itemCount === 1
                                ? "item"
                                : "items"}

                            </p>

                          </div>

                        </div>


                        {/* ========================================= */}
                        {/* CUSTOMER */}
                        {/* ========================================= */}

                        <div>

                          <p className="xl:hidden text-xs text-gray-400 mb-1">
                            Customer
                          </p>


                          <p className="text-sm font-medium text-gray-800">

                            {order.address
                              ?.firstName}{" "}

                            {order.address
                              ?.lastName}

                          </p>


                          <p className="text-xs text-gray-400 mt-1 truncate">

                            {order.address
                              ?.email ||
                              "No email"}

                          </p>

                        </div>


                        {/* ========================================= */}
                        {/* DATE */}
                        {/* ========================================= */}

                        <div>

                          <p className="xl:hidden text-xs text-gray-400 mb-1">
                            Date
                          </p>


                          <p className="text-sm text-gray-700">

                            {formatDate(
                              order.date
                            )}

                          </p>


                          <p className="text-xs text-gray-400 mt-1">

                            {formatTime(
                              order.date
                            )}

                          </p>

                        </div>


                        {/* ========================================= */}
                        {/* TOTAL */}
                        {/* ========================================= */}

                        <div>

                          <p className="xl:hidden text-xs text-gray-400 mb-1">
                            Total
                          </p>


                          <p className="font-semibold text-gray-900">

                            {orderAmount(
                              order
                            )}

                          </p>


                          {/*
                            Historical orders keep
                            their stored currency. Flag
                            non-USD orders so a legacy
                            SAR total is never mistaken
                            for a USD one.
                          */}
                          {isLegacyCurrency(
                            orderCurrency(
                              order
                            )
                          ) && (
                            <span className="inline-block mt-1 text-[10px] font-medium uppercase tracking-wide text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                              Historical ·{" "}
                              {
                                orderCurrency(
                                  order
                                )
                              }
                            </span>
                          )}


                          <p
                            className={`text-xs mt-1 ${
                              paymentStatusOf(
                                order
                              ) === "paid"
                                ? "text-emerald-600"
                                : paymentStatusOf(
                                    order
                                  ) ===
                                    "failed" ||
                                  paymentStatusOf(
                                    order
                                  ) ===
                                    "cancelled"
                                  ? "text-red-600"
                                  : "text-amber-600"
                            }`}
                          >

                            {paymentStatusLabel(
                              order
                            )}

                          </p>

                        </div>


                        {/* ========================================= */}
                        {/* STATUS */}
                        {/* ========================================= */}

                        <div>

                          <p className="xl:hidden text-xs text-gray-400 mb-2">
                            Status
                          </p>


                          <span
                            className={`inline-flex items-center gap-2 border px-3 py-1.5 rounded-full text-xs font-medium ${getStatusStyle(
                              order.status
                            )}`}
                          >

                            <span
                              className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                                order.status
                              )}`}
                            ></span>

                            {order.status ||
                              "Unknown"}

                          </span>

                        </div>


                        {/* ========================================= */}
                        {/* VIEW */}
                        {/* ========================================= */}

                        <div className="xl:text-right">

                          <button
                            onClick={() =>
                              toggleOrderDetails(
                                order._id
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                          >

                            {isExpanded
                              ? "Close"
                              : "View"}

                            <ChevronIcon
                              open={
                                isExpanded
                              }
                            />

                          </button>

                        </div>

                      </div>

                    </div>


                    {/* ========================================= */}
                    {/* EXPANDED ORDER */}
                    {/* ========================================= */}

                    {isExpanded && (

                      <div className="bg-gray-50/70 border-t border-gray-100">

                        <div className="p-4 sm:p-6 lg:p-8">

                          {/* ========================================= */}
                          {/* DETAILS HEADER */}
                          {/* ========================================= */}

                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

                            <div>

                              <div className="flex items-center gap-3">

                                <h3 className="text-xl font-semibold text-gray-950">

                                  Order #

                                  {getShortOrderId(
                                    order._id
                                  )}

                                </h3>


                                <span
                                  className={`inline-flex items-center gap-2 border px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                                    order.status
                                  )}`}
                                >

                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${getStatusDot(
                                      order.status
                                    )}`}
                                  ></span>

                                  {order.status}

                                </span>

                              </div>


                              <p className="text-sm text-gray-500 mt-2">

                                Placed{" "}

                                {formatDate(
                                  order.date
                                )}{" "}

                                at{" "}

                                {formatTime(
                                  order.date
                                )}

                              </p>

                            </div>


                            <button
                              onClick={() =>
                                setExpandedOrderId(
                                  null
                                )
                              }
                              className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:text-black hover:border-gray-300 transition cursor-pointer"
                            >

                              <CloseIcon />

                            </button>

                          </div>


                          {/* ========================================= */}
                          {/* PROGRESS */}
                          {/* ========================================= */}

                          <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 mb-6">

                            <div className="flex items-center justify-between mb-6">

                              <div>

                                <h4 className="font-semibold text-gray-900">
                                  Order Progress
                                </h4>

                                <p className="text-xs text-gray-500 mt-1">
                                  Current fulfillment stage
                                </p>

                              </div>

                            </div>


                            <div className="overflow-x-auto pb-2">

                              <div className="flex min-w-[650px]">

                                {statusFlow.map(
                                  (
                                    status,
                                    index
                                  ) => {

                                    const completed =
                                      index <=
                                      currentStatusIndex;


                                    const current =
                                      index ===
                                      currentStatusIndex;


                                    return (

                                      <div
                                        key={
                                          status
                                        }
                                        className="flex-1 relative"
                                      >

                                        {index !==
                                          0 && (

                                          <div
                                            className={`absolute top-[11px] right-1/2 w-full h-[2px] ${
                                              completed
                                                ? "bg-black"
                                                : "bg-gray-200"
                                            }`}
                                          ></div>

                                        )}


                                        <div className="relative z-10 flex flex-col items-center text-center">

                                          <div
                                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                              completed
                                                ? "bg-black border-black"
                                                : "bg-white border-gray-300"
                                            }`}
                                          >

                                            {completed && (

                                              <div className="w-2 h-2 bg-white rounded-full"></div>

                                            )}

                                          </div>


                                          <p
                                            className={`text-xs mt-3 ${
                                              current
                                                ? "font-semibold text-black"
                                                : completed
                                                ? "font-medium text-gray-700"
                                                : "text-gray-400"
                                            }`}
                                          >

                                            {status}

                                          </p>

                                        </div>

                                      </div>

                                    );

                                  }
                                )}

                              </div>

                            </div>

                          </div>


                          {/* ========================================= */}
                          {/* CONTENT GRID */}
                          {/* ========================================= */}

                          <div className="grid grid-cols-1 xl:grid-cols-[1.6fr_1fr] gap-6">

                            {/* ========================================= */}
                            {/* LEFT */}
                            {/* ========================================= */}

                            <div className="flex flex-col gap-6">

                              {/* ========================================= */}
                              {/* PRODUCTS */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 overflow-hidden">

                                <div className="px-5 sm:px-6 py-5 border-b border-gray-100">

                                  <div className="flex items-center justify-between">

                                    <h4 className="font-semibold text-gray-900">
                                      Order Items
                                    </h4>


                                    <span className="text-xs text-gray-400">

                                      {itemCount}{" "}

                                      {itemCount ===
                                      1
                                        ? "item"
                                        : "items"}

                                    </span>

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


                                      return (

                                        <div
                                          key={`${order._id}-${item._id}-${item.size}-${index}`}
                                          className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5"
                                        >

                                          {/* IMAGE */}

                                          <div className="w-20 h-24 rounded-xl bg-gray-100 overflow-hidden shrink-0">

                                            {image ? (

                                              <img
                                                src={
                                                  image
                                                }
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


                                          {/* INFO */}

                                          <div className="flex-1 min-w-0">

                                            <p className="font-semibold text-gray-900">
                                              {item.name}
                                            </p>


                                            <div className="flex flex-wrap gap-x-5 gap-y-2 mt-2 text-sm text-gray-500">

                                              <p>

                                                Size{" "}

                                                <span className="text-gray-800">
                                                  {item.size}
                                                </span>

                                              </p>


                                              <p>

                                                Qty{" "}

                                                <span className="text-gray-800">
                                                  {item.quantity}
                                                </span>

                                              </p>


                                              <p>

                                                Unit{" "}

                                                <span className="text-gray-800">

                                                  {formatPrice(
                                                    item.price ||
                                                      0,
                                                    orderCurrency(
                                                      order
                                                    )
                                                  )}

                                                </span>

                                              </p>

                                            </div>


                                            <p className="text-xs text-gray-400 mt-3 break-all">

                                              ID:{" "}

                                              {item._id}

                                            </p>

                                          </div>


                                          {/* TOTAL */}

                                          <div className="sm:text-right">

                                            <p className="text-xs text-gray-400">
                                              Total
                                            </p>


                                            <p className="font-semibold mt-1">

                                              {formatPrice(
                                                Number(
                                                  item.price ||
                                                    0
                                                ) *
                                                  Number(
                                                    item.quantity ||
                                                      0
                                                  ),
                                                orderCurrency(
                                                  order
                                                )
                                              )}

                                            </p>

                                          </div>

                                        </div>

                                      );

                                    }
                                  )}

                                </div>

                              </div>


                              {/* ========================================= */}
                              {/* TRACKING HISTORY */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6">

                                <h4 className="font-semibold text-gray-900">
                                  Tracking History
                                </h4>


                                <p className="text-xs text-gray-500 mt-1 mb-6">
                                  Actual status events stored for this order.
                                </p>


                                {order
                                  .trackingHistory
                                  ?.length >
                                0 ? (

                                  <div>

                                    {order.trackingHistory.map(
                                      (
                                        tracking,
                                        index
                                      ) => {

                                        const last =
                                          index ===
                                          order
                                            .trackingHistory
                                            .length -
                                            1;


                                        return (

                                          <div
                                            key={`${tracking.status}-${tracking.date}-${index}`}
                                            className="flex gap-4"
                                          >

                                            <div className="flex flex-col items-center">

                                              <div className="w-3 h-3 rounded-full bg-black mt-1.5"></div>


                                              {!last && (

                                                <div className="w-px flex-1 min-h-12 bg-gray-200"></div>

                                              )}

                                            </div>


                                            <div
                                              className={
                                                last
                                                  ? ""
                                                  : "pb-6"
                                              }
                                            >

                                              <div className="flex items-center gap-2">

                                                <p className="text-sm font-medium text-gray-900">

                                                  {
                                                    tracking.status
                                                  }

                                                </p>


                                                {last && (

                                                  <span className="text-[10px] uppercase tracking-wider bg-gray-100 rounded-full px-2 py-1 text-gray-500">
                                                    Current
                                                  </span>

                                                )}

                                              </div>


                                              <p className="text-xs text-gray-400 mt-1">

                                                {formatDate(
                                                  tracking.date
                                                )}{" "}

                                                •{" "}

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

                                  <p className="text-sm text-gray-400">
                                    No tracking history available.
                                  </p>

                                )}

                              </div>

                            </div>


                            {/* ========================================= */}
                            {/* RIGHT */}
                            {/* ========================================= */}

                            <div className="flex flex-col gap-6">

                              {/* ========================================= */}
                              {/* CUSTOMER */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6">

                                <h4 className="font-semibold text-gray-900 mb-5">
                                  Customer
                                </h4>


                                <div className="flex items-center gap-3 mb-5">

                                  <div className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center text-sm font-semibold">

                                    {order.address
                                      ?.firstName
                                      ?.charAt(
                                        0
                                      )
                                      ?.toUpperCase() ||
                                      "C"}

                                  </div>


                                  <div>

                                    <p className="font-medium text-gray-900">

                                      {order.address
                                        ?.firstName}{" "}

                                      {order.address
                                        ?.lastName}

                                    </p>


                                    <p className="text-xs text-gray-400">
                                      Customer
                                    </p>

                                  </div>

                                </div>


                                <div className="space-y-4 text-sm">

                                  <div>

                                    <p className="text-xs text-gray-400 mb-1">
                                      Email
                                    </p>

                                    <p className="break-all text-gray-700">

                                      {order.address
                                        ?.email ||
                                        "N/A"}

                                    </p>

                                  </div>


                                  <div>

                                    <p className="text-xs text-gray-400 mb-1">
                                      Phone
                                    </p>

                                    <p className="text-gray-700">

                                      {order.address
                                        ?.phone ||
                                        "N/A"}

                                    </p>

                                  </div>

                                </div>

                              </div>


                              {/* ========================================= */}
                              {/* DELIVERY */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6">

                                <h4 className="font-semibold text-gray-900 mb-5">
                                  Delivery Address
                                </h4>


                                <div className="text-sm text-gray-600 leading-7">

                                  {order.address
                                    ?.street && (

                                    <p>
                                      {
                                        order
                                          .address
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
                                        order
                                          .address
                                          .zipcode
                                      }
                                    </p>

                                  )}


                                  <p>
                                    {
                                      order
                                        .address
                                        ?.country
                                    }
                                  </p>

                                </div>

                              </div>


                              {/* ========================================= */}
                              {/* PAYMENT */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6">

                                <h4 className="font-semibold text-gray-900 mb-5">
                                  Payment
                                </h4>


                                <div className="space-y-4 text-sm">

                                  <div className="flex justify-between gap-4">

                                    <span className="text-gray-500">
                                      Method
                                    </span>

                                    <span className="text-right font-medium">

                                      {getPaymentMethod(
                                        order.paymentMethod
                                      )}

                                    </span>

                                  </div>


                                  <div className="flex justify-between gap-4">

                                    <span className="text-gray-500">
                                      Status
                                    </span>

                                    <span
                                      className={
                                        order.payment
                                          ? "text-emerald-600 font-medium"
                                          : "text-amber-600 font-medium"
                                      }
                                    >

                                      {order.payment
                                        ? "Paid"
                                        : "Pending"}

                                    </span>

                                  </div>


                                  <div className="border-t border-gray-100 pt-4 flex justify-between gap-4">

                                    <span className="font-medium">
                                      Total
                                    </span>

                                    <span className="text-lg font-semibold">

                                      {orderAmount(
                                        order
                                      )}

                                    </span>

                                  </div>

                                </div>

                              </div>


                              {/* ========================================= */}
                              {/* ORDER DETAILS */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6">

                                <h4 className="font-semibold text-gray-900 mb-5">
                                  Order Details
                                </h4>


                                <div className="space-y-4 text-sm">

                                  <div>

                                    <p className="text-xs text-gray-400 mb-1">
                                      Order ID
                                    </p>

                                    <p className="text-gray-700 break-all">
                                      {order._id}
                                    </p>

                                  </div>


                                  <div className="flex justify-between gap-4">

                                    <span className="text-gray-500">
                                      Items
                                    </span>

                                    <span className="font-medium">
                                      {itemCount}
                                    </span>

                                  </div>


                                  <div className="flex justify-between gap-4">

                                    <span className="text-gray-500">
                                      Created
                                    </span>

                                    <span className="text-right">

                                      {formatDate(
                                        order.date
                                      )}

                                    </span>

                                  </div>

                                </div>

                              </div>


                              {/* ========================================= */}
                              {/* NEXT STATUS */}
                              {/* ========================================= */}

                              <div className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6">

                                <h4 className="font-semibold text-gray-900">
                                  Fulfillment
                                </h4>


                                <p className="text-xs text-gray-500 mt-1 mb-5">
                                  Advance this order through its delivery lifecycle.
                                </p>


                                <div className="bg-gray-50 rounded-xl p-4 mb-4">

                                  <p className="text-xs text-gray-400">
                                    Current Status
                                  </p>


                                  <div className="flex items-center gap-2 mt-2">

                                    <span
                                      className={`w-2 h-2 rounded-full ${getStatusDot(
                                        order.status
                                      )}`}
                                    ></span>


                                    <p className="text-sm font-medium">
                                      {order.status}
                                    </p>

                                  </div>

                                </div>


                                {nextStatus ? (

                                  <button
                                    onClick={() =>
                                      updateStatus(
                                        order._id,
                                        nextStatus
                                      )
                                    }
                                    disabled={
                                      updatingId ===
                                      order._id
                                    }
                                    className="w-full h-12 rounded-xl bg-black text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                  >

                                    {updatingId ===
                                    order._id ? (

                                      "Updating..."

                                    ) : (

                                      <>

                                        Move to{" "}

                                        {
                                          nextStatus
                                        }

                                        <ArrowIcon />

                                      </>

                                    )}

                                  </button>

                                ) : (

                                  <div className="w-full rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3.5 text-center">

                                    <p className="text-sm font-medium text-emerald-700">
                                      Order Delivered
                                    </p>

                                    <p className="text-xs text-emerald-600 mt-1">
                                      Fulfillment complete
                                    </p>

                                  </div>

                                )}

                              </div>

                            </div>

                          </div>

                        </div>

                      </div>

                    )}

                  </div>

                );

              }
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default Orders;