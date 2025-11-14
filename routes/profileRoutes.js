import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);
export default router;