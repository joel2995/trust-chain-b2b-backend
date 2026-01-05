import crypto from "crypto";
import AppError from "../utils/AppError.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import { updateTransactionStatus } from "../services/transactionService.js";
import { applyTrustEvent } from "../services/trustScoreService.js";
import { storeProofOnChain } from "../services/blockchainService.js";

/**
 * Buyer creates transaction (LOCK STOCK)
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

    // 🔒 Lock stock
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

/**
 * Buyer confirms delivery (BLOCKCHAIN PROOF)
 */
export const confirmDelivery = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { deliveryCid } = req.body;

    if (!deliveryCid) {
      throw new AppError("Delivery image CID required", 400);
    }

    const tx = await updateTransactionStatus(transactionId, "DELIVERED");

    // 🔐 Create proof hash
    const deliveryHash = crypto
      .createHash("sha256")
      .update(`${deliveryCid}:${tx._id}`)
      .digest("hex");

    // ⛓️ Store proof on blockchain
    const proof = await storeProofOnChain({
      cid: deliveryCid,
      fileHash: deliveryHash,
    });

    // Save proof in transaction
    tx.deliveryProofHash = proof.proofHash;
    tx.deliveryProofTxHash = proof.txHash;
    await tx.save();

    // TrustScore
    await applyTrustEvent({
      userId: tx.vendorId,
      eventKey: "VENDOR_SUCCESSFUL_DELIVERY",
      referenceId: tx._id.toString(),
    });

    res.json({
      msg: "Delivery confirmed with blockchain proof",
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
      msg: "Escrow released",
      transaction: tx,
    });
  } catch (err) {
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
