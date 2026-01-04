import fs from "fs";
import KYC from "../models/KYC.js";
import User from "../models/User.js";
import { pinFileToPinata } from "../config/ipfs.js";

export const uploadKycDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    const filePath = req.file.path;
    const pin = await pinFileToPinata(filePath);
    fs.unlinkSync(filePath);

    // ✅ CORRECT CID
    const cid = pin.cid;
    const docType = req.body.type || "identity";

    // ✅ CREATE / UPDATE KYC
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

    // ✅ SYNC USER STATUS (THIS WAS MISSING)
    await User.findByIdAndUpdate(req.user._id, {
      kycStatus: "pending",
    });

    res.status(201).json({
      msg: "KYC document uploaded",
      kycId: kyc._id,
      cid,
      status: kyc.status,
    });
  } catch (err) {
    console.error("uploadKycDoc error:", err);
    res.status(500).json({ error: err.message });
  }
};
