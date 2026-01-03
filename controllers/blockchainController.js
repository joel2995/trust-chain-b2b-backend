import { storeProofOnChain } from "../services/blockchainService.js";

export const writeProof = async (req, res) => {
  try {
    const { cid, fileHash } = req.body;

    if (!cid || !fileHash) {
      return res.status(400).json({ msg: "Missing cid or fileHash" });
    }

    const proof = await storeProofOnChain({ cid, fileHash });

    res.status(200).json({
      msg: "Stored on blockchain",
      proof,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
