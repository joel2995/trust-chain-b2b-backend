import mongoose from "mongoose";

const idempotencyKeySchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
  },
  endpoint: {
    type: String,
    required: true,
  },
  response: {
    type: Object,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 60 * 60 * 24, // ⏱️ auto delete after 24 hours
  },
});

export default mongoose.model("IdempotencyKey", idempotencyKeySchema);
