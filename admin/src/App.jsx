import ScrollToTop from './components/ScrollToTop';
import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import Login from "./components/Login";

import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Newsletter from "./pages/Newsletter";
import NotFound from "./pages/NotFound";

function App() {
  const [token, setToken] = useState(
    localStorage.getItem("token") || ""
  );

  return (
    <div>

      <ToastContainer />

      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />

          <div className="flex">

            <Sidebar />

            <div className="w-[82%] px-[4%] py-8">
              <ScrollToTop />
            <Routes>
                <Route
                  path="/add"
                  element={<Add token={token} />}
                />

                <Route
                  path="/list"
                  element={<List token={token} />}
                />

                <Route
                  path="/orders"
                  element={<Orders token={token} />}
                />

<Route
                  path="/newsletter"
                  element={
                    <Newsletter token={token} />
                  }
                />

                {/* ============ NOT FOUND ============
                    Catch-all, inside the admin shell.
                    Must stay last: `*` matches
                    anything, so a route added below
                    this one would never be reached. */}

                <Route
                  path="*"
                  element={<NotFound />}
                />
              </Routes>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

export default App;

