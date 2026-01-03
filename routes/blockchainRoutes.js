import express from "express";
import { writeProof } from "../controllers/blockchainController.js";
import { protect } from "../middleware/authMiddleware.js";
import { idempotency } from "../middleware/idempotency.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { writeProofSchema } from "../validators/blockchain.validator.js";

const router = express.Router();

router.post(
  "/write",
  protect,
  idempotency,
  validateRequest(writeProofSchema),
  writeProof
);

export default router;
