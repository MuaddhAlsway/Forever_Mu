import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

function ProducItem({ id, image, name, price }) {
  const { formatPrice } = useContext(ShopContext);

  return (
    <Link
      className="text-gray-700 cursor-pointer"
      to={`/product/${id}`}
    >

      {/* ================= IMAGE ================= */}

      <div className="overflow-hidden">

        {image?.[0] && (
          <img
            className="w-full hover:scale-110 transition ease-in-out"
            src={image[0]}
            alt={name}
          />
        )}

      </div>

      {/* ================= NAME ================= */}

      <p className="pt-3 pb-1 text-sm">
        {name}
      </p>

      {/* ================= PRICE ================= */}

      <p className="text-sm font-medium">
        {formatPrice(price)}
      </p>

    </Link>
  );
}

export default ProducItem;