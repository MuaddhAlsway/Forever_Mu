import Title from "../components/Title";
import { assets } from "../assets/frontend_assets/assets";

function About() {
  return (
    <div>

      {/* ================= TITLE ================= */}
      <div className="text-2xl text-center pt-8 border-t">
        <Title text1="ABOUT" text2="US" />
      </div>

      {/* ================= ABOUT SECTION ================= */}
      <div className="my-10 flex flex-col md:flex-row gap-16">

        {/* About Image */}
        <img
          className="w-full md:max-w-[450px]"
          src={assets.about_img}
          alt="About Forever"
        />

        {/* About Content */}
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-gray-600">

          <p>
            Forever was born out of a passion for innovation
            and a desire to revolutionize the way people shop
            online. Our journey began with a simple idea: to
            provide a platform where customers can easily
            discover, explore, and purchase products they love.
          </p>

          <p>
            Since our beginning, we have worked continuously
            to offer high-quality products, competitive prices,
            and a smooth shopping experience. From browsing
            our collections to receiving your order, we aim to
            make every step simple and enjoyable.
          </p>

          <b className="text-gray-800">
            Our Mission
          </b>

          <p>
            Our mission at Forever is to provide customers
            with quality products, fair prices, and a fast,
            reliable shopping experience. We want Forever to
            become a trusted destination that customers return
            to whenever they shop online.
          </p>

        </div>

      </div>

      {/* ================= WHY CHOOSE US ================= */}
      <div className="text-xl py-4">
        <Title text1="WHY" text2="CHOOSE US" />
      </div>

      <div className="flex flex-col md:flex-row text-sm mb-20">

        {/* Quality */}
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">

          <b>
            Quality Assurance
          </b>

          <p className="text-gray-600">
            We carefully select and verify our products to
            ensure they meet our quality standards.
          </p>

        </div>

        {/* Convenience */}
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">

          <b>
            Convenience
          </b>

          <p className="text-gray-600">
            Our store is designed to make finding, choosing,
            and purchasing products simple and convenient.
          </p>

        </div>

        {/* Customer Service */}
        <div className="border px-10 md:px-16 py-8 sm:py-20 flex flex-col gap-5">

          <b>
            Exceptional Customer Service
          </b>

          <p className="text-gray-600">
            Our team is committed to helping customers and
            providing a reliable experience before and after
            every purchase.
          </p>

        </div>

      </div>

    </div>
  );
}

export default About;