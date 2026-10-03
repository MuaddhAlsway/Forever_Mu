import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  try {
    await mongoose.connect(
      `${process.env.MONGODB_URL}/e-commerce`
    );

    console.log("DB Connected");
  } catch (error) {
    console.error("DB Connection Error:", error);
  }
};

export default connectDB;