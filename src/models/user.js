// src/models/user.js
import mongoose from "mongoose";

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  condition: String,
  photoId: String,
  addedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema({
  telegramId: { type: Number, required: true, unique: true },
  username: String,
  books: [bookSchema],
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  language: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const User = mongoose.model("User", userSchema);