import { logger } from "../utils/logger.js";
import { storeProofOnChain } from "../services/blockchainService.js";

export const processBlockchainJob = async (jobData) => {
  try {
    logger.info({ jobData }, "Blockchain job started");

    const result = await storeProofOnChain(jobData);

    logger.info({ result }, "Blockchain job completed");
    return result;
  } catch (err) {
    logger.error(err, "Blockchain job failed");
    throw err;
  }
};
