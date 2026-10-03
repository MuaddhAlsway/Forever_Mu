import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProducItem from "./ProducItem";

function BestSeller() {
  const { products } = useContext(ShopContext);

  // =========================
  // BEST SELLER PRODUCTS
  // =========================

  const bestSeller = products
    .filter((item) => item.bestseller)
    .slice(0, 5);

  return (
    <div className="my-10">

      {/* ================= TITLE ================= */}

      <div className="text-center text-3xl py-8">

        <Title
          text1="BEST"
          text2="SELLERS"
        />

        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Explore our most loved styles, chosen for their
          quality, comfort, and timeless appeal. Find
          customer favorites made for every occasion.
        </p>

      </div>

      {/* ================= PRODUCTS ================= */}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">

        {bestSeller.map((item) => (

          <ProducItem
            key={item._id}
            id={item._id}
            name={item.name}
            image={item.image}
            price={item.price}
          />

        ))}

      </div>

    </div>
  );
}

export default BestSeller;