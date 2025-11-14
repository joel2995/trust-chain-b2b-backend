// controllers/blockchainController.js

import { storeProofOnChain } from "../services/blockchainService.js";

export const writeProof = async (req, res) => {
  try {
    const { cid, fileHash } = req.body;

    if (!cid || !fileHash)
      return res.status(400).json({ msg: "CID and fileHash are required" });

    const result = await storeProofOnChain({ cid, fileHash });

    res.json({
      msg: "Proof stored on blockchain",
      result
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
