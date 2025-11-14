import express from "express";
import { writeProof } from "../controllers/blockchainController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.post("/write", protect, writeProof);
export default router;