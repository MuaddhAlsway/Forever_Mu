import {
  createContext,
  useCallback,
  useEffect,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

import {
  formatPrice as formatPriceFor,
  orderAmount as orderAmountFor,
} from "../utils/currency.js";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {

  // =================================
  // STORE CONFIG (SERVER OWNED)
  // =================================
  // Display only. The backend
  // recalculates every real order.

  const [storeConfig, setStoreConfig] =
    useState({
      currency: "USD",
      deliveryFee: 10,
    });

  const currency = storeConfig.currency;

  const delivery_fee = storeConfig.deliveryFee;

  // Centralized money formatting. Components
  // must use these instead of hand-rolling
  // `{currency} {amount.toFixed(2)}` so the
  // symbol/precision rules live in exactly one
  // place. See src/utils/currency.js.
  const formatPrice = useCallback(
    (amount, code = currency, options) =>
      formatPriceFor(amount, code, options),
    [currency]
  );

  const orderAmount = useCallback(
    (order, field = "amount") =>
      orderAmountFor(order, field),
    []
  );

  const backendUrl =
    import.meta.env.VITE_BACKEND_URL;

  const navigate = useNavigate();

  // =========================
  // STATE
  // =========================

  const [products, setProducts] =
    useState([]);

  const [cartItems, setCartItems] =
    useState({});

  const [orders, setOrders] =
    useState([]);

  const [token, setToken] =
    useState(
      localStorage.getItem("token") || ""
    );

  // =========================
  // GET STORE CONFIG
  // =========================

  const getStoreConfig = async () => {
    try {

      const response = await axios.get(
        backendUrl + "/api/config/store"
      );

      if (
        response.data.success &&
        response.data.currency
      ) {

        setStoreConfig({
          currency: response.data.currency,
          deliveryFee:
            Number(
              response.data.deliveryFee
            ),
        });

      }

    } catch (error) {

      console.error(
        "Store config error:",
        error
      );
    }
  };

  // =========================
  // GET PRODUCTS
  // =========================

  const getProductsData = async () => {
    try {

      const response = await axios.get(
        backendUrl + "/api/product/list"
      );

      if (response.data.success) {

        setProducts(
          response.data.products
        );

      } else {

        toast.error(
          response.data.message ||
            "Failed to load products"
        );

      }

    } catch (error) {

      console.error(
        "Product loading error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load products"
      );
    }
  };

  // =========================
  // GET USER CART
  // =========================

  const getUserCart = async (
    userToken
  ) => {
    try {

      const response =
        await axios.post(
          backendUrl +
            "/api/cart/get",

          {},

          {
            headers: {
              token: userToken,
            },
          }
        );

      if (response.data.success) {

        setCartItems(
          response.data.cartData || {}
        );

      } else {

        toast.error(
          response.data.message ||
            "Failed to load cart"
        );

      }

    } catch (error) {

      console.error(
        "Get cart error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load cart"
      );
    }
  };

  // =========================
  // ADD TO CART
  // =========================

  const addToCart = async (
    itemId,
    size
  ) => {

    if (!size) {

      toast.error(
        "Select Product Size"
      );

      return;
    }

    if (!token) {

      toast.error(
        "Please login first"
      );

      navigate("/login");

      return;
    }

    try {

      const response =
        await axios.post(
          backendUrl +
            "/api/cart/add",

          {
            itemId,
            size,
          },

          {
            headers: {
              token,
            },
          }
        );

      if (response.data.success) {

        // Use cart returned from MongoDB
        setCartItems(
          response.data.cartData || {}
        );

        toast.success(
          "Added to cart"
        );

      } else {

        toast.error(
          response.data.message ||
            "Failed to add to cart"
        );

      }

    } catch (error) {

      console.error(
        "Add cart error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to add to cart"
      );
    }
  };

  // =========================
  // CART COUNT
  // =========================

  const getCartCount = () => {

    let totalCount = 0;

    for (
      const itemId in cartItems
    ) {

      for (
        const size in cartItems[itemId]
      ) {

        const quantity =
          cartItems[itemId][size];

        if (quantity > 0) {
          totalCount += quantity;
        }
      }
    }

    return totalCount;
  };

  // =========================
  // UPDATE QUANTITY
  // =========================

  const updateQuantity = async (
    itemId,
    size,
    quantity
  ) => {

    if (!token) {

      toast.error(
        "Please login first"
      );

      return;
    }

    try {

      const response =
        await axios.post(
          backendUrl +
            "/api/cart/update",

          {
            itemId,
            size,
            quantity:
              Number(quantity),
          },

          {
            headers: {
              token,
            },
          }
        );

      if (response.data.success) {

        setCartItems(
          response.data.cartData || {}
        );

      } else {

        toast.error(
          response.data.message ||
            "Failed to update cart"
        );

      }

    } catch (error) {

      console.error(
        "Update cart error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to update cart"
      );
    }
  };

  // =========================
  // CART AMOUNT
  // =========================

  const getCartAmount = () => {

    let totalAmount = 0;

    for (
      const itemId in cartItems
    ) {

      const itemInfo =
        products.find(
          (product) =>
            product._id === itemId
        );

      if (!itemInfo) {
        continue;
      }

      for (
        const size in cartItems[itemId]
      ) {

        const quantity =
          cartItems[itemId][size];

        if (quantity > 0) {

          totalAmount +=
            Number(itemInfo.price) *
            quantity;

        }
      }
    }

    return totalAmount;
  };

  // =========================
  // CART -> ORDER ITEMS
  // =========================
  // Only identifiers, sizes and quantities
  // ever leave the browser. Name, image and
  // price are always rebuilt from MongoDB by
  // the backend.

  const buildCartOrderItems = () => {
    const orderItems = [];

    for (const itemId in cartItems) {
      if (!itemId) {
        continue;
      }

      for (const size in cartItems[itemId]) {
        const quantity =
          cartItems[itemId][size];

        if (quantity > 0) {
          orderItems.push({
            _id: itemId,
            size,
            quantity: Number(quantity),
          });
        }
      }
    }

    return orderItems;
  };

  // =========================
  // CREATE ORDER
  // =========================

  const createOrder = async (
    deliveryInformation,
    paymentMethod
  ) => {

    if (!token) {

      toast.error(
        "Please login to place an order"
      );

      navigate("/login");

      return false;
    }

    if (getCartCount() === 0) {

      toast.error(
        "Your cart is empty."
      );

      return false;
    }

    try {

      const orderItems =
        buildCartOrderItems();

      if (
        orderItems.length === 0
      ) {

        toast.error(
          "No valid products found in cart"
        );

        return false;
      }

      // =========================
      // SEND ORDER TO BACKEND
      // =========================
      // No amount, no item prices.
      // The backend is the authority
      // and recalculates everything.

      const response =
        await axios.post(
          backendUrl +
            "/api/order/place",

          {
            items: orderItems,
            address:
              deliveryInformation,
            paymentMethod,
          },

          {
            headers: {
              token,
            },
          }
        );

      if (response.data.success) {

        // Backend already cleared
        // MongoDB cartData
        setCartItems({});

        // Add immediately to UI
        if (response.data.order) {

          setOrders(
            (previousOrders) => [
              response.data.order,
              ...previousOrders,
            ]
          );

        }

        toast.success(
          response.data.message ||
            "Order placed successfully"
        );

        return true;
      }

      toast.error(
        response.data.message ||
          "Failed to place order"
      );

      return false;

    } catch (error) {

      console.error(
        "Create order error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to place order"
      );

      return false;
    }
  };

  // =========================
  // STRIPE CHECKOUT
  // =========================
  // Creates a PENDING order plus a Stripe
  // Checkout Session and returns the hosted
  // redirect URL.
  //
  // The cart is NOT cleared here: the backend
  // only clears it once a verified payment
  // arrives, so an abandoned checkout keeps the
  // basket.

  const startStripeCheckout = async (
    deliveryInformation
  ) => {
    if (!token) {

      toast.error(
        "Please login to place an order"
      );

      navigate("/login");

      return null;
    }

    const orderItems =
      buildCartOrderItems();

    if (orderItems.length === 0) {

      toast.error(
        getCartCount() === 0
          ? "Your cart is empty."
          : "No valid products found in cart"
      );

      return null;
    }

    try {
      const response =
        await axios.post(
          backendUrl +
            "/api/payment/stripe/checkout",

          {
            items: orderItems,
            address:
              deliveryInformation,
          },

          {
            headers: {
              token,
            },
          }
        );

      if (
        response.data.success &&
        response.data.redirectUrl
      ) {
        return response.data;
      }

      toast.error(
        response.data.message ||
          "Could not start checkout"
      );

      return null;
    } catch (error) {

      console.error(
        "Stripe checkout error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Could not start checkout"
      );

      return null;
    }
  };

  // =========================
  // STRIPE SESSION STATUS
  // =========================
  // Polled by the success page. The backend
  // reads Stripe and decides the real payment
  // state; the browser never does.

  const getStripeSessionStatus =
    async (orderId, sessionId) => {
      if (!token) {
        return null;
      }

      try {
        const response =
          await axios.get(
            backendUrl +
              "/api/payment/stripe/session",

            {
              params: {
                orderId,
                sessionId,
              },
              headers: {
                token,
              },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Stripe status error:",
          error
        );

        return null;
      }
    };

  // =========================
  // CANCEL STRIPE CHECKOUT
  // =========================

  const cancelStripeCheckout =
    async (orderId) => {
      if (!token) {
        return null;
      }

      try {
        const response =
          await axios.post(
            backendUrl +
              "/api/payment/stripe/cancel",

            { orderId },

            {
              headers: {
                token,
              },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Stripe cancel error:",
          error
        );

        return null;
      }
    };

  // ONLINE PROVIDERS READY
  // =========================
  // Server configuration, not a client guess.
  // A method is only offered when the backend
  // actually has the credentials to settle it.

  const [onlineProviders, setOnlineProviders] =
    useState({
      stripe: false,
    });

  const getOnlineProviders =
    async () => {
      try {
        const response =
          await axios.get(
            backendUrl +
              "/api/payment/methods"
          );

        if (response.data?.online) {
          setOnlineProviders(
            response.data.online
          );
        }
      } catch (error) {
        // Leave everything unavailable
        // rather than offering a payment
        // the backend cannot process.
      }
    };

  useEffect(() => {
    getOnlineProviders();
  }, []);

  // =========================================
  // PROFILE + SAVED ADDRESSES
  // =========================================
  // Every call sends the customer JWT in the
  // `token` header, exactly like the rest of the
  // app. The backend resolves the account from
  // that token alone, so no user id is ever sent
  // from here.

  // Treats a rejected/expired JWT as a real
  // logout rather than a transient error, so a
  // stale token cannot strand the customer.
  const handleAuthFailure =
    (error) => {
      const status =
        error?.response?.status;

      if (status === 401) {
        setToken("");
      }

      return (
        error?.response?.data
          ?.message ||
        error?.message ||
        "Something went wrong"
      );
    };

  const getProfile = async () => {
    if (!token) {
      return null;
    }

    try {
      const response =
        await axios.get(
          backendUrl +
            "/api/user/profile",

          {
            headers: { token },
          }
        );

      return response.data;
    } catch (error) {

      console.error(
        "Get profile error:",
        error
      );

      handleAuthFailure(error);

      return null;
    }
  };

  const updateProfile =
    async (updates) => {
      if (!token) {
        return {
          success: false,
          message: "Please login again",
        };
      }

      try {
        const response =
          await axios.put(
            backendUrl +
              "/api/user/profile",

            updates,

            {
              headers: { token },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Update profile error:",
          error
        );

        return {
          success: false,
          message: handleAuthFailure(error),
        };
      }
    };

  const changePassword =
    async (payload) => {
      if (!token) {
        return {
          success: false,
          message: "Please login again",
        };
      }

      try {
        const response =
          await axios.put(
            backendUrl +
              "/api/user/change-password",

            payload,

            {
              headers: { token },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Change password error:",
          error
        );

        return {
          success: false,
          message: handleAuthFailure(error),
        };
      }
    };

  const getAddresses = async () => {
    if (!token) {
      return [];
    }

    try {
      const response =
        await axios.get(
          backendUrl +
            "/api/user/addresses",

          {
            headers: { token },
          }
        );

      return response.data.addresses || [];
    } catch (error) {

      console.error(
        "Get addresses error:",
        error
      );

      handleAuthFailure(error);

      return [];
    }
  };

  const addAddress =
    async (address) => {
      try {
        const response =
          await axios.post(
            backendUrl +
              "/api/user/addresses",

            address,

            {
              headers: { token },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Add address error:",
          error
        );

        return {
          success: false,
          message: handleAuthFailure(error),
        };
      }
    };

  const updateAddress =
    async (addressId, address) => {
      try {
        const response =
          await axios.put(
            backendUrl +
              `/api/user/addresses/${addressId}`,

            address,

            {
              headers: { token },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Update address error:",
          error
        );

        return {
          success: false,
          message: handleAuthFailure(error),
        };
      }
    };

  const deleteAddress =
    async (addressId) => {
      try {
        const response =
          await axios.delete(
            backendUrl +
              `/api/user/addresses/${addressId}`,

            {
              headers: { token },
            }
          );

        return response.data;
      } catch (error) {

        console.error(
          "Delete address error:",
          error
        );

        return {
          success: false,
          message: handleAuthFailure(error),
        };
      }
    };

  // =========================
  // LOGOUT
  // =========================
  // Customer-scoped. Only the storefront's own
  // `token` key is cleared; the admin app runs on
  // a separate origin with its own storage, so an
  // admin session is untouched.

  const logout = () => {
    localStorage.removeItem("token");

    setToken("");

    setCartItems({});

    setOrders([]);

    toast.success("Logged out successfully");

    navigate("/login");
  };

  // =========================
  // GET USER ORDERS
  // =========================

  const getUserOrders = async (
    userToken = token
  ) => {

    if (!userToken) {
      setOrders([]);
      return;
    }

    try {

      const response =
        await axios.post(
          backendUrl +
            "/api/order/userorders",

          {},

          {
            headers: {
              token: userToken,
            },
          }
        );

      if (response.data.success) {

        setOrders(
          response.data.orders || []
        );

      } else {

        toast.error(
          response.data.message ||
            "Failed to load orders"
        );

      }

    } catch (error) {

      console.error(
        "Get orders error:",
        error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load orders"
      );
    }
  };

  // =========================
  // LOAD PRODUCTS
  // =========================

  useEffect(() => {

    getStoreConfig();

    getProductsData();

  }, []);

  // =========================
  // LOGIN / LOGOUT DATA
  // =========================

  useEffect(() => {

    if (token) {

      localStorage.setItem(
        "token",
        token
      );

      getUserCart(token);

      getUserOrders(token);

    } else {

      localStorage.removeItem(
        "token"
      );

      setCartItems({});

      setOrders([]);

    }

  }, [token]);

  // =========================
  // CONTEXT VALUE
  // =========================

  const value = {

    // PRODUCTS
    products,

    // STORE
    currency,
    delivery_fee,

    // MONEY FORMATTING (display only)
    formatPrice,
    orderAmount,

    // BACKEND
    backendUrl,

    // AUTH
    token,
    setToken,
    logout,

    // PROFILE
    getProfile,
    updateProfile,
    changePassword,

    // ADDRESSES
    getAddresses,
    addAddress,
    updateAddress,
    deleteAddress,

    // CART
    cartItems,
    setCartItems,

    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    getUserCart,

    // ORDERS
    orders,
    setOrders,
    createOrder,
    getUserOrders,

    // PAYMENTS
    onlineProviders,
    getOnlineProviders,
    startStripeCheckout,
    getStripeSessionStatus,
    cancelStripeCheckout,

    // ROUTER
    navigate,
  };

  return (

    <ShopContext.Provider
      value={value}
    >

      {props.children}

    </ShopContext.Provider>

  );
};

export default ShopContextProvider;
