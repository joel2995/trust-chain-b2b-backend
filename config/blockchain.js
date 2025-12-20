import { ethers } from "ethers";

export const getProviderAndWallet = () => {
  if (!process.env.RPC_URL || !process.env.PRIVATE_KEY) {
    throw new Error("Blockchain env vars missing");
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  return { provider, wallet };
};

export const getProofContract = (wallet) => {
  if (!process.env.PROOF_CONTRACT_ADDRESS) {
    throw new Error("Missing PROOF_CONTRACT_ADDRESS");
  }

  const abi = [
    "function storeProof(string cid, string fileHash) external",
  ];

  return new ethers.Contract(
    process.env.PROOF_CONTRACT_ADDRESS,
    abi,
    wallet
  );
};
