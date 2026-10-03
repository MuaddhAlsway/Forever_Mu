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
  // =========================================================
  // STORE CONFIG
  // =========================================================
  // Display only.
  // Backend remains authoritative for real order totals.

  const [storeConfig, setStoreConfig] = useState({
    currency: "USD",
    deliveryFee: 10,
  });

  const currency = storeConfig.currency;
  const delivery_fee = storeConfig.deliveryFee;

  // =========================================================
  // MONEY
  // =========================================================

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

  // =========================================================
  // BACKEND URL
  // =========================================================
  //
  // IMPORTANT:
  // Normalizes backend URL to prevent double slashes.
  //
  // Example problems fixed:
  // - "https://example.com/" + "/api" → "https://example.com//api"
  // - "https://example.com  " → "https://example.com  /api"
  // - "https://example.com//" → "https://example.com//api"
  //
  // This ensures:
  // https://forever-mu-lz6g.vercel.app/api/product/list
  // NOT:
  // https://forever-mu-lz6g.vercel.app//api/product/list
  //

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

  const navigate = useNavigate();

  // =========================================================
  // STATE
  // =========================================================

  const [products, setProducts] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [orders, setOrders] = useState([]);

  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  // =========================================================
  // ERROR MESSAGE HELPER
  // =========================================================

  const getApiErrorMessage = (
    error,
    fallback = "Something went wrong"
  ) => {
    if (error?.response?.data?.message) {
      return error.response.data.message;
    }

    if (error?.response?.status) {
      return `Server error (${error.response.status})`;
    }

    if (
      error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error"
    ) {
      return "Cannot connect to the server. Please try again.";
    }

    return error?.message || fallback;
  };

  // =========================================================
  // GET STORE CONFIG
  // =========================================================

  const getStoreConfig = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/config/store`
      );

      if (
        response.data.success &&
        response.data.currency
      ) {
        setStoreConfig({
          currency: response.data.currency,

          deliveryFee: Number(
            response.data.deliveryFee
          ),
        });
      }
    } catch (error) {
      console.error("Store config error:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
    }
  };

  // =========================================================
  // GET PRODUCTS
  // =========================================================

  const getProductsData = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/product/list`
      );

      if (response.data.success) {
        setProducts(
          response.data.products || []
        );
      } else {
        toast.error(
          response.data.message ||
            "Failed to load products"
        );
      }
    } catch (error) {
      console.error("Product loading error:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to load products"
        )
      );
    }
  };

  // =========================================================
  // GET USER CART
  // =========================================================

  const getUserCart = async (userToken) => {
    if (!userToken) {
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/get`,
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
      console.error("Get cart error:", {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to load cart"
        )
      );
    }
  };

  // =========================================================
  // ADD TO CART
  // =========================================================

  const addToCart = async (itemId, size) => {
    if (!size) {
      toast.error("Select Product Size");
      return;
    }

    if (!token) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/add`,
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
        setCartItems(
          response.data.cartData || {}
        );

        toast.success("Added to cart");
      } else {
        toast.error(
          response.data.message ||
            "Failed to add to cart"
        );
      }
    } catch (error) {
      console.error("Add cart error:", error);

      toast.error(
        getApiErrorMessage(
          error,
          "Failed to add to cart"
        )
      );
    }
  };

  // =========================================================
  // CART COUNT
  // =========================================================

  const getCartCount = () => {
    let totalCount = 0;

    for (const itemId in cartItems) {
      for (const size in cartItems[itemId]) {
        const quantity =
          cartItems[itemId][size];

        if (quantity > 0) {
          totalCount += quantity;
        }
      }
    }

    return totalCount;
  };

  // =========================================================
  // UPDATE CART QUANTITY
  // =========================================================

  const updateQuantity = async (
    itemId,
    size,
    quantity
  ) => {
    if (!token) {
      toast.error("Please login first");
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/cart/update`,
        {
          itemId,
          size,
          quantity: Number(quantity),
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
        getApiErrorMessage(
          error,
          "Failed to update cart"
        )
      );
    }
  };

  // =========================================================
  // CART AMOUNT
  // =========================================================

  const getCartAmount = () => {
    let totalAmount = 0;

    for (const itemId in cartItems) {
      const itemInfo = products.find(
        (product) =>
          product._id === itemId
      );

      if (!itemInfo) {
        continue;
      }

      for (const size in cartItems[itemId]) {
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

  // =========================================================
  // CART -> ORDER ITEMS
  // =========================================================
  //
  // Browser only sends:
  //
  // product ID
  // size
  // quantity
  //
  // Backend rebuilds price/name/etc from MongoDB.
  //

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

  // =========================================================
  // CREATE COD ORDER
  // =========================================================

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
      toast.error("Your cart is empty.");
      return false;
    }

    try {
      const orderItems =
        buildCartOrderItems();

      if (orderItems.length === 0) {
        toast.error(
          "No valid products found in cart"
        );

        return false;
      }

      const response = await axios.post(
        `${backendUrl}/api/order/place`,
        {
          items: orderItems,
          address: deliveryInformation,
          paymentMethod,
        },
        {
          headers: {
            token,
          },
        }
      );

      if (response.data.success) {
        // Backend clears MongoDB cart.
        setCartItems({});

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
        getApiErrorMessage(
          error,
          "Failed to place order"
        )
      );

      return false;
    }
  };

  // =========================================================
  // STRIPE CHECKOUT
  // =========================================================

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
      const response = await axios.post(
        `${backendUrl}/api/payment/stripe/checkout`,
        {
          items: orderItems,
          address: deliveryInformation,
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
        getApiErrorMessage(
          error,
          "Could not start checkout"
        )
      );

      return null;
    }
  };

  // =========================================================
  // STRIPE SESSION STATUS
  // =========================================================

  const getStripeSessionStatus = async (
    orderId,
    sessionId
  ) => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get(
        `${backendUrl}/api/payment/stripe/session`,
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

  // =========================================================
  // CANCEL STRIPE CHECKOUT
  // =========================================================

  const cancelStripeCheckout = async (
    orderId
  ) => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/payment/stripe/cancel`,
        {
          orderId,
        },
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

  // =========================================================
  // ONLINE PAYMENT PROVIDERS
  // =========================================================

  const [onlineProviders, setOnlineProviders] =
    useState({
      stripe: false,
    });

  const getOnlineProviders = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/payment/methods`
      );

      if (response.data?.online) {
        setOnlineProviders(
          response.data.online
        );
      }
    } catch (error) {
      console.error(
        "Payment methods error:",
        {
          message: error.message,
          code: error.code,
          status:
            error.response?.status,
          data:
            error.response?.data,
          url:
            error.config?.url,
        }
      );

      // Security:
      // Keep online payment methods disabled
      // when backend cannot confirm them.

      setOnlineProviders({
        stripe: false,
      });
    }
  };

  // =========================================================
  // PROFILE AUTH ERROR
  // =========================================================

  const handleAuthFailure = (error) => {
    const status =
      error?.response?.status;

    if (status === 401) {
      setToken("");
    }

    return getApiErrorMessage(
      error,
      "Something went wrong"
    );
  };

  // =========================================================
  // GET PROFILE
  // =========================================================

  const getProfile = async () => {
    if (!token) {
      return null;
    }

    try {
      const response = await axios.get(
        `${backendUrl}/api/user/profile`,
        {
          headers: {
            token,
          },
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

  // =========================================================
  // UPDATE PROFILE
  // =========================================================

  const updateProfile = async (
    updates
  ) => {
    if (!token) {
      return {
        success: false,
        message:
          "Please login again",
      };
    }

    try {
      const response = await axios.put(
        `${backendUrl}/api/user/profile`,
        updates,
        {
          headers: {
            token,
          },
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
        message:
          handleAuthFailure(error),
      };
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const changePassword = async (
    payload
  ) => {
    if (!token) {
      return {
        success: false,
        message:
          "Please login again",
      };
    }

    try {
      const response = await axios.put(
        `${backendUrl}/api/user/change-password`,
        payload,
        {
          headers: {
            token,
          },
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
        message:
          handleAuthFailure(error),
      };
    }
  };

  // =========================================================
  // GET SAVED ADDRESSES
  // =========================================================

  const getAddresses = async () => {
    if (!token) {
      return [];
    }

    try {
      const response = await axios.get(
        `${backendUrl}/api/user/addresses`,
        {
          headers: {
            token,
          },
        }
      );

      return (
        response.data.addresses || []
      );
    } catch (error) {
      console.error(
        "Get addresses error:",
        error
      );

      handleAuthFailure(error);

      return [];
    }
  };

  // =========================================================
  // ADD ADDRESS
  // =========================================================

  const addAddress = async (
    address
  ) => {
    if (!token) {
      return {
        success: false,
        message:
          "Please login again",
      };
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/addresses`,
        address,
        {
          headers: {
            token,
          },
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
        message:
          handleAuthFailure(error),
      };
    }
  };

  // =========================================================
  // UPDATE ADDRESS
  // =========================================================

  const updateAddress = async (
    addressId,
    address
  ) => {
    if (!token) {
      return {
        success: false,
        message:
          "Please login again",
      };
    }

    try {
      const response = await axios.put(
        `${backendUrl}/api/user/addresses/${addressId}`,
        address,
        {
          headers: {
            token,
          },
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
        message:
          handleAuthFailure(error),
      };
    }
  };

  // =========================================================
  // DELETE ADDRESS
  // =========================================================

  const deleteAddress = async (
    addressId
  ) => {
    if (!token) {
      return {
        success: false,
        message:
          "Please login again",
      };
    }

    try {
      const response =
        await axios.delete(
          `${backendUrl}/api/user/addresses/${addressId}`,
          {
            headers: {
              token,
            },
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
        message:
          handleAuthFailure(error),
      };
    }
  };

  // =========================================================
  // LOGOUT
  // =========================================================

  const logout = () => {
    localStorage.removeItem("token");

    setToken("");
    setCartItems({});
    setOrders([]);

    toast.success(
      "Logged out successfully"
    );

    navigate("/login");
  };

  // =========================================================
  // GET USER ORDERS
  // =========================================================

  const getUserOrders = async (
    userToken = token
  ) => {
    if (!userToken) {
      setOrders([]);
      return;
    }

    try {
      const response = await axios.post(
        `${backendUrl}/api/order/userorders`,
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
        getApiErrorMessage(
          error,
          "Failed to load orders"
        )
      );
    }
  };

  // =========================================================
  // INITIAL PUBLIC DATA
  // =========================================================

  useEffect(() => {
    console.log(
      "API:",
      backendUrl
    );

    getStoreConfig();
    getProductsData();
    getOnlineProviders();
  }, []);

  // =========================================================
  // LOGIN / LOGOUT DATA
  // =========================================================

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

  // =========================================================
  // CONTEXT VALUE
  // =========================================================

  const value = {
    // PRODUCTS
    products,

    // STORE
    currency,
    delivery_fee,

    // MONEY
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