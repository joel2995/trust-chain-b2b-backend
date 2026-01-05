import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import KYC from "../models/KYC.js";

export const getAdminDashboardSummary = async (req, res) => {
  try {
    const [
      totalUsers,
      buyers,
      vendors,
      pendingKyc,
      totalTx,
      completedTx,
      disputedTx,
      escrowAgg,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "buyer" }),
      User.countDocuments({ role: "vendor" }),
      KYC.countDocuments({ status: "pending" }),
      Transaction.countDocuments(),
      Transaction.countDocuments({ status: "completed" }),
      Transaction.countDocuments({ status: "disputed" }),
      Transaction.aggregate([
        {
          $match: { "escrow.released": false },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$totalAmount" },
          },
        },
      ]),
    ]);

    res.json({
      users: {
        total: totalUsers,
        buyers,
        vendors,
      },
      transactions: {
        total: totalTx,
        completed: completedTx,
        disputed: disputedTx,
        successRate: totalTx
          ? ((completedTx / totalTx) * 100).toFixed(2)
          : 0,
      },
      kycPending: pendingKyc,
      escrowLocked: escrowAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
