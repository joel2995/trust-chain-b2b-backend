import express from "express";
import {
  createTransaction,
  updateTransactionStatus,
} from "../controllers/transactionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, createTransaction);
router.put("/:id/status", protect, updateTransactionStatus);

export default router;
