import Transaction from "../models/Transaction.js"

export const getDashboardSummary = async (req, res) => {
  try {
    const userId = req.user._id
    const role = req.user.activeRole // buyer | vendor

    // -----------------------------
    // COMMON METRICS
    // -----------------------------
    const totalTransactions = await Transaction.countDocuments({
      [role === "buyer" ? "buyer" : "vendor"]: userId,
    })

    const completedTransactions = await Transaction.countDocuments({
      [role === "buyer" ? "buyer" : "vendor"]: userId,
      status: "completed",
    })

    const escrowAmountAgg = await Transaction.aggregate([
      {
        $match: {
          [role === "buyer" ? "buyer" : "vendor"]: userId,
          escrowStatus: "locked",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ])

    const escrowAmount = escrowAmountAgg[0]?.total || 0

    res.status(200).json({
      role,
      trustScore: req.user.overallTrustScore,
      totalTransactions,
      completedTransactions,
      escrowAmount,
    })
  } catch (error) {
    console.error("Dashboard summary error:", error)
    res.status(500).json({ message: "Failed to load dashboard summary" })
  }
}
