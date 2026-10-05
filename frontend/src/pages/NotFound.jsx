import { useContext } from "react";
import { Link } from "react-router-dom";

import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";

// =========================================
// NOT FOUND
// =========================================
// Mounted on the `*` route in App.jsx, so
// any URL that matches no other route lands
// here instead of rendering a blank page.
//
// `location.pathname` is echoed back to the
// visitor so a mistyped link is obvious. It
// is rendered as plain text, never as markup,
// and only after React escapes it.
// =========================================

function NotFound() {
  const { navigate } = useContext(ShopContext);

  const missingPath =
    window.location.pathname;

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20 min-h-[70vh] text-center">

      {/* ================= CODE =================
          Oversized and outlined so the page
          reads as a 404 even at a glance. */}

      <p className="text-[22vw] sm:text-[10vw] leading-none font-medium text-transparent [-webkit-text-stroke:1.5px_#d1d5db] select-none">
        404
      </p>

      <Title
        text1="PAGE"
        text2="NOT FOUND"
      />

      <p className="text-sm text-gray-500 max-w-md">
        We could not find that page. It may
        have been moved, renamed, or the
        link may be out of date.
      </p>

      {/* ================= BAD PATH =================
          Shown in a monospace block so long
          URLs wrap predictably. */}

      <p className="max-w-full break-all text-xs text-gray-400 bg-slate-100 px-4 py-2 rounded">
        {missingPath}
      </p>

      {/* ================= ACTIONS =================
          Back to the storefront first, then the
          paths a lost visitor most likely
          wanted. Buttons use the shared
          navigate() from ShopContext; the extra
          links are plain Links so they stay
          middle-clickable. */}

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">

        <button
          type="button"
          onClick={() => navigate("/")}
          className="bg-black text-white px-10 py-3 text-sm hover:bg-gray-800 transition"
        >
          BACK TO HOME
        </button>

        <Link
          to="/collection"
          className="border border-black px-10 py-3 text-sm hover:bg-black hover:text-white transition"
        >
          SHOP COLLECTION
        </Link>

      </div>

      {/* ================= SECONDARY LINKS ================= */}

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs uppercase tracking-[0.14em] text-gray-500">

        {[
          { path: "/", label: "Home" },
          {
            path: "/collection",
            label: "Collection",
          },
          { path: "/about", label: "About" },
          {
            path: "/contact",
            label: "Contact",
          },
          { path: "/cart", label: "Cart" },
          { path: "/login", label: "Login" },
        ].map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="hover:text-black transition"
          >
            {item.label}
          </Link>
        ))}

      </div>

    </div>
  );
}

export default NotFound;