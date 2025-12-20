import mongoose from "mongoose";

const kycDocSchema = new mongoose.Schema({
  cid: String,
  type: String, // gst, aadhaar, pan, etc.
  uploadedAt: { type: Date, default: Date.now },
});

const kycSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: true,
    },

    docs: [kycDocSchema],

    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },

    reviewReason: String,
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("KYC", kycSchema);
