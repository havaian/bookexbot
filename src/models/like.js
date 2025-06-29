// src/models/like.js
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  fromUser: { type: Number, required: true }, // telegram_id
  toUser: { type: Number, required: true }, // telegram_id
  isSkip: { type: Boolean, default: false }, // Flag to mark skips
  createdAt: { type: Date, default: Date.now },
});

// Keep the same index structure for backward compatibility
likeSchema.index({ fromUser: 1, toUser: 1 });

export const Like = mongoose.model("Like", likeSchema);