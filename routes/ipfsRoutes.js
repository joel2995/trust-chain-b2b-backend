import express from "express";
import multer from "multer";
import { uploadToIPFS } from "../controllers/ipfsController.js";
import { protect } from "../middleware/authMiddleware.js";
const upload = multer({ dest: "uploads/" });
const router = express.Router();
router.post("/upload", protect, upload.single("file"), uploadToIPFS);
export default router;