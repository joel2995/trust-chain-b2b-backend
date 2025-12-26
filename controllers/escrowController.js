import Transaction from "../models/Transaction.js";
import { createHold, releaseHold } from "../services/escrowService.js";
import { logEvent } from "../services/eventLogger.js";

/**
 * @desc    Create escrow hold for a transaction
 * @route   POST /api/escrow/hold
 * @access  Protected
 */
export const createEscrowHold = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ msg: "transactionId is required" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    // Prevent duplicate escrow creation
    if (tx.escrow?.holdId) {
      return res.json({
        msg: "Escrow already exists",
        escrow: tx.escrow,
      });
    }

    // Create escrow hold (mock now, Razorpay later)
    const hold = await createHold({
      transactionId: tx._id,
      amount: tx.totalAmount,
    });

    tx.escrow = {
      provider: hold.provider,
      holdId: hold.holdId,
      amountHeld: hold.amountHeld,
      released: false,
    };

    await tx.save();

    await logEvent({
      transactionId: tx._id,
      userId: req.user._id,
      type: "escrow_created",
      payload: {
        holdId: hold.holdId,
        amount: hold.amountHeld,
      },
    });

    return res.status(201).json({
      msg: "Escrow hold created",
      escrow: tx.escrow,
    });
  } catch (err) {
    console.error("createEscrowHold error:", err.message);
    return res.status(500).json({ error: "Failed to create escrow" });
  }
};

/**
 * @desc    Release escrow after delivery confirmation
 * @route   POST /api/escrow/release
 * @access  Protected
 */
export const releaseEscrow = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ msg: "transactionId is required" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    if (!tx.escrow?.holdId) {
      return res.status(400).json({ msg: "No escrow hold found" });
    }

    if (tx.escrow.released) {
      return res.json({
        msg: "Escrow already released",
        escrow: tx.escrow,
      });
    }

    const release = await releaseHold({ holdId: tx.escrow.holdId });

    tx.escrow.released = true;
    tx.escrow.releaseTxId = release.releaseTxId;
    tx.escrow.releasedAt = new Date();

    await tx.save();

    await logEvent({
      transactionId: tx._id,
      userId: req.user._id,
      type: "escrow_released",
      payload: {
        releaseTxId: release.releaseTxId,
      },
    });

    return res.json({
      msg: "Escrow released successfully",
      escrow: tx.escrow,
    });
  } catch (err) {
    console.error("releaseEscrow error:", err.message);
    return res.status(500).json({ error: "Failed to release escrow" });
  }
};
  