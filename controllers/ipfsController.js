import fs from "fs";
import crypto from "crypto";
import { pinFileToPinata } from "../config/ipfs.js";
import Transaction from "../models/Transaction.js";
import { storeProofOnChain } from "../services/blockchainService.js";

// -------------------------------------
// UPLOAD DOCUMENT TO IPFS
// -------------------------------------
export const uploadToIPFS = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ msg: "No file uploaded" });

    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(buffer).digest("hex");

    const pin = await pinFileToPinata(filePath);
    fs.unlinkSync(filePath);

    const cid = pin.IpfsHash;
    const ipfsURL = `https://ipfs.io/ipfs/${cid}`;

    // Attach to transaction (if provided)
    const { transactionId, docType, writeChain } = req.body;

    let chainProof = null;

    if (transactionId) {
      const tx = await Transaction.findById(transactionId);
      if (!tx)
        return res.status(404).json({ msg: "Transaction not found" });

      if (docType === "invoice") tx.ipfs.invoiceCid = cid;
      else tx.ipfs.deliveryProofCid = cid;

      await tx.save();

      // Optional blockchain write (high-value / manual trigger)
      if (writeChain === "true") {
        try {
          chainProof = await storeProofOnChain({ cid, fileHash });
          tx.blockchain = {
            ...tx.blockchain,
            txHash: chainProof.txHash,
            blockNumber: chainProof.blockNumber,
            writtenAt: new Date(),
          };
          await tx.save();
        } catch (err) {
          console.warn("Blockchain write skipped:", err.message);
        }
      }
    }

    res.json({
      msg: "File uploaded to IPFS",
      cid,
      ipfsURL,
      fileHash,
      blockchain: chainProof,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
