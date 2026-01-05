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

import { getAdminDashboardSummary } from "../controllers/adminDashboardController.js";
import { getAdminAnalytics } from "../controllers/adminAnalyticsController.js";

const router = express.Router();

router.use(adminProtect);

// USERS
router.get("/users", getAllUsers);
router.get("/users/kyc-pending", getUsersWithPendingKyc);
router.put("/users/:userId/role", setUserRole);

// KYC
router.get("/kyc/pending", getPendingKyc);
router.put("/kyc/approve/:userId", approveKyc);
router.put("/kyc/reject/:userId", rejectKyc);

// TRANSACTIONS
router.get("/transactions", getAllTransactions);

// DASHBOARD & ANALYTICS
router.get("/dashboard/summary", getAdminDashboardSummary);
router.get("/analytics", getAdminAnalytics);

// SYSTEM
router.get("/stats", getAdminStats);
router.get("/events", getEvents);

export default router;
