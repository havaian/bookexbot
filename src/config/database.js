// src/config/database.js
import mongoose from "mongoose";

export const connectDB = async (uri) => {
  try {
    await mongoose.connect(uri);
    global.app.logger.info("✅ Connected to MongoDB");
  } catch (error) {
    global.app.logger.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
