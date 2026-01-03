import express from "express";
import mongoose from "mongoose";
import { getQueueStatus } from "../utils/jobQueue.js";

const router = express.Router();

router.get("/", (req, res) => {
  const dbState = mongoose.connection.readyState;

  res.status(200).json({
    status: "OK",
    service: "TrustChain Backend",
    uptime: process.uptime(),
    database: dbState === 1 ? "UP" : "DOWN",
    queue: getQueueStatus(),
    timestamp: new Date().toISOString(),
  });
});

export default router;
