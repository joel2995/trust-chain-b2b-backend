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
