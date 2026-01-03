import rateLimit from "express-rate-limit";

// 🔐 Auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  message: "Too many auth attempts. Try again later.",
});

// 💸 Payment routes
export const paymentLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: "Too many payment requests. Try again later.",
});

// ⛓️ Blockchain routes
export const blockchainLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: "Too many blockchain requests. Slow down.",
});
