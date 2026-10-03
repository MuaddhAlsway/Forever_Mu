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

const port = process.env.PORT || 4000;

// =========================================================
// DATABASE
// =========================================================

connectDB();
connectCloudinary();

// =========================================================
// CORS
// =========================================================
//
// CORS MUST run before ALL API routes,
// including /api/payment.
//
// Production frontend:
// https://forever-frontend-ae4yjxczz-muaddhalsways-projects.vercel.app
//

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",

  // Production frontend
  "https://forever-frontend-ae4yjxczz-muaddhalsways-projects.vercel.app",

  // Optional stable production URL from env
  process.env.FRONTEND_URL,
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Allow requests without Origin:
    // Postman, Thunder Client, server-to-server, etc.
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(
      `[CORS] Blocked origin: ${origin}`
    );

    return callback(
      new Error(
        `Origin ${origin} is not allowed by CORS`
      )
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "token",
  ],
};

app.use(cors(corsOptions));

// =========================================================
// STRIPE PAYMENT ROUTES
// =========================================================
//
// IMPORTANT:
//
// paymentRouter is mounted BEFORE express.json()
// because the Stripe webhook needs the original
// raw request body.
//
// CORS is ABOVE this router, so requests such as:
//
// GET /api/payment/methods
//
// still receive CORS headers.
//
// Your paymentRoute.js must ensure express.raw()
// applies ONLY to the webhook route.
//

app.use(
  "/api/payment",
  paymentRouter
);

// =========================================================
// JSON MIDDLEWARE
// =========================================================
//
// All normal API routes after this point
// receive parsed JSON bodies.
//

app.use(express.json());

// =========================================================
// ROUTES
// =========================================================

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

// =========================================================
// TEST ROUTE
// =========================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API WORKING",
  });
});

// =========================================================
// 404
// =========================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =========================================================
// ERROR HANDLER
// =========================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "Server error:",
      error
    );

    // CORS rejection
    if (
      error.message?.includes(
        "is not allowed by CORS"
      )
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Origin is not allowed by CORS",
      });
    }

    res.status(
      error.status || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Internal server error",
    });
  }
);

// =========================================================
// SERVER
// =========================================================

app.listen(port, () => {
  console.log(
    `Server started on Port: ${port}`
  );

  console.log(
    "Allowed CORS origins:",
    allowedOrigins
  );
});

export default app;