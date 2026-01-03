import { getProviderAndWallet, getProofContract } from "../config/blockchain.js";

export const storeProofOnChain = async ({ cid, fileHash }) => {
  try {
    const { wallet } = getProviderAndWallet();
    const contract = getProofContract(wallet);

    const tx = await contract.storeProof(cid, fileHash);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      contract: process.env.PROOF_CONTRACT_ADDRESS,
      network: process.env.BLOCKCHAIN_NETWORK || "sepolia",
      writtenAt: new Date(),
    };
  } catch (err) {
    console.error("⚠ Blockchain write failed:", err.message);
    throw err;
  }
};
