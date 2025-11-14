import express from "express";
import multer from "multer";
import { uploadKycDoc } from "../controllers/kycController.js";
import { protect } from "../middleware/authMiddleware.js";
const upload = multer({ dest: "uploads/" });
const router = express.Router();
router.post("/upload", protect, upload.single("file"), uploadKycDoc);
export default router;