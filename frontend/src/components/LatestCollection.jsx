import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";
import ProducItem from "./ProducItem";

function LatestCollection() {
  const { products } = useContext(ShopContext);

  // =========================
  // LATEST 10 PRODUCTS
  // =========================

  const latestProducts = [...products]
    .sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, 10);

  return (
    <div className="my-10">

      {/* ================= TITLE ================= */}

      <div className="text-center py-8 text-3xl">

        <Title
          text1="LATEST"
          text2="COLLECTIONS"
        />

        <p className="w-3/4 m-auto text-xs sm:text-sm md:text-base text-gray-600">
          Discover quality fashion designed for everyday
          comfort and timeless style. Find pieces made to
          fit your lifestyle perfectly.
        </p>

      </div>

      {/* ================= PRODUCTS ================= */}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">

        {latestProducts.map((item) => (

          <ProducItem
            key={item._id}
            id={item._id}
            image={item.image}
            name={item.name}
            price={item.price}
          />

        ))}

      </div>

    </div>
  );
}

export default LatestCollection;