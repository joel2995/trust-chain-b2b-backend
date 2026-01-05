import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", authLimiter, loginUser);

router.get("/me", protect, (req, res) => {
  res.status(200).json({
    user: req.user
  });
});
export default router;
