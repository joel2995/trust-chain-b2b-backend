import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import crypto from "crypto";
import { createHold, releaseHold } from "../services/escrowService.js";
import { updateTrustScoreForTransaction } from "../services/trustScoreService.js";
import { logEvent } from "../services/eventLogger.js";
import { HIGH_VALUE_THRESHOLD } from "../utils/constants.js";

export const createTransaction = async (req, res) => {
  try {
    const buyer = req.user;
    const { vendorId, items } = req.body;

    const vendor = await User.findById(vendorId);
    if (!vendor) return res.status(404).json({ msg: "Vendor not found" });

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

    const hold = await createHold({
      transactionId: tx._id,
      amount: totalAmount,
    });

    tx.escrow = hold;
    await tx.save();

    await logEvent({
      transactionId: tx._id,
      userId: buyer._id,
      type: "transaction_created",
    });

    res.status(201).json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    tx.status = req.body.status;
    await tx.save();

    if (tx.status === "completed") {
      if (!tx.escrow?.holdId) {
        throw new Error("Escrow holdId missing");
      }

      await releaseHold({ holdId: tx.escrow.holdId });
      await updateTrustScoreForTransaction(tx);
    }

    res.json(tx);
  } catch (err) {
    console.error("Update transaction failed:", err);
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  }
};
