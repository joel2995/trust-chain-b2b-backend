import Transaction from "../models/Transaction.js";
import { createHold } from "../services/escrowService.js";
import { logEvent } from "../services/eventLogger.js";

/**
 * @desc    Create escrow hold (after payment)
 * @route   POST /api/escrow/hold
 * @access  Buyer only
 */
export const createEscrowHold = async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({ msg: "transactionId is required" });
    }

    if (req.user.role !== "buyer") {
      return res.status(403).json({ msg: "Only buyer can create escrow" });
    }

    const tx = await Transaction.findById(transactionId);
    if (!tx) {
      return res.status(404).json({ msg: "Transaction not found" });
    }

    if (tx.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (tx.escrow?.holdId) {
      return res.json({
        msg: "Escrow already exists",
        escrow: tx.escrow,
      });
    }

    if (!["created", "accepted"].includes(tx.status)) {
      return res.status(400).json({
        msg: "Escrow cannot be created in current transaction state",
      });
    }

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
      type: "ESCROW_CREATED",
      payload: {
        holdId: hold.holdId,
        amount: hold.amountHeld,
      },
    });

    res.status(201).json({
      msg: "Escrow hold created",
      escrow: tx.escrow,
    });
  } catch (err) {
    console.error("createEscrowHold error:", err);
    res.status(500).json({ error: "Failed to create escrow" });
  }
};
