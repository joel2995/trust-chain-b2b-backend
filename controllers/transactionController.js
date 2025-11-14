// controllers/transactionController.js

import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import crypto from "crypto";

import { createHold, releaseHold } from "../services/escrowService.js";
import { logEvent } from "../services/eventLogger.js";
import { updateTrustScoreForTransaction } from "../services/trustScoreService.js";
import { storeProofOnChain } from "../services/blockchainService.js";

import { HIGH_VALUE_THRESHOLD } from "../utils/constants.js";

// ----------------------------------------------------
// 1) CREATE NEW TRANSACTION (Buyer → Vendor)
// ----------------------------------------------------
export const createTransaction = async (req, res) => {
  try {
    const buyer = req.user;
    const { vendorId, items } = req.body;

    if (!items?.length)
      return res.status(400).json({ msg: "Items required" });

    const vendor = await User.findById(vendorId);
    if (!vendor)
      return res.status(404).json({ msg: "Vendor not found" });

    const totalAmount = items.reduce(
      (s, it) => s + (it.qty || 1) * (it.price || 0),
      0
    );

    const orderId = `ORD_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const tx = await Transaction.create({
      orderId,
      buyerId: buyer._id,
      vendorId,
      items,
      totalAmount,
      status: "created",
      highValue: totalAmount >= HIGH_VALUE_THRESHOLD,
      meta: {
        deliveryOnTime: true,     // default, adjusted later
        paymentOnTime: true,
        dispute: false
      }
    });

    // Create escrow hold (mock or Razorpay)
    const hold = await createHold({
      transactionId: tx._id,
      amount: totalAmount
    });

    tx.escrow = {
      provider: hold.provider,
      holdId: hold.holdId,
      amountHeld: hold.amountHeld
    };
    await tx.save();

    // Increase buyer transaction count
    buyer.txCounts.buyer += 1;
    await buyer.save();

    await logEvent({
      transactionId: tx._id,
      userId: buyer._id,
      type: "order_created",
      payload: { orderId, totalAmount }
    });

    res.status(201).json({ msg: "Transaction created", tx });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------
// 2) GET ALL TRANSACTIONS
// ----------------------------------------------------
export const getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate("buyerId vendorId");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ----------------------------------------------------
// 3) UPDATE STATUS (accept → shipped → delivered → completed)
// ----------------------------------------------------
export const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tx = await Transaction.findById(req.params.id);

    if (!tx)
      return res.status(404).json({ msg: "Transaction not found" });

    // Update status
    tx.status = status;
    tx.updatedAt = new Date();
    await tx.save();

    await logEvent({
      transactionId: tx._id,
      userId: req.user._id,
      type: "status_changed",
      payload: { status }
    });

    // ------------------------------------------
    // If COMPLETED → trigger trust + escrow logic
    // ------------------------------------------
    if (status === "completed") {

      // 1) Release escrow
      try {
        const release = await releaseHold({ holdId: tx.escrow.holdId });

        tx.escrow.released = release.released;
        tx.escrow.releaseTxId = release.releaseTxId;
        tx.escrow.releasedAt = new Date();
        await tx.save();

      } catch (err) {
        console.warn("Escrow release failed:", err.message);
      }

      // 2) TrustScore module handles scoring algorithm
      try {
        await updateTrustScoreForTransaction(tx);
      } catch (err) {
        console.warn("Trustscore update failed:", err.message);
      }

      // 3) Blockchain write (only HIGH VALUE)
      if (tx.highValue) {
        try {
          const blockchain = await storeProofOnChain({
            cid: tx.ipfs?.invoiceCid || "no_invoice_uploaded",
            fileHash: crypto.randomBytes(16).toString("hex") // placeholder
          });

          tx.blockchain = {
            txHash: blockchain.txHash,
            blockNumber: blockchain.blockNumber,
            chain: "polygon",
            writtenAt: new Date()
          };

          await tx.save();

        } catch (err) {
          console.warn("Blockchain write failed:", err.message);
        }
      }
    }

    res.json({ msg: "Transaction updated", tx });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

