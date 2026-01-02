import express from "express";
import { createEscrowHold } from "../controllers/escrowController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Escrow creation only
router.post("/hold", protect, createEscrowHold);

export default router;
