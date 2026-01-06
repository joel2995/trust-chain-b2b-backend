import Transaction from "../models/Transaction.js";
import UserEvent from "../models/UserEvent.js";

// helper
const getMonthLabel = (date) =>
  date.toLocaleString("en-IN", { month: "short" });

export const getDashboardSummary = async (req, res) => {
  try {
    const user = req.user;
    const role = user.activeRole;

    // -----------------------------
    // TRANSACTIONS
    // -----------------------------
    const transactions = await Transaction.find({
      userId: user._id,
      role,
    });

    const completed = transactions.filter(t => t.status === "completed");
    const escrowAmount = transactions
      .filter(t => t.escrowStatus === "locked")
      .reduce((sum, t) => sum + t.amount, 0);

    // -----------------------------
    // TRUST SCORE HISTORY
    // (from events or stored snapshots)
    // -----------------------------
    const trustEvents = await UserEvent.find({
      userId: user._id,
      type: "system",
      title: /TrustScore/i,
      mode: role,
    }).sort({ createdAt: 1 });

    const trustScoreHistory = trustEvents.map(e => ({
      date: e.createdAt.toISOString().split("T")[0],
      score: Number(e.description.match(/\d+/)?.[0] || user.trustScore),
    }));

    // fallback (new user)
    if (trustScoreHistory.length === 0) {
      trustScoreHistory.push({
        date: user.createdAt.toISOString().split("T")[0],
        score: user.trustScore,
      });
    }

    // -----------------------------
    // SUCCESS RATE (MONTHLY)
    // -----------------------------
    const monthly = {};

    completed.forEach(t => {
      const month = getMonthLabel(t.createdAt);
      if (!monthly[month]) monthly[month] = { completed: 0, total: 0 };
      monthly[month].completed += 1;
    });

    transactions.forEach(t => {
      const month = getMonthLabel(t.createdAt);
      if (!monthly[month]) monthly[month] = { completed: 0, total: 0 };
      monthly[month].total += 1;
    });

    const successRate = Object.entries(monthly).map(([month, data]) => ({
      month,
      rate: data.total === 0
        ? 0
        : Math.round((data.completed / data.total) * 100),
    }));

    res.json({
      trustScore: user.trustScore,
      totalTransactions: transactions.length,
      completedTransactions: completed.length,
      escrowAmount,

      trustScoreHistory,
      successRate,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
