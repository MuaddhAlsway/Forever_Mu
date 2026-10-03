import express from "express";

import {
  placeOrder,
  userOrders,
  getOrder,
  allOrders,
  updateStatus,
} from "../controller/orderController.js";

import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";

const orderRouter =
  express.Router();

// =========================================
// USER ROUTES
// =========================================

orderRouter.post(
  "/place",
  authUser,
  placeOrder
);

orderRouter.post(
  "/userorders",
  authUser,
  userOrders
);

// Track single order
orderRouter.post(
  "/track",
  authUser,
  getOrder
);

// =========================================
// ADMIN ROUTES
// =========================================

orderRouter.post(
  "/list",
  adminAuth,
  allOrders
);

orderRouter.post(
  "/status",
  adminAuth,
  updateStatus
);

export default orderRouter;