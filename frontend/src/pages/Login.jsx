import { useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import { ShopContext } from "../context/ShopContext";

function Login() {
  const {
    backendUrl,
    setToken,
    navigate,
  } = useContext(ShopContext);

  const [currentState, setCurrentState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================
  // SUBMIT
  // =========================

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);

      let response;

      // =========================
      // LOGIN
      // =========================

      if (currentState === "Login") {
        response = await axios.post(
          backendUrl + "/api/user/login",
          {
            email,
            password,
          }
        );
      }

      // =========================
      // REGISTER
      // =========================

      else {
        response = await axios.post(
          backendUrl + "/api/user/register",
          {
            name,
            email,
            password,
          }
        );
      }

      // =========================
      // SUCCESS
      // =========================

      if (response.data.success) {
        const userToken = response.data.token;

        setToken(userToken);

        localStorage.setItem(
          "token",
          userToken
        );

        toast.success(
          currentState === "Login"
            ? "Login successful"
            : "Account created successfully"
        );

        navigate("/");
      }

      // =========================
      // ERROR FROM BACKEND
      // =========================

      else {
        toast.error(
          response.data.message ||
            "Authentication failed"
        );
      }
    } catch (error) {
      console.error("Authentication error:", error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Authentication failed"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // CHANGE AUTH MODE
  // =========================

  const switchToSignUp = () => {
    setCurrentState("Sign Up");
    setName("");
    setEmail("");
    setPassword("");
  };

  const switchToLogin = () => {
    setCurrentState("Login");
    setName("");
    setEmail("");
    setPassword("");
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      {/* ================= TITLE ================= */}

      <div className="inline-flex items-center gap-2 mb-2 mt-10">
        <p className="prata-regular text-3xl">
          {currentState}
        </p>

        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {/* ================= NAME ================= */}

      {currentState === "Sign Up" && (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-800 outline-none"
          placeholder="Name"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
        />
      )}

      {/* ================= EMAIL ================= */}

      <input
        type="email"
        className="w-full px-3 py-2 border border-gray-800 outline-none"
        placeholder="Email"
        value={email}
        onChange={(e) =>
          setEmail(e.target.value)
        }
        required
      />

      {/* ================= PASSWORD ================= */}

      <input
        type="password"
        className="w-full px-3 py-2 border border-gray-800 outline-none"
        placeholder="Password"
        value={password}
        onChange={(e) =>
          setPassword(e.target.value)
        }
        required
      />

      {/* ================= OPTIONS ================= */}

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        <p className="cursor-pointer hover:text-black">
          Forgot your password?
        </p>

        {currentState === "Login" ? (
          <p
            onClick={switchToSignUp}
            className="cursor-pointer hover:text-black"
          >
            Create account
          </p>
        ) : (
          <p
            onClick={switchToLogin}
            className="cursor-pointer hover:text-black"
          >
            Login Here
          </p>
        )}
      </div>

      {/* ================= SUBMIT ================= */}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white font-light px-8 py-2 mt-4 cursor-pointer hover:bg-gray-800 transition disabled:bg-gray-500 disabled:cursor-not-allowed"
      >
        {loading
          ? "PLEASE WAIT..."
          : currentState === "Login"
          ? "SIGN IN"
          : "SIGN UP"}
      </button>
    </form>
  );
}

export default Login;