import express from "express";
import { adminProtect } from "../middleware/adminAuthMiddleware.js";
import {
  getAllUsers,
  getPendingKyc,
  approveKyc,
  rejectKyc,
  getAllTransactions,
  getAdminStats,
  getEvents,
  setUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

// Admin protected routes
router.use(adminProtect);

router.get("/users", getAllUsers);
router.get("/kyc/pending", getPendingKyc);
router.put("/kyc/approve/:userId", approveKyc);
router.put("/kyc/reject/:userId", rejectKyc);
router.put("/users/:userId/role", setUserRole);

router.get("/transactions", getAllTransactions);
router.get("/stats", getAdminStats);
router.get("/events", getEvents);

export default router;
