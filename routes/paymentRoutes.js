import express from "express";
import {
  createPaymentOrder,
  verifyPayment,
} from "../controllers/paymentController.js";
import { protect } from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// 🔐 Create Razorpay order (rate-limited)
router.post(
  "/create-order",
  protect,
  paymentLimiter,
  createPaymentOrder
);

// 🔐 Verify payment (rate-limited)
router.post(
  "/verify",
  protect,
  paymentLimiter,
  verifyPayment
);

export default router;
