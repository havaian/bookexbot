// src/models/like.js
import mongoose from "mongoose";

const likeSchema = new mongoose.Schema({
  fromUser: { type: Number, required: true }, // telegram_id
  toUser: { type: Number, required: true }, // telegram_id
  createdAt: { type: Date, default: Date.now },
});

// Index for quick lookups
likeSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

export const Like = mongoose.model("Like", likeSchema);
