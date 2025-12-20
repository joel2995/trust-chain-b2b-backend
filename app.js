// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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
import debugRoutes from "./routes/debugRoutes.js";
import adminAuthRoutes from "./routes/adminAuthRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import trustRoutes from "./routes/trustRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors({
  origin: ["http://localhost:3000"],
  credentials: true
}));

app.use(express.json());

// health
app.get("/", (req, res) => res.json({ status: "TrustChain API up" }));

app.use(helmet());
app.use(morgan("dev"));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));


// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/files", ipfsRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/chain", blockchainRoutes);
app.use("/api/debug", debugRoutes);
app.use("/api/admin/auth", adminAuthRoutes); // public admin auth route (login)
app.use("/api/admin", adminRoutes); // protected admin dashboard routes
app.use("/api/trust", trustRoutes);


// generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
