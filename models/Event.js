import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
  {
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      index: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },

    type: {
      type: String,
      enum: [
        "ORDER_CREATED",
        "ORDER_ACCEPTED",
        "SHIPPED",
        "DELIVERED",
        "ESCROW_LOCKED",
        "ESCROW_RELEASED",
        "DISPUTE_RAISED",
        "DISPUTE_RESOLVED",
        "KYC_SUBMITTED",
        "KYC_VERIFIED",
        "KYC_REJECTED",
        "TRUST_UPDATED",
      ],
      required: true,
    },

    payload: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model("Event", eventSchema);
