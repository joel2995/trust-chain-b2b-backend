import express from "express";
import { adminLogin, getCurrentAdmin } from "../controllers/adminAuthController.js"
import { adminProtect } from "../middleware/adminAuthMiddleware.js"

const router = express.Router();

router.post("/login", adminLogin);
router.get("/me", adminProtect, (req, res) => {
  res.json({
    admin: {
      id: req.admin._id,
      name: req.admin.name,
      email: req.admin.email,
      role: "admin",
    },
  });
});

export default router;
