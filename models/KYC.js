import mongoose from "mongoose";

const kycDocSchema = new mongoose.Schema({
  cid: { type: String },
  type: { type: String },
  uploadedAt: { type: Date, default: Date.now },
});

const kycSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    docs: [kycDocSchema],
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    reviewedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("KYC", kycSchema);
