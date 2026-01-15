import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const getAdminAnalytics = async (req, res) => {
  try {
    // Top vendors by completed transactions
    const topVendors = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$vendorId",
          completedTx: { $sum: 1 },
          volume: { $sum: "$totalAmount" },
        },
      },
      { $sort: { completedTx: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "vendor",
        },
      },
      { $unwind: "$vendor" },
      {
        $project: {
          _id: 0,
          vendorId: "$vendor._id",
          name: "$vendor.name",
          trustScore: "$vendor.vendorTrustScore",
          completedTx: 1,
          volume: 1,
        },
      },
    ]);

    // Top buyers by completed transactions
    const topBuyers = await Transaction.aggregate([
      { $match: { status: "completed" } },
      {
        $group: {
          _id: "$buyerId",
          completedTx: { $sum: 1 },
        },
      },
      { $sort: { completedTx: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "buyer",
        },
      },
      { $unwind: "$buyer" },
      {
        $project: {
          _id: 0,
          buyerId: "$buyer._id",
          name: "$buyer.name",
          trustScore: "$buyer.buyerTrustScore",
          completedTx: 1,
        },
      },
    ]);

    res.json({
      leaderboards: {
        vendors: topVendors,
        buyers: topBuyers,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// --------------------------------------------------
// PLATFORM SUCCESS RATE (MONTHLY KYC SUCCESS)
// --------------------------------------------------
export const getPlatformSuccessRate = async (req, res) => {
  try {
    const monthsBack = 6
    const results = []

    const now = new Date()

    for (let i = monthsBack - 1; i >= 0; i--) {
      const startOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1
      )

      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        0,
        23,
        59,
        59
      )

      const [totalUsers, verifiedUsers] = await Promise.all([
        User.countDocuments({ createdAt: { $lte: endOfMonth } }),
        User.countDocuments({
          createdAt: { $lte: endOfMonth },
          kycStatus: "verified",
        }),
      ])

      const rate =
        totalUsers === 0
          ? 0
          : Math.round((verifiedUsers / totalUsers) * 100)

      results.push({
        month: startOfMonth.toLocaleString("en-US", { month: "short" }),
        rate,
      })
    }

    res.json(results)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}