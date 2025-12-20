import express from "express";
import multer from "multer";
import { uploadKycDoc } from "../controllers/kycController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", protect, upload.single("file"), uploadKycDoc);

export default router;
