// app.js
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";

import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";


import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
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

// health
app.get("/", (req, res) => res.json({ status: "TrustChain API up" }));

app.use(helmet());

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));
app.use(requestLogger);


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/files", ipfsRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/chain", blockchainRoutes);
app.use("/api/admin/auth", adminAuthRoutes); // public admin auth route (login)
app.use("/api/admin", adminRoutes); // protected admin dashboard routes
app.use("/api/trust", trustRoutes);
app.use("/api/products", productRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/health", healthRoutes);

app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(globalErrorHandler);

export default app;
