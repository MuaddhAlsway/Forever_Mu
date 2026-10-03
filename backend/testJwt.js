import "dotenv/config";
import jwt from "jsonwebtoken";

console.log(
  "JWT SECRET LOADED:",
  !!process.env.JWT_SECRET
);

console.log(
  "JWT SECRET LENGTH:",
  process.env.JWT_SECRET?.length
);

const token = jwt.sign(
  "admin-test",
  process.env.JWT_SECRET
);

console.log("NEW TOKEN:", token);

try {

  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET
  );

  console.log("VERIFY SUCCESS:", decoded);

} catch (error) {

  console.log("VERIFY FAILED:", error.message);

}