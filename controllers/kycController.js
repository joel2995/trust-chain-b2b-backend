import fs from "fs";
import KYC from "../models/KYC.js";
import { pinFileToPinata } from "../config/ipfs.js";

// -------------------------------------
// UPLOAD KYC DOCUMENT
// -------------------------------------
export const uploadKycDoc = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ msg: "No file uploaded" });

    const filePath = req.file.path;
    const pin = await pinFileToPinata(filePath);
    fs.unlinkSync(filePath);

    const cid = pin.IpfsHash;
    const docType = req.body.type || "identity";

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

    res.status(201).json({
  msg: "KYC document uploaded",
  kycId: kyc._id,
  cid,
  status: kyc.status,
});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
