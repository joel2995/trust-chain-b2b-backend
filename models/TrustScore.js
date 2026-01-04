import mongoose from "mongoose";

const trustHistorySchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ["BUYER", "VENDOR"],
    required: true,
  },
  event: String,
  delta: Number,
  reason: String,
  referenceId: String, // transactionId, disputeId, etc.
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const trustScoreSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true,
  },

  buyerScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },

  vendorScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100,
  },

  history: [trustHistorySchema],
});

export default mongoose.model("TrustScore", trustScoreSchema);
