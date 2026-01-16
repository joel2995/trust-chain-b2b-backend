import fs from "fs";
import crypto from "crypto";
import KYC from "../models/KYC.js";
import User from "../models/User.js";
import { pinFileToPinata } from "../config/ipfs.js";
import { storeProofOnChain } from "../services/blockchainService.js";

export const uploadKycDoc = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized" })
    }
    
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // 1️⃣ Upload to IPFS
    const filePath = req.file.path;
    const pin = await pinFileToPinata(filePath);
    fs.unlinkSync(filePath);

    const cid = pin.cid;
    const docType = req.body.type || "identity";

    // 2️⃣ Hash for blockchain proof
    const fileHash = crypto
      .createHash("sha256")
      .update(cid)
      .digest("hex");

    // 3️⃣ Store proof on blockchain
    const proof = await storeProofOnChain({
      cid,
      fileHash,
    });

    // 4️⃣ Save KYC record
    const kyc = await KYC.findOneAndUpdate(
      { userId: req.user._id },
      {
        $push: {
          docs: {
            cid,
            type: docType,
            uploadedAt: new Date(),
          },
        },
        status: "pending",
      },
      { upsert: true, new: true }
    );

    // 5️⃣ Sync user
    await User.findByIdAndUpdate(req.user._id, {
      kycStatus: "pending",
      kycProofHash: proof.proofHash,
      kycProofTxHash: proof.txHash,
    });

    res.status(201).json({
      msg: "KYC uploaded & blockchain proof stored",
      cid,
      kycId: kyc._id,
      proofHash: proof.proofHash,
      txHash: proof.txHash,
    });
  } catch (err) {
    console.error("uploadKycDoc error:", err);
    res.status(500).json({ error: err.message });
  }
};
