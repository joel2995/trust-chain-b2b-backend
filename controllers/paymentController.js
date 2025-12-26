import { createOrder, verifySignature } from "../services/razorpayService.js";

export const createPaymentOrder = async (req, res) => {
  const { amount } = req.body;
  const order = await createOrder(amount);
  res.json(order);
};

export const verifyPayment = async (req, res) => {
  const valid = verifySignature(req.body);
  if (!valid) return res.status(400).json({ msg: "Invalid signature" });
  res.json({ msg: "Payment verified" });
};
