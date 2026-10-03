import { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";

function Cart() {
  const {
    products,
    formatPrice,
    delivery_fee,
    cartItems,
    updateQuantity,
    getCartAmount,
    navigate,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);

  // Stores the item waiting for deletion
  const [deleteItem, setDeleteItem] = useState(null);

  // =========================
  // CONVERT CART OBJECT TO ARRAY
  // =========================
  useEffect(() => {
    const tempData = [];

    for (const productId in cartItems) {
      for (const size in cartItems[productId]) {
        if (cartItems[productId][size] > 0) {
          tempData.push({
            _id: productId,
            size: size,
            quantity: cartItems[productId][size],
          });
        }
      }
    }

    setCartData(tempData);
  }, [cartItems]);

  // =========================
  // OPEN DELETE POPUP
  // =========================
  const handleDeleteClick = (item) => {
    setDeleteItem(item);
  };

  // =========================
  // CONFIRM DELETE
  // =========================
  const confirmDelete = () => {
    if (!deleteItem) return;

    updateQuantity(
      deleteItem._id,
      deleteItem.size,
      0
    );

    setDeleteItem(null);
  };

  // =========================
  // CANCEL DELETE
  // =========================
  const cancelDelete = () => {
    setDeleteItem(null);
  };

  return (
    <>
      <div className="border-t pt-14">

        {/* ================= TITLE ================= */}
        <div className="text-2xl mb-3">
          <Title text1="YOUR" text2="CART" />
        </div>

        {/* ================= CART PRODUCTS ================= */}
        <div>

          {cartData.map((item) => {
            const productData = products.find(
              (product) => product._id === item._id
            );

            if (!productData) return null;

            return (
              <div
                key={`${item._id}-${item.size}`}
                className="py-4 border-t border-b text-gray-700 grid grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4"
              >

                {/* ================= PRODUCT ================= */}
                <div className="flex items-start gap-6">

                  {/* Product Image */}
                  <img
                    className="w-16 sm:w-20"
                    src={productData.image[0]}
                    alt={productData.name}
                  />

                  {/* Product Details */}
                  <div>

                    <p className="text-xs sm:text-lg font-medium">
                      {productData.name}
                    </p>

                    <div className="flex items-center gap-5 mt-2">

                      {/* Price */}
                      <p>
                        {formatPrice(
                          productData.price
                        )}
                      </p>

                      {/* Size */}
                      <p className="px-2 sm:px-3 sm:py-1 border bg-slate-50">
                        {item.size}
                      </p>

                    </div>

                  </div>

                </div>

                {/* ================= QUANTITY ================= */}
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);

                    if (value > 0) {
                      updateQuantity(
                        item._id,
                        item.size,
                        value
                      );
                    }
                  }}
                  className="border max-w-10 sm:max-w-20 px-1 sm:px-2 py-1"
                />

                {/* ================= DELETE ================= */}
                <img
                  onClick={() => handleDeleteClick(item)}
                  className="w-4 mr-4 sm:w-5 cursor-pointer hover:opacity-60 transition"
                  src={assets.bin_icon}
                  alt="Delete"
                />

              </div>
            );
          })}

        </div>

        {/* ================= EMPTY CART ================= */}
        {cartData.length === 0 && (

          <div className="text-center py-20">

            <p className="text-gray-500 text-lg">
              Your cart is empty.
            </p>

            <button
              onClick={() => navigate("/collection")}
              className="bg-black text-white px-8 py-3 mt-5 text-sm cursor-pointer"
            >
              CONTINUE SHOPPING
            </button>

          </div>

        )}

        {/* ================= CART TOTAL ================= */}
        {cartData.length > 0 && (

          <div className="flex justify-end my-20">

            <div className="w-full sm:w-[450px]">

              <div className="text-2xl">
                <Title
                  text1="CART"
                  text2="TOTALS"
                />
              </div>

              <div className="flex flex-col gap-2 mt-2 text-sm">

                {/* Subtotal */}
                <div className="flex justify-between">

                  <p>
                    Subtotal
                  </p>

                  <p>
                    {formatPrice(
                      getCartAmount()
                    )}
                  </p>

                </div>

                <hr />

                {/* Shipping */}
                <div className="flex justify-between">

                  <p>
                    Shipping Fee
                  </p>

                  <p>
                    {formatPrice(
                      delivery_fee
                    )}
                  </p>

                </div>

                <hr />

                {/* Total */}
                <div className="flex justify-between">

                  <b>
                    Total
                  </b>

                  <b>
                    {formatPrice(
                      getCartAmount() +
                        delivery_fee
                    )}
                  </b>

                </div>

              </div>

              {/* ================= CHECKOUT ================= */}
              <div className="w-full text-end">

                <button
                  onClick={() => navigate("/placeorder")}
                  className="bg-black text-white text-sm my-8 px-8 py-3 cursor-pointer hover:bg-gray-800 transition"
                >
                  PROCEED TO CHECKOUT
                </button>

              </div>

            </div>

          </div>

        )}

      </div>

      {/* ================================================= */}
      {/* DELETE CONFIRMATION POPUP */}
      {/* ================================================= */}

      {deleteItem && (

        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={cancelDelete}
        >

          {/* Modal */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-md rounded-lg shadow-xl p-6"
          >

            {/* Icon */}
            <div className="flex justify-center mb-4">

              <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">

                <img
                  src={assets.bin_icon}
                  alt="Delete"
                  className="w-6"
                />

              </div>

            </div>

            {/* Title */}
            <h2 className="text-xl font-medium text-center">
              Remove Item?
            </h2>

            {/* Description */}
            <p className="text-gray-500 text-sm text-center mt-2">
              Are you sure you want to remove this item
              from your cart?
            </p>

            {/* Product Info */}
            {(() => {
              const productData = products.find(
                (product) =>
                  product._id === deleteItem._id
              );

              if (!productData) return null;

              return (

                <div className="flex items-center gap-4 mt-6 bg-gray-50 p-3 rounded">

                  <img
                    src={productData.image[0]}
                    alt={productData.name}
                    className="w-16 h-16 object-cover"
                  />

                  <div>

                    <p className="font-medium text-sm">
                      {productData.name}
                    </p>

                    <div className="flex gap-3 text-sm text-gray-500 mt-1">

                      <span>
                        Size: {deleteItem.size}
                      </span>

                      <span>
                        Qty: {deleteItem.quantity}
                      </span>

                    </div>

                  </div>

                </div>

              );
            })()}

            {/* Buttons */}
            <div className="flex gap-3 mt-6">

              {/* Cancel */}
              <button
                onClick={cancelDelete}
                className="flex-1 border border-gray-300 py-3 text-sm font-medium cursor-pointer hover:bg-gray-100 transition"
              >
                CANCEL
              </button>

              {/* Remove */}
              <button
                onClick={confirmDelete}
                className="flex-1 bg-black text-white py-3 text-sm font-medium cursor-pointer hover:bg-gray-800 transition"
              >
                REMOVE
              </button>

            </div>

          </div>

        </div>

      )}

    </>
  );
}

export default Cart;