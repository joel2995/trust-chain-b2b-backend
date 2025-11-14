import mongoose from "mongoose";

const proofSchema = new mongoose.Schema({
  cid: { type: String, required: true },
  url: { type: String, required: true },
  type: { type: String, enum: ["invoice", "delivery"], default: "delivery" },
  uploadedAt: { type: Date, default: Date.now },
  fileHash: String,
});

const itemSchema = new mongoose.Schema({
  sku: String,
  name: String,
  qty: Number,
  price: Number,
});

const transactionSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  buyerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [itemSchema],
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "accepted", "shipped", "delivered", "completed", "cancelled", "disputed"], default: "created" },
  escrow: {
    provider: { type: String, default: "mock" },
    holdId: String,
    amountHeld: Number,
    released: { type: Boolean, default: false },
    releaseTxId: String,
    releasedAt: Date,
  },
  highValue: { type: Boolean, default: false },
  ipfs: {
    invoiceCid: String,
    deliveryProofCid: String,
  },
  blockchain: {
    txHash: String,
    blockNumber: Number,
    chain: String,
    writtenAt: Date,
  },
}, { timestamps: true });

export default mongoose.model("Transaction", transactionSchema);