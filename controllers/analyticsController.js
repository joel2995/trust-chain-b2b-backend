import Transaction from "../models/Transaction.js";

export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    const stats = await Transaction.aggregate([
      {
        $match: {
          $or: [{ buyerId: userId }, { vendorId: userId }],
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: {
              $cond: [{ $eq: ["$status", "completed"] }, 1, 0],
            },
          },
          disputes: {
            $sum: {
              $cond: [{ $eq: ["$status", "disputed"] }, 1, 0],
            },
          },
        },
      },
    ]);

    const data = stats[0] || { total: 0, completed: 0, disputes: 0 };

    res.json({
      total: data.total,
      completed: data.completed,
      disputes: data.disputes,
      successRate: data.total
        ? ((data.completed / data.total) * 100).toFixed(2)
        : 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
