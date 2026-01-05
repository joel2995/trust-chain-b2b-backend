import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getMyKycStatus } from "../controllers/userKycController.js";

const router = express.Router();

router.get("/me", protect, getMyKycStatus);

export default router;
