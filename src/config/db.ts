//import dns from "node:dns";
import mongoose from "mongoose";
//dns.setServers(["1.1.1.1", "1.0.0.1"]);

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;
