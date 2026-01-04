import { updateTransactionStatus } from "../services/transactionService.js";

import { logger } from "../utils/logger.js";
import AppError from "../utils/AppError.js";
import { applyTrustEvent } from "../services/trustScoreService.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
/**
 * Buyer confirms delivery
 */
export const confirmDelivery = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const tx = await updateTransactionStatus(transactionId, "DELIVERED");

    // ✅ TRUSTSCORE UPDATE (STEP 4)
    await applyTrustEvent({
      userId: tx.vendorId,
      eventKey: "VENDOR_SUCCESSFUL_DELIVERY",
      referenceId: tx._id.toString(),
    });

    res.json({
      msg: "Delivery confirmed",
      transaction: tx,
    });
  } catch (err) {
    throw new AppError(err.message, 500);
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
  } 
catch (err) {
  throw new AppError(err.message, 500);
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

    // ✅ TRUSTSCORE UPDATE (STEP 4)
    await applyTrustEvent({
      userId: tx.vendorId,
      eventKey: "VENDOR_DISPUTE_LOST",
      referenceId: tx._id.toString(),
    });

    res.json({
      msg: "Dispute raised",
      transaction: tx,
    });
  } catch (err) {
    throw new AppError(err.message, 500);
  }
};
