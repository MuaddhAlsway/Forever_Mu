import express from "express";
import cors from "cors";
import "dotenv/config";

import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";

import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import configRouter from "./routes/configRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import newsletterRouter from "./routes/newsletterRoute.js";

const app = express();

const port =
  process.env.PORT || 4000;

// =========================
// DATABASE
// =========================

connectDB();

connectCloudinary();

// =========================
// PAYMENT
// =========================
// Stripe webhook signature verification needs
// the RAW request body, so /api/payment must
// be mounted BEFORE express.json() below.
// The route itself applies express.raw().

app.use(
  "/api/payment",
  paymentRouter
);

// =========================
// MIDDLEWARE
// =========================

app.use(express.json());

app.use(cors());

// =========================
// ROUTES
// =========================

// USER
app.use(
  "/api/user",
  userRouter
);

// PRODUCT
app.use(
  "/api/product",
  productRouter
);

// CART
app.use(
  "/api/cart",
  cartRouter
);

// ORDER
app.use(
  "/api/order",
  orderRouter
);

// STORE CONFIG
app.use(
  "/api/config",
  configRouter
);

// NEWSLETTER
app.use(
  "/api/newsletter",
  newsletterRouter
);

// =========================
// TEST ROUTE
// =========================

app.get("/", (req, res) => {
  res.send("API WORKING");
});

// =========================
// SERVER
// =========================

app.listen(port, () => {
  console.log(
    "Server started on Port : " +
      port
  );
});