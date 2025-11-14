import { ethers } from "ethers";

export const getProviderAndWallet = () => {
  const provider = new ethers.providers.JsonRpcProvider(process.env.POLYGON_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  return { provider, wallet };
};

export const getProofContract = (wallet) => {
  const abi = ["function storeProof(string cid, string fileHash) public"];
  return new ethers.Contract(process.env.PROOF_CONTRACT_ADDRESS, abi, wallet);
};