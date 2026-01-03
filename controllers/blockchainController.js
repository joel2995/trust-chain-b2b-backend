export const writeProof = async (req, res) => {
  const { cid, fileHash } = req.body;
  if (!cid || !fileHash) {
    return res.status(400).json({ msg: "Missing cid or fileHash" });
  }

  const result = await storeProofOnChain({ cid, fileHash });

  if (result.alreadyExists) {
    return res.status(200).json({
      msg: "Proof already exists on blockchain",
      proofHash: result.proofHash,
    });
  }

  res.status(201).json({
    msg: "Proof stored on blockchain",
    proof: result,
  });
};
