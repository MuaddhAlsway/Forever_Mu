import { assets } from "../assets/frontend_assets/assets"

function Footer() {
  return (
    <div>
        <div className="flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm">

                <div >
                    <img className="mb-5 w-32" src={assets.logo
                    } alt="" />
                <p className="w-full md:w-2/3 text-gray-600">
                    Stay connected with our latest collections, exclusive offers, and inspiring fashion updates. Be the first to discover new arrivals, seasonal trends, and special deals carefully selected to elevate your everyday style and shopping experience.

                </p>
                </div>

                <div>
                    <p className="text-xl font-medium mb-5">COMPANY</p>
                    <ul className="flex flex-col gap1 text-gray-600">
                            <li>Home</li>
                            <li>About us</li>
                            <li>Delivery</li>
                            <li>Privacy policy</li>
                    </ul>
                </div>
                <div>
                    <p className="text-xl font-medium mb-5">GET IN TOUCH</p>
                    <ul className="flex flex-col gap1 text-gray-600">
                        <li>+1-212-456-7890</li>
                        <li>contact@foreveryou.com</li>
                    </ul>
                </div>
        </div>

        <div className="">
                <hr />
                <p className="py-5 text-sm text-center">Copyright 2024@ forever.com - All Right Reserved.</p>
                        </div>
    </div>
  )
}
export default Footer