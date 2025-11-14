import express from "express";
import TrustScoreHistory from "../models/TrustScoreHistory.js";
import Event from "../models/Event.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get trust score history for a user
router.get("/trustscore-history/:userId", protect, async (req, res) => {
  try {
    const history = await TrustScoreHistory.find({ userId: req.params.userId });
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all system events
router.get("/events", protect, async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
