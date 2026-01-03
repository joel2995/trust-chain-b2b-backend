import express from "express";
import {
  confirmDelivery,
  releaseEscrow,
  raiseDispute,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/:transactionId/deliver", protect, confirmDelivery);
router.post("/:transactionId/release", protect, releaseEscrow);
router.post("/:transactionId/dispute", protect, raiseDispute);

export default router;
