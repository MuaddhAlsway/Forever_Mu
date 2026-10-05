import { useNavigate, Link } from "react-router-dom";

// =========================================
// NOT FOUND
// =========================================
// Mounted on the `*` route in App.jsx so a
// mistyped or stale admin URL shows this
// page instead of an empty panel next to
// the sidebar.
//
// Only reachable once a token exists: App
// renders Login in place of the whole admin
// shell when there is none, so this never
// acts as a way around authentication.
// =========================================

function NotFound() {
  const navigate = useNavigate();

  const missingPath =
    window.location.pathname;

  return (
    <div className="flex flex-col items-center justify-center gap-5 py-16 min-h-[70vh] text-center">

      <p className="text-[22vw] md:text-[10vw] leading-none font-semibold text-transparent [-webkit-text-stroke:1.5px_#e5e7eb] select-none">
        404
      </p>

      <p className="text-xl font-medium text-gray-800">
        Page not found
      </p>

      <p className="text-sm text-gray-500 max-w-md">
        That page does not exist in the admin
        panel. It may have been removed, or the
        link may be out of date.
      </p>

      <p className="max-w-full break-all text-xs text-gray-400 bg-slate-100 px-4 py-2 rounded">
        {missingPath}
      </p>

      {/* ================= ACTIONS =================
          Back to List Items is the destination
          an admin lands on most often. */}

      <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">

        <button
          type="button"
          onClick={() => navigate("/list")}
          className="bg-black text-white px-8 py-3 text-sm hover:bg-gray-800 transition"
        >
          BACK TO LIST ITEMS
        </button>

        <Link
          to="/add"
          className="border border-black px-8 py-3 text-sm hover:bg-black hover:text-white transition"
        >
          ADD ITEMS
        </Link>

      </div>

      {/* ================= SECONDARY LINKS =================
          Mirrors the sidebar so the visitor is
          never stuck on a dead route. */}

      <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-500">

        {[
          { path: "/add", label: "Add Items" },
          {
            path: "/list",
            label: "List Items",
          },
          { path: "/orders", label: "Orders" },
          {
            path: "/newsletter",
            label: "Newsletter",
          },
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