import express from "express";
import { writeProof } from "../controllers/blockchainController.js";
import { protect } from "../middleware/authMiddleware.js";
import { idempotency } from "../middleware/idempotency.js";

const router = express.Router();

router.post("/write", protect, idempotency, writeProof);

export default router;
