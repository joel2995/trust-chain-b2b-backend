import express from "express";
import { getProfile, updateProfile } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { switchUserRole } from "../controllers/profileController.js";

const router = express.Router();

router.put("/switch-role", protect, switchUserRole);
router.get("/me", protect, getProfile);
router.put("/me", protect, updateProfile);

export default router;
