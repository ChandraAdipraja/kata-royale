import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sambungkata";
  await mongoose.connect(mongoUri);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};
