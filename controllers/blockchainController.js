import IdempotencyKey from "../models/IdempotencyKey.js";
import { addJob } from "../utils/jobQueue.js";
import { processBlockchainJob } from "../jobs/blockchainJob.js";
import { logger } from "../utils/logger.js";

export const writeProof = async (req, res) => {
  try {
    const { cid, fileHash } = req.body;
    const idempotencyKey = req.idempotencyKey;

    if (!cid || !fileHash) {
      return res.status(400).json({ msg: "Missing cid or fileHash" });
    }

    // 🔁 Idempotency check
    if (idempotencyKey) {
      const existing = await IdempotencyKey.findOne({ key: idempotencyKey });
      if (existing) {
        return res.status(200).json(existing.response);
      }
    }

    // 🧵 Add blockchain job to queue
    await addJob(processBlockchainJob, {
      cid,
      fileHash,
      userId: req.user.id,
    });

    const response = {
      msg: "Blockchain proof queued",
      status: "PENDING",
    };

    // 💾 Store idempotent response
    if (idempotencyKey) {
      await IdempotencyKey.create({
        key: idempotencyKey,
        endpoint: "POST /api/chain/write",
        response,
      });
    }

    return res.status(202).json(response);
  } catch (err) {
  logger.error(err, "Blockchain controller error");
  res.status(500).json({ error: err.message });
}
};
