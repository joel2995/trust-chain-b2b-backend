import express from "express";
import { adminProtect } from "../middleware/adminAuthMiddleware.js";
import { recomputeTrustScores } from "../services/trustScoreService.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";

const router = express.Router();

router.use(adminProtect);

// Recompute trust scores
router.post("/recompute", async (req, res) => {
  try {
    const userId = req.query.userId || null;
    const result = await recomputeTrustScores({ userId });
    res.json({ msg: "TrustScore recomputed", result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View trust score history
router.get("/history/:userId", async (req, res) => {
  try {
    const history = await TrustScoreHistory.find({
      userId: req.params.userId,
    })
      .sort({ timestamp: -1 })
      .lean();

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
