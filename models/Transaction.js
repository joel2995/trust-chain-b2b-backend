import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  vendorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,

  status: {
    type: String,
    enum: [
      "CREATED",
      "PAID",
      "IN_ESCROW",
      "DELIVERED",
      "RELEASED",
      "DISPUTED",
      "REFUNDED",
    ],
    default: "CREATED",
  },
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);
