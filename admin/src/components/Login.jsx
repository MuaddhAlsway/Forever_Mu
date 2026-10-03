import { useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const backendUrl = (() => {
  const rawUrl = (
    import.meta.env.VITE_BACKEND_URL ||
    "http://localhost:4000"
  );
  
  // Trim whitespace
  let url = rawUrl.trim();
  
  // Remove ALL trailing slashes
  url = url.replace(/\/+$/, "");
  
  // Debug in development
  if (import.meta.env.DEV) {
    console.log("Backend URL normalization:");
    console.log("  Raw:", JSON.stringify(rawUrl));
    console.log("  Normalized:", JSON.stringify(url));
  }
  
  return url;
})();

function Login({ setToken }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        backendUrl + "/api/user/admin",
        {
          email,
          password,
        }
      );

      // LOGIN SUCCESS
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem("token", response.data.token);

        toast.success("Login successful!");
      }

      // INVALID CREDENTIALS
      else {
        toast.error(
          response.data.message || "Invalid email or password"
        );
      }

    } catch (error) {
      console.error("Login failed:", error);

      // BACKEND ERROR
      if (error.response) {
        toast.error(
          error.response.data?.message ||
          "Something went wrong on the server"
        );
      }

      // BACKEND NOT RESPONDING
      else if (error.request) {
        toast.error(
          "Cannot connect to the server. Please try again."
        );
      }

      // OTHER ERROR
      else {
        toast.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">

      <div className="bg-white shadow-md rounded-lg px-8 py-8 w-[90%] max-w-[400px]">

        <h1 className="text-2xl font-bold mb-2">
          Admin Panel
        </h1>

        <p className="text-gray-500 mb-6">
          Sign in to your account
        </p>

        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col gap-4"
        >

          {/* EMAIL */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Email Address
            </p>

            <input
              type="email"
              placeholder="admin@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-black"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* PASSWORD */}
          <div>
            <p className="mb-2 text-sm font-medium">
              Password
            </p>

            <input
              type="password"
              placeholder="Enter your password"
              className="w-full px-3 py-2 border border-gray-300 rounded outline-none focus:border-black"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* LOGIN BUTTON */}
          <button
            type="submit"
            className="w-full bg-black text-white py-2.5 rounded mt-2 cursor-pointer hover:bg-gray-800"
          >
            Login
          </button>

        </form>

      </div>

    </div>
  );
}

export default Login;