import User from "../models/User.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";
import { logEvent } from "./eventLogger.js";

export const computeBuyerScore = (stats) => {
  const base = 50;
  const w1 = 30;  // payment
  const w2 = 20;  // dispute

  return Math.max(0, Math.min(100,
    base + w1 * stats.onTimePaymentRate - w2 * stats.disputeRate
  ));
};

export const computeVendorScore = (stats) => {
  const base = 50;
  const w1 = 35; // delivery
  const w2 = 25; // dispute

  return Math.max(0, Math.min(100,
    base + w1 * stats.onTimeDeliveryRate - w2 * stats.disputeRate
  ));
};

export const updateTrustScores = async ({ userId, role, oldScore, newScore, reason, txId }) => {
  try {
    await TrustScoreHistory.create({
      userId,
      role,
      oldScore,
      newScore,
      reason,
      txId,
    });

    const user = await User.findById(userId);
    if (!user) return;

    if (role === "buyer") user.buyerTrustScore = newScore;
    else if (role === "vendor") user.vendorTrustScore = newScore;

    const buyerCount = user.txCounts?.buyer || 0;
    const vendorCount = user.txCounts?.vendor || 0;
    const alpha = (buyerCount + vendorCount === 0 ? 0.5 : buyerCount / (buyerCount + vendorCount));

    user.overallTrustScore = Math.round(
      alpha * user.buyerTrustScore + (1 - alpha) * user.vendorTrustScore
    );

    await user.save();

    await logEvent({
      userId,
      type: "trustscore_updated",
      payload: { role, oldScore, newScore, reason, txId },
    });

  } catch (err) {
    console.warn("⚠️ TrustScore update failed:", err.message);
  }
};
