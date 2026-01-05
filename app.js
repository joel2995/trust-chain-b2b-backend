import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import userKycRoutes from "./routes/userKycRoutes.js";      // ✅ NEW
import transactionRoutes from "./routes/transactionRoutes.js";
import ipfsRoutes from "./routes/ipfsRoutes.js";
import escrowRoutes from "./routes/escrowRoutes.js";
import blockchainRoutes from "./routes/blockchainRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import trustRoutes from "./routes/trustRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js"; // ✅ NEW
import healthRoutes from "./routes/healthRoutes.js";

import { requestLogger } from "./middleware/requestLogger.js";
import { globalErrorHandler } from "./middleware/errorHandler.js";
import AppError from "./utils/AppError.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}));

app.use(express.json());

// root health
app.get("/", (req, res) => res.json({ status: "TrustChain API up" }));

app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

app.use(requestLogger);

// --------------------
// API ROUTES
// --------------------
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);

// KYC
app.use("/api/kyc", kycRoutes);        // upload docs
app.use("/api/kyc", userKycRoutes);    // GET /kyc/me

// Core
app.use("/api/transactions", transactionRoutes);
app.use("/api/files", ipfsRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/chain", blockchainRoutes);
app.use("/api/payments", paymentRoutes);

// Products & Trust
app.use("/api/products", productRoutes);
app.use("/api/trust", trustRoutes);

// User dashboards
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

// Leaderboard (public / optional protect)
app.use("/api/leaderboard", leaderboardRoutes);

// Admin
app.use("/api/admin/auth", adminAuthRoutes);
app.use("/api/admin", adminRoutes);

// Health
app.use("/health", healthRoutes);

// --------------------
// 404 HANDLER
// --------------------
app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

// --------------------
// GLOBAL ERROR HANDLER
// --------------------
app.use(globalErrorHandler);

export default app;
