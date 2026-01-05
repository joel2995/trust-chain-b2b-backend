import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
  {
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
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },

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

    // 🔐 Delivery proof
    deliveryProofHash: String,
    deliveryProofTxHash: String,
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
