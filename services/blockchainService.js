import { ethers } from "ethers";
import { getProviderAndWallet, getProofContract } from "../config/blockchain.js";

export const storeProofOnChain = async ({ cid, fileHash }) => {
  try {
    const { wallet } = getProviderAndWallet();
    const contract = getProofContract(wallet);

    // 🔐 Create a bytes32 hash (matches Solidity)
    const proofHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${cid}:${fileHash}`)
    );

    const tx = await contract.storeProof(proofHash);
    const receipt = await tx.wait();

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      proofHash,
      contract: process.env.PROOF_CONTRACT_ADDRESS,
      network: process.env.BLOCKCHAIN_NETWORK,
      writtenAt: new Date(),
    };
  } catch (err) {
    console.error("⚠ Blockchain write failed:", err.message);
    throw err;
  }
};
