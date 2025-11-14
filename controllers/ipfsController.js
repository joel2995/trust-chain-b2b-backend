import fs from "fs";
import { pinFileToPinata } from "../config/ipfs.js";
import Transaction from "../models/Transaction.js";
import { storeProofOnChain } from "../services/blockchainService.js";
import crypto from "crypto";


export const uploadToIPFS = async (req, res) => {
try {
if (!req.file) return res.status(400).json({ error: "No file provided" });


const filePath = req.file.path;
const pin = await pinFileToPinata(filePath);
const fileBuffer = fs.readFileSync(filePath);
const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
fs.unlinkSync(filePath);


const fileCID = pin.IpfsHash;
const ipfsURL = `https://ipfs.io/ipfs/${fileCID}`;


// attach to transaction if provided
const { transactionId, type } = req.body;
if (transactionId) {
await Transaction.findByIdAndUpdate(transactionId, { $push: { proofs: { cid: fileCID, url: ipfsURL, type: type || "delivery", fileHash } } });
}


// store on chain for high-value transactions
try {
if (req.body.writeChain === "true") {
const result = await storeProofOnChain({ cid: fileCID, fileHash });
return res.json({ msg: "Uploaded & stored on chain", fileCID, ipfsURL, fileHash, chainTx: result });
}
} catch (err) {
console.warn("Chain write failed:", err.message);
}


res.json({ msg: "Uploaded to IPFS", fileCID, ipfsURL, fileHash });
} catch (err) {
console.error(err);
res.status(500).json({ error: err.message });
}
};