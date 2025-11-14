// controllers/escrowController.js
import { createHold, releaseHold } from "../services/escrowService.js";
import Transaction from "../models/Transaction.js";
import { logEvent } from "../services/eventLogger.js";

export const createEscrowHold = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ msg: "transactionId required" });

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    // Prevent creating hold twice
    if (tx.escrow && tx.escrow.holdId) {
      return res.json({ msg: "Escrow already created", escrow: tx.escrow });
    }

    const hold = await createHold({ transactionId: tx._id, amount: tx.totalAmount });

    tx.escrow = {
      provider: hold.provider,
      holdId: hold.holdId,
      amountHeld: hold.amountHeld,
      released: false,
    };
    await tx.save();

    await logEvent({ transactionId: tx._id, userId: req.user._id, type: "escrow_created", payload: { holdId: hold.holdId } });

    res.status(201).json({ msg: "Escrow created", escrow: tx.escrow });
  } catch (err) {
    console.error("createEscrowHold:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const releaseEscrow = async (req, res) => {
  try {
    const { transactionId } = req.body;
    if (!transactionId) return res.status(400).json({ msg: "transactionId required" });

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });
    if (!tx.escrow || !tx.escrow.holdId) return res.status(400).json({ msg: "No hold to release" });

    const rel = await releaseHold({ holdId: tx.escrow.holdId });

    tx.escrow.released = !!rel.released;
    tx.escrow.releaseTxId = rel.releaseTxId;
    tx.escrow.releasedAt = new Date();
    await tx.save();

    await logEvent({ transactionId: tx._id, userId: req.user._id, type: "escrow_released", payload: { releaseTxId: rel.releaseTxId } });

    res.json({ msg: "Escrow released", escrow: tx.escrow });
  } catch (err) {
    console.error("releaseEscrow:", err.message);
    res.status(500).json({ error: err.message });
  }
};
