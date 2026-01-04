import express from "express";
import TrustScore from "../models/TrustScore.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:userId", protect, async (req, res) => {
  const trust = await TrustScore.findOne({ userId: req.params.userId });

  res.json(
    trust || {
      buyerScore: 100,
      vendorScore: 100,
      history: [],
    }
  );
});

export default router;
