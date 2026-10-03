import express from "express";

import {
  publicStoreConfig,
} from "../config/storeConfig.js";

const configRouter =
  express.Router();

// =========================================
// PUBLIC STORE CONFIG
// =========================================
// Read-only, contains no secrets.
// React uses this for DISPLAY ONLY. The
// backend recalculates every real order.
// =========================================

configRouter.get(
  "/store",
  (req, res) => {
    res.json({
      success: true,
      ...publicStoreConfig,
    });
  }
);

export default configRouter;