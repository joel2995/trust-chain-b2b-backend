import Transaction from "../models/Transaction.js";

export const getLeaderboard = async (req, res) => {
  try {
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
      { $limit: 10 },
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
          userId: "$vendor._id",
          name: "$vendor.name",
          trustScore: "$vendor.vendorTrustScore",
          completedTx: 1,
          volume: 1,
        },
      },
    ]);

    res.json({ vendors: topVendors });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
