import mongoose from "mongoose";

const historySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role: { type: String, enum: ["buyer", "vendor"] },
  oldScore: Number,
  newScore: Number,
  reason: String,
  txId: { type: mongoose.Schema.Types.ObjectId, ref: "Transaction" },
  timestamp: { type: Date, default: Date.now },
});

export default mongoose.model("TrustScoreHistory", historySchema);