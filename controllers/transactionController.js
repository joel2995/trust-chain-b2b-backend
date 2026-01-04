import { updateTransactionStatus } from "../services/transactionService.js";

import { logger } from "../utils/logger.js";
import AppError from "../utils/AppError.js";
import { applyTrustEvent } from "../services/trustScoreService.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
/**
 * Buyer confirms delivery
 */
/**
 * Buyer creates transaction (RESERVES STOCK)
 */
export const createTransaction = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || !quantity || quantity <= 0) {
      throw new AppError("productId and valid quantity required", 400);
    }

    const product = await Product.findById(productId);
    if (!product || !product.active) {
      throw new AppError("Product not available", 404);
    }

    if (product.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    // 🔒 LOCK STOCK
    product.stock -= quantity;
    await product.save();

    const totalAmount = product.price * quantity;

    const tx = await Transaction.create({
      productId,
      buyerId: req.user._id,
      vendorId: product.vendorId,
      quantity,
      amount: totalAmount,
      status: "CREATED",
    });

    res.status(201).json(tx);
  } catch (err) {
    throw new AppError(err.message, 500);
  }
};


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
