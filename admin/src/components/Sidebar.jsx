import { NavLink } from "react-router-dom";

function Sidebar() {
  return (
    <div className="w-[18%] min-h-screen border-r-2 border-gray-200">
      <div className="flex flex-col gap-4 pt-6 pl-[20%] text-[15px]">

        <NavLink
          to="/add"
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${
              isActive ? "bg-pink-100 border-pink-400" : ""
            }`
          }
        >
          <span className="text-xl">＋</span>
          <p className="hidden md:block">Add Items</p>
        </NavLink>

        <NavLink
          to="/list"
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${
              isActive ? "bg-pink-100 border-pink-400" : ""
            }`
          }
        >
          <span className="text-xl">☷</span>
          <p className="hidden md:block">List Items</p>
        </NavLink>

<NavLink
          to="/orders"
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${
              isActive ? "bg-pink-100 border-pink-400" : ""
            }`
          }
        >
          <span className="text-xl">-</span>
          <p className="hidden md:block">Orders</p>
        </NavLink>

        <NavLink
          to="/newsletter"
          className={({ isActive }) =>
            `flex items-center gap-3 border border-gray-300 border-r-0 px-3 py-2 rounded-l ${
              isActive ? "bg-pink-100 border-pink-400" : ""
            }`
          }
        >
          <span className="text-xl">&#9993;</span>
          <p className="hidden md:block">
            Newsletter
          </p>
        </NavLink>

      </div>
    </div>
  );
}

export default Sidebar;