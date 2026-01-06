import express from "express";
import { adminLogin, getCurrentAdmin } from "../controllers/adminAuthController.js"
import { adminProtect } from "../middleware/adminAuthMiddleware.js"

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", adminProtect, getCurrentAdmin)

export default router;
