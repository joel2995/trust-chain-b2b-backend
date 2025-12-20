import mongoose from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, default: "Administrator" },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },

    lastLoginAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Admin", adminSchema);
