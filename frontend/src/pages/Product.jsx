import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/frontend_assets/assets";

function Product() {
  const { productId } = useParams();

  const {
    products,
    formatPrice,
    addToCart
  } = useContext(ShopContext);

  const [productData, setProductData] = useState(false);
  const [image, setImage] = useState("");
  const [size, setSize] = useState("");

  // =========================
  // FIND PRODUCT
  // =========================
  const fetchProductData = () => {
    const product = products.find(
      (item) => item._id === productId
    );

    if (product) {
      setProductData(product);
      setImage(product.image[0]);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [productId, products]);

  // =========================
  // PRODUCT NOT FOUND YET
  // =========================
  if (!productData) {
    return <div className="opacity-0"></div>;
  }

  return (
    <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">

      {/* ================= PRODUCT DATA ================= */}
      <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">

        {/* ================= PRODUCT IMAGES ================= */}
        <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">

          {/* Thumbnail Images */}
          <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll scrollbar-hide justify-between sm:justify-normal sm:w-[18.7%] w-full">

            {productData.image.map((item, index) => (
              <img
                key={index}
                onClick={() => setImage(item)}
                src={item}
                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer"
                alt={`${productData.name} ${index + 1}`}
              />
            ))}

          </div>

          {/* Main Image */}
          <div className="w-full sm:w-[80%]">
            <img
              className="w-full h-auto"
              src={image}
              alt={productData.name}
            />
          </div>

        </div>

        {/* ================= PRODUCT INFORMATION ================= */}
        <div className="flex-1">

          {/* Product Name */}
          <h1 className="font-medium text-2xl mt-2">
            {productData.name}
          </h1>

          {/* ================= RATING ================= */}
          <div className="flex items-center gap-1 mt-2">

            <img
              src={assets.star_icon}
              className="w-3.5"
              alt="star"
            />

            <img
              src={assets.star_icon}
              className="w-3.5"
              alt="star"
            />

            <img
              src={assets.star_icon}
              className="w-3.5"
              alt="star"
            />

            <img
              src={assets.star_icon}
              className="w-3.5"
              alt="star"
            />

            <img
              src={assets.star_dull_icon}
              className="w-3.5"
              alt="star"
            />

            <p className="pl-2">
              (122)
            </p>

          </div>

          {/* ================= PRICE ================= */}
          <p className="mt-5 text-3xl font-medium">
            {formatPrice(
              productData.price
            )}
          </p>

          {/* ================= DESCRIPTION ================= */}
          <p className="mt-5 text-gray-500 md:w-4/5">
            {productData.description}
          </p>

          {/* ================= SIZE ================= */}
          <div className="flex flex-col gap-4 my-8">

            <p>
              Select Size
            </p>

            <div className="flex gap-2">

              {productData.sizes.map((item, index) => (
                <button
                  key={index}
                  onClick={() => setSize(item)}
                  className={`border py-2 px-4 bg-gray-100 cursor-pointer ${
                    item === size
                      ? "border-orange-500"
                      : ""
                  }`}
                >
                  {item}
                </button>
              ))}

            </div>

          </div>

          {/* ================= ADD TO CART ================= */}
          <button
            onClick={() =>
              addToCart(productData._id, size)
            }
            className="bg-black text-white px-8 py-3 text-sm active:bg-gray-700 cursor-pointer"
          >
            ADD TO CART
          </button>

          <hr className="mt-8 sm:w-4/5" />

          {/* ================= PRODUCT INFO ================= */}
          <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">

            <p>
              100% Original product.
            </p>

            <p>
              Cash on delivery is available on this product.
            </p>

            <p>
              Easy return and exchange policy within 7 days.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Product;