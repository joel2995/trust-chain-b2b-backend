// services/blockchainService.js
import { getProviderAndWallet, getProofContract } from "../config/blockchain.js";

export const storeProofOnChain = async ({ cid, fileHash }) => {
  try {
    const { wallet } = getProviderAndWallet();
    const contract = getProofContract(wallet);

    // Ethereum — ethers v6 syntax
    const tx = await contract.storeProof(cid, fileHash);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber
    };

  } catch (err) {
    console.warn("⚠ Blockchain write failed:", err.message);
    throw err;
  }
};
