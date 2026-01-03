import { storeProofOnChain } from "../services/blockchainService.js";

export const processBlockchainJob = async (jobData) => {
  try {
    const { cid, fileHash, userId } = jobData;

    console.log("⛓️ Processing blockchain job for user:", userId);

    const result = await storeProofOnChain({ cid, fileHash });

    console.log("✅ Blockchain job completed:", result);

    return result;
  } catch (err) {
    console.error("❌ Blockchain job failed:", err.message);
    throw err;
  }
};
