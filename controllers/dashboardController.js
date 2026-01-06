import Transaction from "../models/Transaction.js"
import UserEvent from "../models/UserEvent.js"
import TrustScore from "../models/TrustScore.js"

// helper: month label
const getMonthLabel = (date) =>
  date.toLocaleString("en-IN", { month: "short", year: "numeric" })

export const getDashboardSummary = async (req, res) => {
  try {
    const user = req.user
    const role = user.activeRole // buyer | vendor

    // ---------------------------------
    // TRANSACTIONS (ROLE AWARE)
    // ---------------------------------
    const transactions = await Transaction.find({
      userId: user._id,
      role,
    })

    const completedTransactions = transactions.filter(
      (t) => t.status === "completed"
    )

    const escrowAmount = transactions
      .filter((t) => t.escrowStatus === "locked")
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    // ✅ TOTAL VOLUME (NEW)
    const totalVolume = transactions.reduce(
      (sum, t) => sum + (t.amount || 0),
      0
    )

    // ---------------------------------
    // TRUST SCORE (FROM TRUST MODEL)
    // ---------------------------------
    const trust = await TrustScore.findOne({ userId: user._id })

    const currentTrustScore =
      role === "buyer"
        ? trust?.buyerScore ?? 100
        : trust?.vendorScore ?? 100

    // ---------------------------------
    // TRUST SCORE HISTORY (MONTHLY)
    // ---------------------------------
    const trustEvents = await UserEvent.find({
      userId: user._id,
      type: "system",
      title: /trustscore/i,
      mode: role,
    }).sort({ createdAt: 1 })

    let trustScoreHistory = trustEvents.map((e) => ({
      date: e.createdAt.toISOString().split("T")[0],
      score: Number(e.description.match(/\d+/)?.[0] || currentTrustScore),
    }))

    // fallback for new users
    if (trustScoreHistory.length === 0) {
      trustScoreHistory = [
        {
          date: user.createdAt.toISOString().split("T")[0],
          score: currentTrustScore,
        },
      ]
    }

    // ---------------------------------
    // SUCCESS RATE (MONTHLY)
    // ---------------------------------
    const monthly = {}

    transactions.forEach((t) => {
      const month = getMonthLabel(t.createdAt)
      if (!monthly[month]) {
        monthly[month] = { total: 0, completed: 0 }
      }
      monthly[month].total += 1
      if (t.status === "completed") {
        monthly[month].completed += 1
      }
    })

    const successRate = Object.entries(monthly).map(([month, data]) => ({
      month,
      rate:
        data.total === 0
          ? 0
          : Math.round((data.completed / data.total) * 100),
    }))

    // ---------------------------------
    // RESPONSE (FRONTEND SAFE)
    // ---------------------------------
    res.json({
      trustScore: currentTrustScore,
      trustScoreHistory,
      successRate,

      totalTransactions: transactions.length,
      completedTransactions: completedTransactions.length,
      escrowAmount,
      totalVolume, // ✅ NEW
    })
  } catch (err) {
    console.error("Dashboard summary error:", err)
    res.status(500).json({ message: err.message })
  }
}
