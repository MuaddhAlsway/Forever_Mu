import mongoose from "mongoose";

import productModel from "../models/productModel.js";

import {
  CURRENCY,
  DELIVERY_FEE,
  ORDER_LIMITS,
} from "../config/storeConfig.js";

// =========================================
// SHARED ORDER VALIDATION
// =========================================
// Single source of truth for order maths.
// Every payment method (COD and all online
// providers) MUST use this so the amount a
// customer is charged can never diverge
// between payment paths.
// =========================================

export class OrderValidationError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "OrderValidationError";
    this.statusCode = statusCode;
  }
}

export const requiredAddressFields = [
  "firstName",
  "lastName",
  "email",
  "street",
  "city",
  "country",
  "phone",
];

const emailPattern =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateAddress = (
  address
) => {
  if (
    !address ||
    typeof address !== "object"
  ) {
    throw new OrderValidationError(
      "Delivery address is required"
    );
  }

  for (const field of requiredAddressFields) {
    const value = address[field];

    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      throw new OrderValidationError(
        `Address field '${field}' is required`
      );
    }
  }

  if (
    !emailPattern.test(
      address.email.trim()
    )
  ) {
    throw new OrderValidationError(
      "Address field 'email' is invalid"
    );
  }
};

// =========================================
// BUILD TRUSTED ITEMS
// =========================================
// Accepts ONLY _id, size and quantity from
// the client. Name, image and price are
// always rebuilt from MongoDB.
// =========================================

export const buildTrustedItems = async (
  items
) => {
  if (
    !Array.isArray(items) ||
    items.length === 0
  ) {
    throw new OrderValidationError(
      "Order items are required"
    );
  }

  if (
    items.length >
    ORDER_LIMITS.maxItemsPerOrder
  ) {
    throw new OrderValidationError(
      "Too many items in a single order"
    );
  }

  for (const item of items) {
    if (
      !item?._id ||
      !mongoose.isValidObjectId(item._id)
    ) {
      throw new OrderValidationError(
        "Invalid product id"
      );
    }
  }

  const productIds = [
    ...new Set(
      items.map((item) => String(item._id))
    ),
  ];

  const products =
    await productModel.find({
      _id: { $in: productIds },
    });

  const productMap = new Map(
    products.map((product) => [
      String(product._id),
      product,
    ])
  );

  const trustedItems = [];

  for (const item of items) {
    const product = productMap.get(
      String(item._id)
    );

    if (!product) {
      throw new OrderValidationError(
        `Product not found: ${item._id}`
      );
    }

    const quantity =
      Number(item.quantity);

    if (
      !Number.isInteger(quantity) ||
      quantity <= 0
    ) {
      throw new OrderValidationError(
        "Quantity must be a positive integer"
      );
    }

    if (
      quantity >
      ORDER_LIMITS.maxQuantityPerItem
    ) {
      throw new OrderValidationError(
        `Quantity per item cannot exceed ${ORDER_LIMITS.maxQuantityPerItem}`
      );
    }

    const size =
      typeof item.size === "string"
        ? item.size.trim()
        : "";

    const availableSizes =
      Array.isArray(product.sizes)
        ? product.sizes.map((value) =>
            String(value).trim()
          )
        : [];

    if (
      availableSizes.length > 0 &&
      !availableSizes.includes(size)
    ) {
      throw new OrderValidationError(
        `Size '${size}' is not available for '${product.name}'`
      );
    }

    const price = Number(product.price);

    if (
      !Number.isFinite(price) ||
      price < 0
    ) {
      throw new OrderValidationError(
        `Product '${product.name}' has an invalid price`
      );
    }

    trustedItems.push({
      _id: product._id,
      name: product.name,
      image: product.image,
      price,
      size: size || null,
      quantity,
    });
  }

  return trustedItems;
};

// =========================================
// TRUSTED TOTALS
// =========================================

const round2 = (value) =>
  Math.round(value * 100) / 100;

export const computeTotals = (
  trustedItems
) => {
  const subtotal = trustedItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  const deliveryFee = DELIVERY_FEE;

  return {
    currency: CURRENCY,
    deliveryFee,
    subtotal: round2(subtotal),
    amount: round2(subtotal + deliveryFee),
  };
};

// =========================================
// CART -> REQUEST ITEMS
// =========================================
// Converts the stored cartData object into
// the { _id, size, quantity } shape the
// trusted builder expects.
// =========================================

export const cartToRequestItems = (
  cartData
) => {
  const requested = [];

  for (const itemId in cartData || {}) {
    for (const size in cartData[itemId]) {
      const quantity = Number(
        cartData[itemId][size]
      );

      if (quantity > 0) {
        requested.push({
          _id: itemId,
          size,
          quantity,
        });
      }
    }
  }

  return requested;
};