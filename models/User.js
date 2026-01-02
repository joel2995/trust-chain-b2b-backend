import mongoose from "mongoose";

const profileSchema = new mongoose.Schema({
  companyName: String,
  businessType: {
    type: String,
    enum: ["manufacturer", "trader", "service"],
  },
  addressLine1: String,
  addressLine2: String,
  city: String,
  state: String,
  pin: String,
  gstNumber: String,
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },

    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    phone: String,

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    profile: profileSchema,

    // 🔧 FIXED: roleMode → role
    role: {
      type: String,
      enum: ["buyer", "vendor"],
      default: "vendor",
    },

    walletAddress: String,

    kycStatus: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    buyerTrustScore: { type: Number, default: 100 },
    vendorTrustScore: { type: Number, default: 100 },
    overallTrustScore: { type: Number, default: 100 },

    txCounts: {
      buyer: { type: Number, default: 0 },
      vendor: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
