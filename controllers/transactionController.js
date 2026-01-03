import { updateTransactionStatus } from "../services/transactionService.js";

import { logger } from "../utils/logger.js";
/**
 * Buyer confirms delivery
 */
export const confirmDelivery = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tx = await updateTransactionStatus(transactionId, "DELIVERED");

    res.json({
      msg: "Delivery confirmed",
      transaction: tx,
    });
  } catch (err) {
  logger.error(err, "Transaction state update failed");
  res.status(400).json({ error: err.message });
}
};

/**
 * Admin releases escrow
 */
export const releaseEscrow = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tx = await updateTransactionStatus(transactionId, "RELEASED");

    res.json({
      msg: "Escrow released to vendor",
      transaction: tx,
    });
  } catch (err) {
  logger.error(err, "Transaction state update failed");
  res.status(400).json({ error: err.message });
}
};

/**
 * Buyer raises dispute
 */
export const raiseDispute = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const tx = await updateTransactionStatus(transactionId, "DISPUTED", {
      disputeReason: reason,
    });

    res.json({
      msg: "Dispute raised",
      transaction: tx,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
