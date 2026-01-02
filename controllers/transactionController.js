import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import crypto from "crypto";
import { releaseHold } from "../services/escrowService.js";
import { updateTrustScoreForTransaction } from "../services/trustScoreService.js";
import { logEvent } from "../services/eventLogger.js";
import { HIGH_VALUE_THRESHOLD } from "../utils/constants.js";

// Allowed status transitions
const STATUS_FLOW = {
  created: ["accepted", "cancelled"],
  accepted: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["completed", "disputed"],
};

export const createTransaction = async (req, res) => {
  try {
    const buyer = req.user;
    const { vendorId, items } = req.body;

    if (buyer.role !== "buyer") {
      return res.status(403).json({ msg: "Only buyers can create transactions" });
    }

    const vendor = await User.findById(vendorId);
    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ msg: "Vendor not found" });
    }

    const totalAmount = items.reduce(
      (sum, i) => sum + i.qty * i.price,
      0
    );

    const tx = await Transaction.create({
      orderId: `ORD_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      buyerId: buyer._id,
      vendorId,
      items,
      totalAmount,
      highValue: totalAmount >= HIGH_VALUE_THRESHOLD,
    });

    await logEvent({
      transactionId: tx._id,
      userId: buyer._id,
      type: "TRANSACTION_CREATED",
    });

    res.status(201).json(tx);
  } catch (err) {
    console.error("Create transaction failed:", err);
    res.status(500).json({ error: "Failed to create transaction" });
  }
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    const nextStatus = req.body.status;
    const allowed = STATUS_FLOW[tx.status] || [];

    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({
        msg: `Invalid status transition from ${tx.status} to ${nextStatus}`,
      });
    }

    // 🔐 PAYMENT GATE (CRITICAL)
    if (
      ["accepted", "shipped", "delivered", "completed"].includes(nextStatus) &&
      tx.payment?.status !== "paid"
    ) {
      return res.status(400).json({
        msg: "Payment required before proceeding with transaction",
      });
    }

    // 🔐 AUTHORIZATION RULES
    if (
      (nextStatus === "accepted" || nextStatus === "shipped") &&
      req.user._id.toString() !== tx.vendorId.toString()
    ) {
      return res.status(403).json({ msg: "Only vendor can perform this action" });
    }

    if (
      (nextStatus === "delivered" || nextStatus === "completed") &&
      req.user._id.toString() !== tx.buyerId.toString()
    ) {
      return res.status(403).json({ msg: "Only buyer can perform this action" });
    }

    tx.status = nextStatus;

    // 🔓 FINAL SETTLEMENT
    if (nextStatus === "completed") {
      if (!tx.escrow?.holdId || tx.escrow.released) {
        throw new Error("Invalid escrow state");
      }

      await releaseHold({ holdId: tx.escrow.holdId });

      tx.escrow.released = true;
      tx.escrow.releasedAt = new Date();

      const deltas = await updateTrustScoreForTransaction(tx);
      tx.trustImpact = deltas;
    }

    await tx.save();
    res.json(tx);
  } catch (err) {
    console.error("Update transaction failed:", err);
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};
