import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserAnalytics } from "../controllers/analyticsController.js";

const router = express.Router();

router.get("/me", protect, getUserAnalytics);

export default router;
