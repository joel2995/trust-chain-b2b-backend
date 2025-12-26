import Transaction from "../models/Transaction.js";

export const getUserAnalytics = async (req, res) => {
  const userId = req.user._id;

  const txs = await Transaction.find({
    $or: [{ buyerId: userId }, { vendorId: userId }],
  });

  const completed = txs.filter(t => t.status === "completed").length;
  const disputed = txs.filter(t => t.status === "disputed").length;

  res.json({
    total: txs.length,
    completed,
    disputes: disputed,
    successRate: txs.length ? ((completed / txs.length) * 100).toFixed(2) : 0,
  });
};
