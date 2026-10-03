import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

import {
  PAYMENT_METHODS,
  PAYMENT_STATUS,
} from "../config/storeConfig.js";

import {
  buildTrustedItems,
  computeTotals,
  validateAddress,
  OrderValidationError,
} from "../services/orderTotalsService.js";

import {
  toOrderDisplay,
  toOrderDisplayList,
} from "../services/orderDisplayService.js";

// =========================================
// ORDER STATUS FLOW
// =========================================

const allowedStatuses = [
  "Order Placed",
  "Packing",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

// =========================================
// PLACE ORDER
// =========================================
// TRUST MODEL
// =========================================
// The CLIENT may send only:
//   item._id, item.size, item.quantity,
//   address, paymentMethod
//
// NEVER TRUSTED from the client:
//   item.price, item.name, item.image,
//   amount, delivery fee, userId,
//   payment status
//
// All maths lives in orderTotalsService so
// every payment method always agrees.
// =========================================
// COD ONLY.
//
// Stripe orders are created by
// paymentController through their own
// endpoints so a pending online order can be
// created together with its gateway session.
// This endpoint rejects any non-COD method.
// =========================================

const placeOrder = async (req, res) => {
  try {
    // =========================
    // AUTHENTICATED USER
    // =========================
    // userId comes from the verified
    // JWT, never from the body.

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authorized",
      });
    }

    const user =
      await userModel
        .findById(userId)
        .select("_id");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "Authenticated user no longer exists",
      });
    }

    // =========================
    // CLIENT INPUT
    // =========================
    // NOTE: `amount` from the request
    // body is intentionally ignored.

    const {
      items,
      address,
      paymentMethod = "cod",
    } = req.body;

    // =========================
    // PAYMENT METHOD
    // =========================

    const normalizedMethod =
      String(paymentMethod)
        .trim()
        .toLowerCase();

    if (
      !PAYMENT_METHODS.includes(
        normalizedMethod
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Unsupported payment method",
      });
    }

    // This endpoint is COD-only. Online
    // providers create their own pending
    // order alongside a gateway session.
    if (normalizedMethod !== "cod") {
      return res.status(400).json({
        success: false,
        message:
          "This endpoint only accepts 'cod'. Use the provider payment endpoints for online payments.",
      });
    }

    // =========================
    // TRUSTED CALCULATION
    // =========================

    validateAddress(address);

    const trustedItems =
      await buildTrustedItems(items);

    const totals =
      computeTotals(trustedItems);

    // =========================
    // ORDER CREATED TIME
    // =========================

    const orderDate = Date.now();

    // =========================
    // ORDER DATA
    // =========================

    const orderData = {
      userId,

      items: trustedItems,

      address,

      amount: totals.amount,

      currency: totals.currency,

      deliveryFee: totals.deliveryFee,

      subtotal: totals.subtotal,

      // Current status
      status: "Order Placed",

      // REAL TRACKING HISTORY
      trackingHistory: [
        {
          status: "Order Placed",
          date: orderDate,
        },
      ],

      paymentMethod: normalizedMethod,

      // COD settles on delivery, so the
      // payment stays pending until an
      // admin marks it collected. Fulfilment
      // `status` remains independent.
      paymentProvider: "cod",

      paymentStatus: PAYMENT_STATUS.PENDING,

      payment: false,

      paymentReference: null,

      paymentMeta: {},

      date: orderDate,
    };

    // =========================
    // SAVE ORDER
    // =========================

    const newOrder =
      new orderModel(orderData);

    const savedOrder =
      await newOrder.save();

    // =========================
    // CLEAR USER CART
    // =========================

    await userModel.findByIdAndUpdate(
      userId,
      {
        cartData: {},
      }
    );

    return res.status(201).json({
      success: true,
      message:
        "Order placed successfully",
      order: toOrderDisplay(savedOrder),
    });

  } catch (error) {
    const statusCode =
      error instanceof OrderValidationError
        ? error.statusCode
        : 500;

    if (statusCode === 500) {
      console.error(
        "Place order error:",
        error
      );
    }

    return res.status(statusCode).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// GET USER ORDERS
// =========================================

const userOrders = async (req, res) => {
  try {
    const userId = req.userId;

    const orders =
      await orderModel
        .find({
          userId,
        })
        .sort({
          date: -1,
        });

    return res.json({
      success: true,
      orders: toOrderDisplayList(orders),
    });

  } catch (error) {
    console.error(
      "Get user orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// GET SINGLE ORDER
// USER TRACKING
// =========================================

const getOrder = async (req, res) => {
  try {
    const userId = req.userId;

    const { orderId } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID is required",
      });
    }

    // =========================
    // FIND USER'S ORDER
    // =========================

    const order =
      await orderModel.findOne({
        _id: orderId,
        userId,
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =========================
    // RETURN REAL ORDER
    // =========================

    return res.json({
      success: true,
      order: toOrderDisplay(order),
    });

  } catch (error) {
    console.error(
      "Get order error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// GET ALL ORDERS - ADMIN
// =========================================

const allOrders = async (
  req,
  res
) => {
  try {
    const orders =
      await orderModel
        .find({})
        .sort({
          date: -1,
        });

    return res.json({
      success: true,
      orders: toOrderDisplayList(orders),
    });

  } catch (error) {
    console.error(
      "Get all orders error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================================
// UPDATE ORDER STATUS - ADMIN
// =========================================

const updateStatus = async (
  req,
  res
) => {
  try {
    const {
      orderId,
      status,
    } = req.body;

    // =========================
    // VALIDATION
    // =========================

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        message:
          "Order ID and status are required",
      });
    }

    if (
      !allowedStatuses.includes(
        status
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status",
      });
    }

    // =========================
    // FIND ORDER
    // =========================

    const order =
      await orderModel.findById(
        orderId
      );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // =========================
    // SAME STATUS
    // DO NOT CREATE DUPLICATE
    // =========================

    if (order.status === status) {
      return res.json({
        success: true,
        message:
          "Order already has this status",
        order: toOrderDisplay(order),
      });
    }

    // =========================
    // CURRENT STATUS POSITION
    // =========================

    const currentStatusIndex =
      allowedStatuses.indexOf(
        order.status
      );

    const newStatusIndex =
      allowedStatuses.indexOf(
        status
      );

    // =========================
    // PREVENT MOVING BACKWARDS
    // =========================

    if (
      newStatusIndex <
      currentStatusIndex
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Order status cannot move backwards",
      });
    }

    // =========================
    // PREVENT SKIPPING STATUS
    // =========================

    if (
      newStatusIndex >
      currentStatusIndex + 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Complete the previous order status first",
      });
    }

    // =========================
    // UPDATE CURRENT STATUS
    // =========================

    order.status = status;

    // =========================
    // ADD REAL TRACKING EVENT
    // =========================

    order.trackingHistory.push({
      status,
      date: Date.now(),
    });

    // =========================
    // SAVE
    // =========================

    const updatedOrder =
      await order.save();

    return res.json({
      success: true,
      message:
        "Order status updated",
      order: toOrderDisplay(updatedOrder),
    });

  } catch (error) {
    console.error(
      "Update order status error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  placeOrder,
  userOrders,
  getOrder,
  allOrders,
  updateStatus,
};
