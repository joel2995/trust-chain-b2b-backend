import mongoose from "mongoose";

const userEventSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Short highlight title
    title: {
      type: String,
      required: true,
    },

    // Small description shown in UI
    description: {
      type: String,
      required: true,
    },

    // buyer / vendor
    mode: {
      type: String,
      enum: ["buyer", "vendor"],
      required: true,
    },

    // category (helps filtering later)
    type: {
      type: String,
      enum: [
        "auth",
        "profile",
        "kyc",
        "payment",
        "escrow",
        "role",
        "system",
      ],
      default: "system",
    },
  },
  {
    timestamps: true, // createdAt used as event time
  }
);

export default mongoose.model("UserEvent", userEventSchema);
