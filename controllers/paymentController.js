import Transaction from "../models/Transaction.js";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import { createHold } from "../services/escrowService.js";
import { logEvent } from "../services/eventLogger.js";
import { logger } from "../utils/logger.js";
import AppError from "../utils/AppError.js";

export const createPaymentOrder = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    if (tx.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (tx.payment?.status === "authorized") {
      return res.status(400).json({ msg: "Payment already authorized" });
    }

    const order = await createRazorpayOrder({
      amount: tx.totalAmount,
      receipt: tx.orderId,
    });

    tx.payment = {
      provider: "razorpay",
      orderId: order.id,
      status: "created",
    };

    await tx.save();

    res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
  throw new AppError(err.message, 500);
}
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      transactionId,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    const isValid = verifyRazorpaySignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature,
    });

    if (!isValid) {
      tx.payment.status = "failed";
      await tx.save();
      return res.status(400).json({ msg: "Invalid payment signature" });
    }

    // 🔒 PAYMENT AUTHORIZED (NOT RELEASED)
    tx.payment.status = "authorized";
    tx.payment.paymentId = razorpay_payment_id;
    tx.payment.authorizedAt = new Date();

    // Audit escrow record
    if (!tx.escrow?.holdId) {
      const hold = await createHold({
        transactionId: tx._id,
        amount: tx.totalAmount,
      });

      tx.escrow = {
        provider: "razorpay",
        holdId: hold.holdId,
        amountHeld: hold.amountHeld,
        released: false,
      };
    }

    await tx.save();

    await logEvent({
      transactionId: tx._id,
      userId: req.user._id,
      type: "PAYMENT_AUTHORIZED",
    });

    res.json({ msg: "Payment authorized, escrow locked" });
  } catch (err) {
  throw new AppError(err.message, 500);
}
};
