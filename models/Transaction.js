import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  sku: String,
  name: String,
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
});

const transactionSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true },

    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [itemSchema],

    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },

    /* ---------------- TRANSACTION STATUS ---------------- */
    status: {
      type: String,
      enum: [
        "created",
        "accepted",
        "shipped",
        "delivered",
        "completed",
        "cancelled",
        "disputed",
      ],
      default: "created",
      index: true,
    },

    /* ---------------- PAYMENT (RAZORPAY) ---------------- */
    payment: {
      provider: {
        type: String,
        enum: ["razorpay"],
        default: "razorpay",
      },
      orderId: String,      // Razorpay order_id
      paymentId: String,   // Razorpay payment_id
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
      paidAt: Date,
    },

    /* ---------------- ESCROW ---------------- */
    escrow: {
      provider: {
        type: String,
        enum: ["mock", "razorpay", "blockchain"],
        default: "mock",
      },
      holdId: String,
      amountHeld: Number,
      released: { type: Boolean, default: false },
      releaseTxId: String,
      releasedAt: Date,
    },

    /* ---------------- TRUST ---------------- */
    trustImpact: {
      buyerDelta: { type: Number, default: 0 },
      vendorDelta: { type: Number, default: 0 },
    },

    highValue: { type: Boolean, default: false },

    /* ---------------- IPFS ---------------- */
    ipfs: {
      invoiceCid: String,
      deliveryProofCid: String,
    },

    /* ---------------- BLOCKCHAIN ---------------- */
    blockchain: {
      txHash: String,
      blockNumber: Number,
      chain: String,
      writtenAt: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", transactionSchema);
