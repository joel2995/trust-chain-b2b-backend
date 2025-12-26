import Razorpay from "razorpay";
import crypto from "crypto";

console.log("RZP ENV CHECK:", {
  id: process.env.RAZORPAY_KEY_ID,
  secret: process.env.RAZORPAY_KEY_SECRET ? "OK" : "MISSING",
});

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error("Razorpay ENV not loaded BEFORE service import");
}

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrder = async (amount) => {
  return razorpay.orders.create({
    amount: amount * 100,
    currency: "INR",
    payment_capture: 1,
  });
};

export const verifySignature = ({ order_id, payment_id, signature }) => {
  const body = order_id + "|" + payment_id;
  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  return expected === signature;
};
