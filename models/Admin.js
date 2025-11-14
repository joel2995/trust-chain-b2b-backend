// backend/models/Admin.js
import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Administrator" },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    // optional metadata
    createdAt: { type: Date, default: Date.now },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
