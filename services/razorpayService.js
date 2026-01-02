import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// CREATE ORDER (AUTHORIZE ONLY)
export const createRazorpayOrder = async ({ amount, receipt }) => {
  return await razorpay.orders.create({
    amount: amount * 100, // paise
    currency: "INR",
    receipt,
    payment_capture: 0, // 🔒 manual capture (ESCROW)
  });
};

// VERIFY SIGNATURE
export const verifyRazorpaySignature = ({
  orderId,
  paymentId,
  signature,
}) => {
  if (process.env.NODE_ENV !== "production") {
    return true; // allow test mode
  }

  const body = `${orderId}|${paymentId}`;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
};

// 🔓 REAL ESCROW RELEASE (CAPTURE MONEY)
export const capturePayment = async ({ paymentId, amount }) => {
  return await razorpay.payments.capture(
    paymentId,
    amount * 100,
    "INR"
  );
};
