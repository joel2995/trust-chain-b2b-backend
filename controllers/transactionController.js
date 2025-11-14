// controllers/transactionController.js

import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import crypto from "crypto";
import { createHold, releaseHold } from "../services/escrowService.js";
import { logEvent } from "../services/eventLogger.js";
import { updateTrustScores } from "../services/trustScoreService.js";
import { storeProofOnChain } from "../services/blockchainService.js";
import { HIGH_VALUE_THRESHOLD } from "../utils/constants.js";

// -------------------------------------------
// Create New Transaction (Buyer -> Vendor)
// -------------------------------------------
export const createTransaction = async (req, res) => {
  try {
    const buyer = req.user;

    if (!buyer.profile || !buyer.profile.addressLine1)
      return res.status(400).json({ msg: "Complete profile to create orders" });

    const { vendorId, items } = req.body;

    const vendor = await User.findById(vendorId);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

    const totalAmount = items.reduce(
      (s, it) => s + (it.qty || 1) * (it.price || 0),
      0
    );

    const orderId = `ORD_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`;

    const tx = await Transaction.create({
      orderId,
      buyerId: buyer._id,
      vendorId: vendor._id,
      items,
      totalAmount,
      highValue: totalAmount >= HIGH_VALUE_THRESHOLD
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

    // Update transaction count for buyer
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

// -------------------------------------------
// Get All Transactions (admin/debug)
// -------------------------------------------
export const getTransactions = async (req, res) => {
  try {
    const txs = await Transaction.find().populate("buyerId vendorId");
    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------
// Update Transaction Status
// -------------------------------------------
export const updateTransactionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    tx.status = status;
    await tx.save();

    await logEvent({
      transactionId: tx._id,
      userId: req.user._id,
      type: "status_changed",
      payload: { status }
    });

    // ---------------------------------------
    // If status is COMPLETED
    // ---------------------------------------
    if (status === "completed") {
      // 1) Release escrow
      try {
        const rel = await releaseHold({ holdId: tx.escrow.holdId });
        tx.escrow.released = rel.released;
        tx.escrow.releaseTxId = rel.releaseTxId;
        tx.escrow.releasedAt = new Date();
      } catch (err) {
        console.warn("Escrow release failed:", err.message);
      }

      await tx.save();

      // 2) TrustScore updates
      const buyer = await User.findById(tx.buyerId);
      const vendor = await User.findById(tx.vendorId);

      const buyerNew = buyer.buyerTrustScore + 2;
      const vendorNew = vendor.vendorTrustScore + 2;

      await updateTrustScores({
        userId: buyer._id,
        role: "buyer",
        oldScore: buyer.buyerTrustScore,
        newScore: buyerNew,
        reason: "completed_transaction",
        txId: tx._id
      });

      await updateTrustScores({
        userId: vendor._id,
        role: "vendor",
        oldScore: vendor.vendorTrustScore,
        newScore: vendorNew,
        reason: "completed_transaction",
        txId: tx._id
      });

      // 3) Blockchain store (ONLY if high-value)
      if (tx.highValue) {
        try {
          const result = await storeProofOnChain({
            cid: tx?.ipfs?.invoiceCid || "no_cid_uploaded",
            fileHash: crypto.randomBytes(16).toString("hex") // placeholder
          });

          tx.blockchain = {
            txHash: result.txHash,
            blockNumber: result.blockNumber,
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
