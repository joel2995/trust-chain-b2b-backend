import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
  },

  role: {
    type: String,
    enum: ["buyer", "vendor"],
    required: true,
  },

  oldScore: Number,
  newScore: Number,

  reason: {
    type: String,
    enum: [
      "ON_TIME_DELIVERY",
      "PAYMENT_DELAY",
      "DISPUTE_RAISED",
      "DISPUTE_RESOLVED",
      "ESCROW_SUCCESS",
      "ESCROW_FAILURE",
      "ADMIN_ADJUSTMENT",
    ],
  },

  txId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Transaction",
  },

  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("TrustScoreHistory", historySchema);
