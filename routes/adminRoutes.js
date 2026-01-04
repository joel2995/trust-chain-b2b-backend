import express from "express";
import { adminProtect } from "../middleware/adminAuthMiddleware.js";
import {
  getAllUsers,
  getPendingKyc,
  getUsersWithPendingKyc,
  approveKyc,
  rejectKyc,
  getAllTransactions,
  getAdminStats,
  getEvents,
  setUserRole,
} from "../controllers/adminController.js";

const router = express.Router();

router.use(adminProtect);

// USERS
router.get("/users", getAllUsers);
router.get("/users/kyc-pending", getUsersWithPendingKyc);

// KYC
router.get("/kyc/pending", getPendingKyc);
router.put("/kyc/approve/:userId", approveKyc);
router.put("/kyc/reject/:userId", rejectKyc);

// OTHER
router.put("/users/:userId/role", setUserRole);
router.get("/transactions", getAllTransactions);
router.get("/stats", getAdminStats);
router.get("/events", getEvents);

export default router;
