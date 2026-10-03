import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

// The database name is overridable so an automated
// test can run against its own throwaway database
// instead of the live one. Unset, it is exactly the
// name this project has always used.
const getDbName = () => {
  const override = (
    process.env.MONGODB_DB_NAME || ""
  ).trim();

  return override || "e-commerce";
};

const connectDB = async () => {
  try {
    await mongoose.connect(
      `${process.env.MONGODB_URL}/${getDbName()}`
    );

    console.log(
      `DB Connected (${getDbName()})`
    );
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
};

export default connectDB;