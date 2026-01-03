import { ethers } from "ethers";
import { getProviderAndWallet, getProofContract } from "../config/blockchain.js";

export const storeProofOnChain = async ({ cid, fileHash }) => {
  const { wallet } = getProviderAndWallet();
  const contract = getProofContract(wallet);

  const proofHash = ethers.keccak256(
    ethers.toUtf8Bytes(`${cid}:${fileHash}`)
  );

  // ✅ PRE-CHECK
  const exists = await contract.proofs(proofHash);
  if (exists) {
    return {
      alreadyExists: true,
      proofHash,
      contract: process.env.PROOF_CONTRACT_ADDRESS,
    };
  }

  const tx = await contract.storeProof(proofHash);
  const receipt = await tx.wait();

  return {
    alreadyExists: false,
    txHash: receipt.hash,
    blockNumber: receipt.blockNumber,
    proofHash,
    contract: process.env.PROOF_CONTRACT_ADDRESS,
  };
};
