import axios from "axios";
import fs from "fs";
import FormData from "form-data";

export const pinFileToPinata = async (filePath) => {
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found for IPFS upload");
  }

  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    data,
    {
      maxBodyLength: Infinity,
      headers: {
        ...data.getHeaders(),
        pinata_api_key: process.env.PINATA_API_KEY,
        pinata_secret_api_key: process.env.PINATA_SECRET_API_KEY,
      },
    }
  );

  return {
    cid: response.data.IpfsHash,
    size: response.data.PinSize,
    timestamp: response.data.Timestamp,
  };
};
