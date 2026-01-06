import express from "express";
import {
  getProfile,
  updateProfile,
  switchUserRole,
} from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import UserEvent from "../models/UserEvent.js";

const router = express.Router();

router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
router.put("/switch-role", protect, switchUserRole);

// 🔥 EVENTS API (for dashboard & profile)
router.get("/events", protect, async (req, res) => {
  const events = await UserEvent.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(20);

  res.json({ events });
});

export default router;
