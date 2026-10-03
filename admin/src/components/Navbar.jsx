import assets from "../assets/logo.png";
import { toast } from "react-toastify";

function Navbar({ setToken }) {

  const logoutHandler = () => {
    setToken("");
    localStorage.removeItem("token");

    toast.success("Logged out successfully!");
  };

  return (
    <div className="flex items-center justify-between px-[4%] py-4 border-b">

      <img
        className="w-[max(10%,80px)]"
        src={assets}
        alt="Logo"
      />

      <button
        onClick={logoutHandler}
        className="bg-gray-600 text-white px-5 py-2 sm:px-7 sm:py-2 rounded-full text-xs sm:text-sm cursor-pointer hover:bg-gray-700"
      >
        Logout
      </button>

    </div>
  );
}

export default Navbar;