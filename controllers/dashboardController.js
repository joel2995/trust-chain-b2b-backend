import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const getDashboardSummary = async (req, res) => {
  const userId = req.user._id;

  const [txCount, completed, activeEscrow] = await Promise.all([
    Transaction.countDocuments({ $or: [{ buyerId: userId }, { vendorId: userId }] }),
    Transaction.countDocuments({ status: "completed", $or: [{ buyerId: userId }, { vendorId: userId }] }),
    Transaction.countDocuments({ "escrow.released": false, $or: [{ buyerId: userId }, { vendorId: userId }] }),
  ]);

  res.json({
    trustScore: req.user.overallTrustScore,
    totalTransactions: txCount,
    completedTransactions: completed,
    activeEscrows: activeEscrow,
  });
};
