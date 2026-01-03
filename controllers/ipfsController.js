import crypto from "crypto";
import fs from "fs";
import { pinFileToPinata } from "../config/ipfs.js";

export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "No file uploaded" });
    }

    // 1️⃣ Compute file hash
    const buffer = fs.readFileSync(req.file.path);
    const fileHash = crypto
      .createHash("sha256")
      .update(buffer)
      .digest("hex");

    // 2️⃣ Upload to IPFS
    const pinataRes = await pinFileToPinata(req.file.path);

    // ✅ CORRECT FIELD
    const cid = pinataRes.cid;

    if (!cid) {
      throw new Error("CID not returned from Pinata");
    }

    // 3️⃣ Cleanup temp file
    fs.unlinkSync(req.file.path);

    res.json({
      msg: "File uploaded to IPFS",
      cid,
      ipfsURL: `https://ipfs.io/ipfs/${cid}`,
      fileHash,
      blockchain: null,
    });
  } catch (err) {
    console.error("IPFS upload failed:", err);
    res.status(500).json({ error: "IPFS upload failed" });
  }
};
