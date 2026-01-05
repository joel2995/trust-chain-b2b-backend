import express from "express";
import { getLeaderboard } from "../controllers/leaderboardController.js";

const router = express.Router();

// public / protected optional
router.get("/", getLeaderboard);

export default router;
