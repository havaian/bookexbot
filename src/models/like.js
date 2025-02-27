// src/models/like.js
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  fromUser: { type: Number, required: true }, // telegram_id
  toUser: { type: Number, required: true }, // telegram_id
  action: { type: String, enum: ["like", "skip"], default: "like" }, // Distinguish between likes and skips
  createdAt: { type: Date, default: Date.now },
});

// Index for quick lookups (changed to allow both like and skip actions for the same pair)
likeSchema.index({ fromUser: 1, toUser: 1, action: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);