import User from "../models/User.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";
import { logEvent } from "./eventLogger.js";
import axios from "axios";

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

export async function recomputeTrustScores({ userId = null }) {
  const query = userId ? { userId } : {};

  const histories = await TrustScoreHistory.find(query)
    .sort({ timestamp: 1 })
    .lean();

  const userScores = new Map();

  for (const h of histories) {
    if (!userScores.has(h.userId.toString())) {
      userScores.set(h.userId.toString(), {
        buyer: 50,
        vendor: 50,
      });
    }

    const scores = userScores.get(h.userId.toString());
    if (h.role === "buyer") scores.buyer = h.newScore;
    if (h.role === "vendor") scores.vendor = h.newScore;
  }

  const updates = [];

  for (const [uid, scores] of userScores.entries()) {
    const overall = clamp(scores.buyer * 0.6 + scores.vendor * 0.4);

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
}


export const DEFAULT_RULES = {
  onTimeDelivery: 2,
  lateDelivery: -4,
  onTimePayment: 2,
  latePayment: -3,
  disputeOpened: -10,
  disputeResolved: 3,
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
  let buyerDelta = 0;
  let vendorDelta = 0;

  const meta = tx.meta || {};

  vendorDelta += meta.deliveryOnTime ? rules.onTimeDelivery : rules.lateDelivery;
  buyerDelta += meta.paymentOnTime ? rules.onTimePayment : rules.latePayment;

  if (meta.dispute) {
    buyerDelta += rules.disputeOpened;
    vendorDelta += rules.disputeOpened;
  }

  if (meta.cancelledByVendor) vendorDelta += rules.cancelByVendor;
  if (meta.cancelledByBuyer) buyerDelta += rules.cancelByBuyer;

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
}

export async function updateTrustScoreForTransaction(tx) {
  const { buyerDelta, vendorDelta } = computeDeltaFromTransaction(tx);

  let multiplier = 1;

  if (process.env.ML_ENABLED === "true" && process.env.ML_SERVICE_URL) {
    try {
      const res = await axios.post(
        `${process.env.ML_SERVICE_URL}/predict`,
        {
          totalAmount: tx.totalAmount,
          dispute: tx.meta?.dispute || false,
        },
        { timeout: 3000 }
      );
      multiplier = res.data?.multiplier || 1;
    } catch {
      multiplier = 1;
    }
  }

  await applyTrustScoreDeltas({
    buyerId: tx.buyerId,
    vendorId: tx.vendorId,
    buyerDelta: Math.round(buyerDelta * multiplier),
    vendorDelta: Math.round(vendorDelta * multiplier),
    txId: tx._id,
  });
}
