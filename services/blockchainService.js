import { getProviderAndWallet, getProofContract } from "../config/blockchain.js";

export const storeProofOnChain = async ({ cid, fileHash }) => {
  try {
    const { wallet } = getProviderAndWallet();
    const contract = getProofContract(wallet);

    const tx = await contract.storeProof(cid, fileHash);
    const receipt = await tx.wait();

    return { txHash: tx.hash, blockNumber: receipt.blockNumber };

  } catch (err) {
    console.warn("⚠️ Blockchain error:", err.message);
    throw err;
  }
};
