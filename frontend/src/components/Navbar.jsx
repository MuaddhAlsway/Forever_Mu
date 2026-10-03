import { useContext, useState } from "react";
import { assets } from "../assets/frontend_assets/assets";
import { Link, NavLink } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

function Navbar() {
  const [visible, setVisible] = useState(false);

  const {
    getCartCount,
    token,
    logout,
    navigate,
  } = useContext(ShopContext);

  const navLinks = [
    { path: "/", label: "HOME" },
    { path: "/collection", label: "COLLECTION" },
    { path: "/about", label: "ABOUT" },
    { path: "/contact", label: "CONTACT" },
  ];

  // =========================
  // LOGOUT
  // =========================
  // Reuses the shared logout() from ShopContext so
  // the navbar and the profile page clear exactly
  // the same customer state. It only removes the
  // storefront's own `token`; the admin app keeps
  // its own session.

  // =========================
  // PROFILE CLICK
  // =========================
  // Logged out -> Login. Logged in -> the account
  // dropdown, whose "My Profile" entry opens
  // /profile.

  const profileClick = () => {
    if (!token) {
      navigate("/login");
    }
  };

  return (
    <div className="flex items-center justify-between py-5 font-medium">

      {/* ================= LOGO ================= */}

      <Link to="/">
        <img
          src={assets.logo}
          className="w-36"
          alt="Forever"
        />
      </Link>

      {/* ================= DESKTOP NAVIGATION ================= */}

      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">

        {navLinks.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-1"
          >
            {({ isActive }) => (
              <>
                <p>{item.label}</p>

                <hr
                  className={`w-2/4 border-none h-[1.5px] bg-gray-700 ${
                    isActive
                      ? "block"
                      : "hidden"
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}

      </ul>

      {/* ================= ICONS ================= */}

      <div className="flex items-center gap-6">

        {/* Search */}

        <img
          src={assets.search_icon}
          className="w-5 cursor-pointer"
          alt="Search"
        />

        {/* ================= PROFILE ================= */}

        <div className="group relative">

          <img
            onClick={profileClick}
            src={assets.profile_icon}
            className="w-5 cursor-pointer"
            alt={token ? "Account" : "Login"}
            title={token ? "Account" : "Login"}
          />

          {/* Logged out: an explicit Login entry,
              so the account area is never a dead
              icon. Logged in: the account dropdown. */}

          {!token && (
            <button
              type="button"
              onClick={() =>
                navigate("/login")
              }
              className="hidden sm:block text-xs uppercase tracking-[0.14em] text-gray-700 hover:text-black transition cursor-pointer"
            >
              Login
            </button>
          )}

          {/* Only show dropdown when logged in */}

          {token && (
            <div className="group-hover:block hidden absolute right-0 pt-4 z-20">

              <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded">

                {/* Profile */}

                <p
                  onClick={() =>
                    navigate("/profile")
                  }
                  className="cursor-pointer hover:text-black"
                >
                  My Profile
                </p>

                {/* Orders */}

                <p
                  onClick={() =>
                    navigate("/orders")
                  }
                  className="cursor-pointer hover:text-black"
                >
                  Orders
                </p>

                {/* Logout */}

                <p
                  onClick={logout}
                  className="cursor-pointer hover:text-black"
                >
                  Logout
                </p>

              </div>

            </div>
          )}

        </div>

        {/* ================= CART ================= */}

        <Link
          to="/cart"
          className="relative"
        >

          <img
            src={assets.cart_icon}
            className="w-5 min-w-5"
            alt="Cart"
          />

          {/* Dynamic Cart Count */}

          {getCartCount() > 0 && (
            <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
              {getCartCount()}
            </p>
          )}

        </Link>

        {/* ================= MOBILE MENU ================= */}

        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className="w-5 cursor-pointer sm:hidden"
          alt="Menu"
        />

      </div>

      {/* ================= MOBILE SIDEBAR ================= */}

      <div
        className={`fixed top-0 right-0 bottom-0 overflow-hidden bg-white z-50 transition-all duration-300 ${
          visible ? "w-full" : "w-0"
        }`}
      >

        <div className="flex flex-col text-gray-600">

          {/* Back */}

          <div
            onClick={() =>
              setVisible(false)
            }
            className="flex items-center gap-4 p-3 cursor-pointer"
          >

            <img
              src={assets.dropdown_icon}
              className="h-4 rotate-180"
              alt="Back"
            />

            <p>Back</p>

          </div>

          {/* Navigation */}

          {navLinks.map((item) => (

            <NavLink
              key={item.path}
              to={item.path}
              onClick={() =>
                setVisible(false)
              }
              className={({ isActive }) =>
                `py-2 pl-5 border ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600"
                }`
              }
            >
              {item.label}
            </NavLink>

          ))}

          {/* ================= LOGGED IN ================= */}

          {token ? (
            <>
              <NavLink
                to="/profile"
                onClick={() =>
                  setVisible(false)
                }
                className={({ isActive }) =>
                  `py-2 pl-5 border ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-600"
                  }`
                }
              >
                MY PROFILE
              </NavLink>

              <NavLink
                to="/orders"
                onClick={() =>
                  setVisible(false)
                }
                className={({ isActive }) =>
                  `py-2 pl-5 border ${
                    isActive
                      ? "bg-black text-white"
                      : "text-gray-600"
                  }`
                }
              >
                ORDERS
              </NavLink>

              <button
                type="button"
                onClick={() => {
                  setVisible(false);
                  logout();
                }}
                className="py-2 pl-5 border text-left cursor-pointer"
              >
                LOGOUT
              </button>
            </>
          ) : (

            /* ================= LOGGED OUT ================= */

            <NavLink
              to="/login"
              onClick={() =>
                setVisible(false)
              }
              className={({ isActive }) =>
                `py-2 pl-5 border ${
                  isActive
                    ? "bg-black text-white"
                    : "text-gray-600"
                }`
              }
            >
              LOGIN
            </NavLink>

          )}

        </div>

      </div>

    </div>
  );
}

export default Navbar;