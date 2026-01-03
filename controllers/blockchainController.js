import { storeProofOnChain } from "../services/blockchainService.js";
import IdempotencyKey from "../models/IdempotencyKey.js";

export const writeProof = async (req, res) => {
  try {
    const { cid, fileHash } = req.body;
    const idempotencyKey = req.idempotencyKey; // set by middleware

    if (!cid || !fileHash) {
      return res.status(400).json({ msg: "Missing cid or fileHash" });
    }

    // 🔁 STEP 1: Check idempotency key (if provided)
    if (idempotencyKey) {
      const existing = await IdempotencyKey.findOne({ key: idempotencyKey });

      if (existing) {
        // ✅ Return stored response (no blockchain call)
        return res.status(200).json(existing.response);
      }
    }

    // 🔗 STEP 2: Perform blockchain write
    const result = await storeProofOnChain({ cid, fileHash });

    const responsePayload = result.alreadyExists
      ? {
          msg: "Proof already exists on blockchain",
          proofHash: result.proofHash,
        }
      : {
          msg: "Proof stored on blockchain",
          proof: result,
        };

    // 💾 STEP 3: Store idempotency result (if key provided)
    if (idempotencyKey) {
      await IdempotencyKey.create({
        key: idempotencyKey,
        endpoint: "POST /api/chain/write",
        response: responsePayload,
      });
    }

    return res.status(result.alreadyExists ? 200 : 201).json(responsePayload);

  } catch (err) {
    console.error("Blockchain write error:", err);
    return res.status(500).json({ error: err.message });
  }
};
