import express from "express";
import mongoose from "mongoose";
import { getQueueStatus } from "../utils/jobQueue.js";

const router = express.Router();

router.get("/health", async (req, res) => {
  const dbState = mongoose.connection.readyState;

  const dbStatus =
    dbState === 1 ? "UP" :
    dbState === 2 ? "CONNECTING" :
    "DOWN";

  res.status(200).json({
    status: "OK",
    service: "TrustChain Backend",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    queue: getQueueStatus(),
  });
});

export default router;
