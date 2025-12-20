import express from "express";
import multer from "multer";
import { uploadToIPFS } from "../controllers/ipfsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload", protect, upload.single("file"), uploadToIPFS);

export default router;
