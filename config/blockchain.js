import { ethers } from "ethers";

export const getProviderAndWallet = () => {
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

  if (!rpcUrl || !privateKey) {
    throw new Error("Blockchain env vars missing (RPC / PRIVATE KEY)");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);

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
