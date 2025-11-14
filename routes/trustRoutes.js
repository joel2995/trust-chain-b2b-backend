// backend/routes/trustRoutes.js
import express from "express";
import { adminProtect } from "../middleware/adminAuthMiddleware.js"; // or your admin auth middleware
import { recomputeTrustScores } from "../services/trustScoreService.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";

const router = express.Router();

// POST /api/trust/recompute?userId=...
router.post("/recompute", adminProtect, async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const result = await recomputeTrustScores({ userId });
    res.json({ msg: "Recompute started", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/trust/history/:userId
router.get("/history/:userId", adminProtect, async (req, res) => {
  try {
    const list = await TrustScoreHistory.find({ userId: req.params.userId }).sort({ timestamp: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
