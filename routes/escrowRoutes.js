import express from "express";
import { createEscrowHold, releaseEscrow } from "../controllers/escrowController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/hold", protect, createEscrowHold);
router.post("/release", protect, releaseEscrow);
export default router;