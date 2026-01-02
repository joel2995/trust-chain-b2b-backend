import Transaction from "../models/Transaction.js";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "../services/razorpayService.js";
import { createHold } from "../services/escrowService.js";
import { logEvent } from "../services/eventLogger.js";

/**
 * @route POST /api/payments/create-order
 * @access Buyer
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const { transactionId } = req.body;

    const tx = await Transaction.findById(transactionId);
    if (!tx) return res.status(404).json({ msg: "Transaction not found" });

    if (tx.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Unauthorized" });
    }

    if (tx.payment?.status === "paid") {
      return res.status(400).json({ msg: "Transaction already paid" });
    }

    const order = await createRazorpayOrder({
      amount: tx.totalAmount,
      receipt: tx.orderId,
    });

    tx.payment = {
      provider: "razorpay",
      orderId: order.id,
      status: "pending",
    };

    await tx.save();

    res.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error("Create payment error:", err);
    res.status(500).json({ error: "Payment order failed" });
  }
};

/**
 * @route POST /api/payments/verify
 * @access Buyer
 */
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

    // ✅ MARK PAYMENT SUCCESS
    tx.payment.status = "paid";
    tx.payment.paymentId = razorpay_payment_id;
    tx.payment.paidAt = new Date();

    // 🔒 AUTO CREATE ESCROW (ONCE)
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
      type: "PAYMENT_SUCCESS",
      payload: {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      },
    });

    res.json({ msg: "Payment verified successfully" });
  } catch (err) {
  console.error("❌ Razorpay create order error:");
  console.error(err?.error || err);

  return res.status(500).json({
    error: err?.error?.description || err.message || "Razorpay error",
  });
}
};
