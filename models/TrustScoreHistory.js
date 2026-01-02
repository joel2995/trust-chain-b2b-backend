import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  role: {
    type: String,
    enum: ["buyer", "vendor"],
    required: true,
  },

  oldScore: { type: Number, required: true },
  newScore: { type: Number, required: true },

  reason: {
    type: String,
    enum: [
      "transaction_completed",
      "on_time_delivery",
      "late_delivery",
      "payment_success",
      "payment_failed",
      "dispute",
      "manual_adjustment",
    ],
    required: true,
  },

  txId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },

  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("TrustScoreHistory", historySchema);
