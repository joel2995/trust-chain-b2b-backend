import Transaction from "../models/Transaction.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id;

    const [txCount, completed, escrowAgg] = await Promise.all([
      Transaction.countDocuments({
        $or: [{ buyerId: userId }, { vendorId: userId }],
      }),
      Transaction.countDocuments({
        status: "completed",
        $or: [{ buyerId: userId }, { vendorId: userId }],
      }),
      Transaction.aggregate([
        {
          $match: {
            "escrow.released": false,
            $or: [{ buyerId: userId }, { vendorId: userId }],
          },
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
      trustScore: req.user.overallTrustScore,
      totalTransactions: txCount,
      completedTransactions: completed,
      escrowAmount: escrowAgg[0]?.total || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
