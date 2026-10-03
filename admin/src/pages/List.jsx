import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

import { formatPrice } from "../utils/currency.js";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

function List({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);

  // Fetch all products
  const fetchProducts = async () => {
    try {
      const response = await axios.get(backendUrl + "/api/product/list");

      if (response.data.success) {
        setProducts(response.data.products);
      } else {
        toast.error(response.data.message || "Failed to load products");
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to load products"
      );
    } finally {
      setLoading(false);
    }
  };

  // Remove product
  const removeProduct = async (id) => {
    try {
      setRemovingId(id);

      const response = await axios.post(
        backendUrl + "/api/product/remove",
        { id },
        {
          headers: {
            token,
          },
        }
      );

      if (response.data.success) {
        toast.success("Product removed");

        await fetchProducts();
      } else {
        toast.error(
          response.data.message || "Failed to remove product"
        );
      }
    } catch (error) {
      console.error(error);

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to remove product"
      );
    } finally {
      setRemovingId(null);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="w-full">

      {/* Title */}
      <p className="mb-4 text-[15px] font-medium text-gray-800">
        All Products List
      </p>

      {/* Loading */}
      {loading ? (
        <p className="text-sm text-gray-500">
          Loading products...
        </p>
      ) : products.length === 0 ? (

        /* Empty Products */
        <div className="border border-gray-200 py-10 text-center">
          <p className="text-sm text-gray-400">
            No products found.
          </p>
        </div>

      ) : (

        /* Products Table */
        <table className="w-full border border-gray-200 text-sm">

          <thead>
            <tr className="border-b border-gray-200 bg-gray-100 text-gray-600">
              <th className="w-20 px-4 py-2 text-left font-medium">
                Image
              </th>
              <th className="px-4 py-2 text-left font-medium">
                Name
              </th>
              <th className="hidden px-4 py-2 text-left font-medium md:table-cell">
                Category
              </th>
              <th className="hidden px-4 py-2 text-left font-medium md:table-cell">
                Price
              </th>
              <th className="w-20 px-4 py-2 text-center font-medium">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {products.map((product) => (
              <tr
                key={product._id}
                className="border-b border-gray-100 last:border-b-0"
              >

                {/* Image */}
                <td className="px-4 py-2">
                  {product.image?.[0] ? (
                    <img
                      src={product.image?.[0]}
                      alt={product.name}
                      className="h-12 w-10 border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-10 items-center justify-center border border-gray-200 bg-gray-50 text-[10px] text-gray-400">
                      No
                    </div>
                  )}
                </td>

                {/* Name */}
                <td className="px-4 py-2 text-gray-700">
                  <p className="break-words">
                    {product.name}
                  </p>

                  {/* Category + Price on small screens */}
                  <p className="mt-0.5 text-xs text-gray-400 md:hidden">
                    {product.category} &middot;{" "}
                    {formatPrice(product.price)}
                  </p>
                </td>

                {/* Category */}
                <td className="hidden px-4 py-2 text-gray-700 md:table-cell">
                  {product.category}
                </td>

                {/* Price */}
                <td className="hidden px-4 py-2 text-gray-700 md:table-cell">
                  {formatPrice(product.price)}
                </td>

                {/* Remove */}
                <td className="px-4 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => removeProduct(product._id)}
                    disabled={removingId === product._id}
                    className="
                      inline-flex h-6 w-6
                      items-center justify-center
                      border border-gray-200
                      text-xs text-gray-400
                      cursor-pointer
                      hover:border-red-300 hover:text-red-500
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                    title="Remove product"
                  >
                    X
                  </button>
                </td>

              </tr>
            ))}
          </tbody>

        </table>
      )}

    </div>
  );
}

export default List;