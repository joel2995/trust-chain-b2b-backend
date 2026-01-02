import Transaction from "../models/Transaction.js";
import User from "../models/User.js";
import crypto from "crypto";
import { capturePayment } from "../services/razorpayService.js";
import { updateTrustScoreForTransaction } from "../services/trustScoreService.js";
import { logEvent } from "../services/eventLogger.js";
import { HIGH_VALUE_THRESHOLD } from "../utils/constants.js";

const STATUS_FLOW = {
  created: ["accepted", "cancelled"],
  accepted: ["shipped"],
  shipped: ["delivered"],
  delivered: ["completed", "disputed"],
};

export const updateTransactionStatus = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    const nextStatus = req.body.status;
    const allowed = STATUS_FLOW[tx.status] || [];

    if (!allowed.includes(nextStatus)) {
      return res.status(400).json({ msg: "Invalid status transition" });
    }

    // 🔐 BLOCK FLOW UNTIL PAYMENT AUTHORIZED
    if (
      ["accepted", "shipped", "delivered", "completed"].includes(nextStatus) &&
      tx.payment?.status !== "authorized"
    ) {
      return res.status(400).json({ msg: "Payment not authorized" });
    }

    tx.status = nextStatus;

    // 🔓 REAL ESCROW RELEASE
    if (nextStatus === "completed") {
      await capturePayment({
        paymentId: tx.payment.paymentId,
        amount: tx.totalAmount,
      });

      tx.payment.status = "captured";
      tx.payment.capturedAt = new Date();
      tx.escrow.released = true;
      tx.escrow.releasedAt = new Date();

      await updateTrustScoreForTransaction(tx);

      await logEvent({
        transactionId: tx._id,
        type: "ESCROW_RELEASED",
      });
    }

    await tx.save();
    res.json(tx);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
