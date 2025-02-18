// src/models/match.js
import mongoose from "mongoose";

const matchSchema = new mongoose.Schema({
  users: [{ type: Number, required: true }], // Array of telegram_ids
  status: {
    type: String,
    enum: ["active", "completed"],
    default: "active",
  },
  createdAt: { type: Date, default: Date.now },
});

// Ensure the same match can't be created twice
matchSchema.index({ users: 1 }, { unique: true });

export const Match = mongoose.model("Match", matchSchema);
