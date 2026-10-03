import {
  Routes,
  Route,
} from "react-router-dom";

import {
  ToastContainer,
} from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import Home from "./pages/Home";
import Collection from "./pages/Collection";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Order from "./pages/Order";
import Profile from "./pages/Profile";
import PlaceOrder from "./pages/PlaceOrder";
import Product from "./pages/Product";
import TrackOrder from "./pages/TrackOrder";
import StripeSuccess from "./pages/StripeSuccess";
import StripeCancel from "./pages/StripeCancel";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">

      {/* ================= NAVBAR ================= */}

      <Navbar />

      {/* ================= PAGES ================= */}

      <Routes>

        {/* ================= HOME ================= */}

        <Route
          path="/"
          element={<Home />}
        />

        {/* ================= COLLECTION ================= */}

        <Route
          path="/collection"
          element={<Collection />}
        />

        {/* ================= PRODUCT ================= */}

        <Route
          path="/product/:productId"
          element={<Product />}
        />

        {/* ================= CART ================= */}

        <Route
          path="/cart"
          element={<Cart />}
        />

        {/* ================= CHECKOUT ================= */}

        <Route
          path="/placeorder"
          element={<PlaceOrder />}
        />

        {/* ================= ORDERS ================= */}

        <Route
          path="/orders"
          element={<Order />}
        />

        {/* ============ PROFILE ============ */}
        {/* No :userId segment on purpose. The
            logged-in JWT decides whose profile
            this is, so a customer id is never
            exposed in the URL. Profile.jsx
            redirects to /login without a token. */}

        <Route
          path="/profile"
          element={<Profile />}
        />

        {/* ================= TRACK ORDER ================= */}

        <Route
          path="/trackorder/:orderId"
          element={<TrackOrder />}
        />

        {/* ================= LOGIN ================= */}

        <Route
          path="/login"
          element={<Login />}
        />

        {/* ================= ABOUT ================= */}

        <Route
          path="/about"
          element={<About />}
        />

        {/* ================= CONTACT ================= */}

        <Route
          path="/contact"
          element={<Contact />}
        />

        {/* ============ STRIPE REDIRECTS ============ */}
        {/* Reached from the hosted Stripe
            Checkout page. Neither page decides
            the payment state; the backend does. */}

        <Route
          path="/payment/stripe/success"
          element={<StripeSuccess />}
        />

        <Route
          path="/payment/stripe/cancel"
          element={<StripeCancel />}
        />

      </Routes>

      {/* ================= FOOTER ================= */}

      <Footer />

      {/* ================= TOASTS =================
          Mounted once at the app root. Without a
          container the toast() calls in Profile,
          Login, PlaceOrder and Newsletter queue
          up and are never displayed. */}

      <ToastContainer
        position="top-center"
        autoClose={3000}
        closeOnClick
        pauseOnHover
        theme="light"
      />

    </div>
  );
}

export default App;