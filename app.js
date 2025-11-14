// app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import kycRoutes from "./routes/kycRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import ipfsRoutes from "./routes/ipfsRoutes.js";
import escrowRoutes from "./routes/escrowRoutes.js";
import blockchainRoutes from "./routes/blockchainRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";


dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/", (req, res) => res.json({ status: "TrustChain API up" }));

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/files", ipfsRoutes);
app.use("/api/escrow", escrowRoutes);
app.use("/api/chain", blockchainRoutes);
app.use("/api/debug", debugRoutes);


// generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error" });
});

export default app;
