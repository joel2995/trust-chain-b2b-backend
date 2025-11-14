import KYC from "../models/KYC.js";
import { pinFileToPinata } from "../config/ipfs.js";
import fs from "fs";

export const uploadKycDoc = async (req, res) => {
  try {
    
    if (!req.file) return res.status(400).json({ error: "No file provided" });

    const filePath = req.file.path;

    const pin = await pinFileToPinata(filePath);
    fs.unlinkSync(filePath);

    const cid = pin.IpfsHash;
    console.log("Using KYC model on collection:", KYC.collection.name);

    const kyc = await KYC.findOneAndUpdate(
      { userId: req.user._id },
      {
        $push: { docs: { cid, type: req.body.type, uploadedAt: new Date() } },
        $set: { status: "pending" }
      },
      { upsert: true, new: true }
    );

    res.json({ msg: "KYC uploaded", cid });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
