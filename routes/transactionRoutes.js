import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createTransaction,
  confirmDelivery,
  releaseEscrow,
  raiseDispute,
} from "../controllers/transactionController.js";

const router = express.Router();

// 🔹 BUYER creates transaction
router.post("/", protect, createTransaction);

router.post("/:transactionId/deliver", protect, confirmDelivery);
router.post("/:transactionId/release", protect, releaseEscrow);
router.post("/:transactionId/dispute", protect, raiseDispute);

export default router;
