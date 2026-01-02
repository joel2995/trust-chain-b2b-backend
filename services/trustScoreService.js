import User from "../models/User.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";
import { logEvent } from "./eventLogger.js";
import axios from "axios";

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export const DEFAULT_RULES = {
  onTimeDelivery: 2,
  lateDelivery: -4,
  onTimePayment: 2,
  latePayment: -3,
  disputeOpened: -10,
  cancelByVendor: -7,
  cancelByBuyer: -4,
};

async function recordHistory({ userId, role, oldScore, newScore, reason, txId }) {
  await TrustScoreHistory.create({
    userId,
    role,
    oldScore,
    newScore,
    reason,
    txId,
    timestamp: new Date(),
  });

  await logEvent({
    transactionId: txId,
    userId,
    type: "TRUST_UPDATED",
    payload: { role, oldScore, newScore, reason },
  });
}

export function computeDeltaFromTransaction(tx, rules = DEFAULT_RULES) {
  // TrustChain v1 logic — deterministic & schema-safe
  let buyerDelta = rules.onTimePayment;
  let vendorDelta = rules.onTimeDelivery;

  if (tx.status === "disputed") {
    buyerDelta += rules.disputeOpened;
    vendorDelta += rules.disputeOpened;
  }

  return { buyerDelta, vendorDelta };
}

export async function applyTrustScoreDeltas({
  buyerId,
  vendorId,
  buyerDelta,
  vendorDelta,
  txId,
}) {
  const buyer = await User.findById(buyerId);
  const vendor = await User.findById(vendorId);

  const oldBuyer = buyer.buyerTrustScore;
  const oldVendor = vendor.vendorTrustScore;

  buyer.buyerTrustScore = clamp(oldBuyer + buyerDelta);
  vendor.vendorTrustScore = clamp(oldVendor + vendorDelta);

  buyer.txCounts.buyer += 1;
  vendor.txCounts.vendor += 1;

  buyer.overallTrustScore = clamp(
    buyer.buyerTrustScore * 0.6 + buyer.vendorTrustScore * 0.4
  );
  vendor.overallTrustScore = clamp(
    vendor.buyerTrustScore * 0.6 + vendor.vendorTrustScore * 0.4
  );

  await Promise.all([buyer.save(), vendor.save()]);

  await Promise.all([
    recordHistory({
      userId: buyer._id,
      role: "buyer",
      oldScore: oldBuyer,
      newScore: buyer.buyerTrustScore,
      reason: "transaction_completed",
      txId,
    }),
    recordHistory({
      userId: vendor._id,
      role: "vendor",
      oldScore: oldVendor,
      newScore: vendor.vendorTrustScore,
      reason: "transaction_completed",
      txId,
    }),
  ]);

  return {
    buyerDelta,
    vendorDelta,
  };
}

export async function updateTrustScoreForTransaction(tx) {
  try {
    const { buyerDelta, vendorDelta } = computeDeltaFromTransaction(tx);

    let multiplier = 1;

    if (process.env.ML_ENABLED === "true" && process.env.ML_SERVICE_URL) {
      try {
        const res = await axios.post(
          `${process.env.ML_SERVICE_URL}/predict`,
          {
            totalAmount: tx.totalAmount,
            disputed: tx.status === "disputed",
          },
          { timeout: 3000 }
        );
        multiplier = res.data?.multiplier || 1;
      } catch {
        multiplier = 1;
      }
    }

    return await applyTrustScoreDeltas({
      buyerId: tx.buyerId,
      vendorId: tx.vendorId,
      buyerDelta: Math.round(buyerDelta * multiplier),
      vendorDelta: Math.round(vendorDelta * multiplier),
      txId: tx._id,
    });
  } catch (err) {
    console.error("TrustScore update failed:", err);
    throw new Error("TrustScore update failed");
  }
}

export async function recomputeTrustScores({ userId = null }) {
  try {
    const query = userId ? { userId } : {};

    const histories = await TrustScoreHistory.find(query)
      .sort({ timestamp: 1 })
      .lean();

    if (!histories.length) {
      return { msg: "No TrustScore history found" };
    }

    // 🔹 Collect unique userIds
    const userIds = [...new Set(histories.map(h => h.userId.toString()))];

    // 🔹 Fetch users in ONE query
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    const userScores = new Map();

    for (const h of histories) {
      const uid = h.userId.toString();

      if (!userScores.has(uid)) {
        const user = userMap.get(uid);
        userScores.set(uid, {
          buyer: user?.buyerTrustScore ?? 100,
          vendor: user?.vendorTrustScore ?? 100,
        });
      }

      const scores = userScores.get(uid);
      if (h.role === "buyer") scores.buyer = h.newScore;
      if (h.role === "vendor") scores.vendor = h.newScore;
    }

    const updates = [];

    for (const [uid, scores] of userScores.entries()) {
      const overall = Math.max(
        0,
        Math.min(100, Math.round(scores.buyer * 0.6 + scores.vendor * 0.4))
      );

      updates.push(
        User.findByIdAndUpdate(uid, {
          buyerTrustScore: scores.buyer,
          vendorTrustScore: scores.vendor,
          overallTrustScore: overall,
        })
      );
    }

    await Promise.all(updates);

    return {
      recomputedUsers: updates.length,
      target: userId ? "single user" : "all users",
    };
  } catch (err) {
    console.error("🔥 TrustScore recompute error:", err);
    throw new Error("TrustScore recomputation failed");
  }
}
