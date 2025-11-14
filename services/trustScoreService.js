// backend/services/trustScoreService.js
import User from "../models/User.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";
import Event from "../models/Event.js";
import axios from "axios";

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

// Default scoring rules (tunable)
export const DEFAULT_RULES = {
  onTimeDelivery: 2,       // +2 points per on-time delivery
  lateDelivery: -4,        // -4 points per late delivery
  onTimePayment: 2,        // +2 per on-time payment
  latePayment: -3,         // -3 per late payment
  disputeOpened: -10,      // -10 when a dispute is opened against user
  disputeResolved: +3,     // +3 when dispute resolved positively
  cancelByVendor: -7,      // -7 when vendor cancels
  cancelByBuyer: -4,       // -4 when buyer cancels
  completionBonusWindow: 5 // if a user completes N transactions without issues => small bonus handled separately
};

// Utility: record trustscore history & event
async function recordHistory({ userId, role, oldScore, newScore, reason, txId }) {
  try {
    await TrustScoreHistory.create({
      userId,
      role,
      oldScore,
      newScore,
      reason,
      txId,
      timestamp: new Date(),
    });

    await Event.create({
      transactionId: txId || null,
      userId,
      type: "trustscore_updated",
      payload: { role, oldScore, newScore, reason, txId },
    });
  } catch (err) {
    console.warn("Could not write trustscore history/event:", err.message);
  }
}

/**
 * computeDeltaFromTransaction
 * Decides the delta (points) for buyer and vendor for a completed transaction.
 * tx: transaction document (populated if necessary)
 */
export function computeDeltaFromTransaction(tx, rules = DEFAULT_RULES) {
  // tx should include: status, createdAt, updatedAt, escrow info, payment info, metadata about delivery timeliness
  // We'll use simple heuristics:
  // - If tx.meta?.deliveryOnTime === true => vendor +onTimeDelivery, else -lateDelivery
  // - If tx.meta?.paymentOnTime === true => buyer +onTimePayment, else -latePayment
  // - If tx.disputed === true => both get penalties (buyer/vendor depends on who raised)
  // You can extend and enrich tx to include meta flags from your pipeline.

  let buyerDelta = 0;
  let vendorDelta = 0;
  const txId = tx._id?.toString();

  // delivery flag (set these flags in transaction lifecycle or event logger)
  const deliveryOnTime = tx.meta?.deliveryOnTime === true;
  const paymentOnTime = tx.meta?.paymentOnTime === true;
  const dispute = tx.meta?.dispute === true;
  const cancelledByVendor = tx.meta?.cancelledByVendor === true;
  const cancelledByBuyer = tx.meta?.cancelledByBuyer === true;

  if (deliveryOnTime) vendorDelta += rules.onTimeDelivery;
  else vendorDelta += rules.lateDelivery;

  if (paymentOnTime) buyerDelta += rules.onTimePayment;
  else buyerDelta += rules.latePayment;

  if (dispute) {
    // generic rule: both suffer, but the raiser suffers more. We assume tx.meta.disputeRaiser = 'buyer'|'vendor'
    vendorDelta += rules.disputeOpened;
    buyerDelta += rules.disputeOpened;
    if (tx.meta?.disputeRaiser === "buyer") vendorDelta += -2; // extra penalty to vendor
    if (tx.meta?.disputeRaiser === "vendor") buyerDelta += -2;
  }

  if (cancelledByVendor) vendorDelta += rules.cancelByVendor;
  if (cancelledByBuyer) buyerDelta += rules.cancelByBuyer;

  return { buyerDelta, vendorDelta, txId };
}

/**
 * applyTrustScoreDeltas
 * Safely applies deltas to users and writes history.
 * - clamps scores between 0 and 100.
 * - updates overallTrustScore as weighted average (buyer 0.6, vendor 0.4) — configurable.
 */
export async function applyTrustScoreDeltas({ buyerId, vendorId, buyerDelta, vendorDelta, txId, reason = "transaction_completed" }) {
  // Fetch users
  const [buyer, vendor] = await Promise.all([
    User.findById(buyerId),
    User.findById(vendorId),
  ]);

  if (!buyer || !vendor) {
    throw new Error("Buyer or vendor not found for TrustScore update");
  }

  const oldBuyer = buyer.buyerTrustScore ?? 100;
  const oldVendor = vendor.vendorTrustScore ?? 100;

  const newBuyer = clamp(oldBuyer + (buyerDelta || 0));
  const newVendor = clamp(oldVendor + (vendorDelta || 0));

  // update counts and overall score: weighting example - buyer role weight 0.6 vendor role weight 0.4
  buyer.buyerTrustScore = newBuyer;
  buyer.txCounts = buyer.txCounts || { buyer: 0, vendor: 0 };
  buyer.txCounts.buyer = (buyer.txCounts.buyer || 0) + 1;
  buyer.overallTrustScore = clamp(Math.round((buyer.buyerTrustScore * 0.6) + (buyer.vendorTrustScore * 0.4)));

  vendor.vendorTrustScore = newVendor;
  vendor.txCounts = vendor.txCounts || { buyer: 0, vendor: 0 };
  vendor.txCounts.vendor = (vendor.txCounts.vendor || 0) + 1;
  vendor.overallTrustScore = clamp(Math.round((vendor.buyerTrustScore * 0.6) + (vendor.vendorTrustScore * 0.4)));

  await Promise.all([buyer.save(), vendor.save()]);

  // write histories
  await Promise.all([
    recordHistory({ userId: buyer._id, role: "buyer", oldScore: oldBuyer, newScore: newBuyer, reason, txId }),
    recordHistory({ userId: vendor._id, role: "vendor", oldScore: oldVendor, newScore: newVendor, reason, txId }),
  ]);

  return { buyer: { id: buyer._id, oldBuyer, newBuyer }, vendor: { id: vendor._id, oldVendor, newVendor } };
}

/**
 * updateTrustScoreForTransaction
 * Orchestrator called from transaction controller when tx becomes 'completed'.
 * It can:
 *  - compute deltas using local rules
 *  - optionally call an ML microservice to adjust deltas (if configured)
 *  - apply deltas and record history/events
 */
export async function updateTrustScoreForTransaction(tx, options = {}) {
  // tx should include buyerId, vendorId and ideally tx.meta flags
  try {
    const { buyerDelta, vendorDelta, txId } = computeDeltaFromTransaction(tx, options.rules);

    // If ML service is configured, ask ML service for suggested adjustment multiplier
    let mlMultiplier = 1;
    if (process.env.ML_SERVICE_URL && process.env.ML_ENABLED === "true") {
      try {
        // send lightweight features; you can extend with more features
        const features = {
          onTimeRate: tx.meta?.onTimeRate || 1,
          disputeCount: tx.meta?.disputeCount || 0,
          avgDeliveryDelayDays: tx.meta?.avgDeliveryDelayDays || 0,
          totalAmount: tx.totalAmount || 0,
        };
        const resp = await axios.post(`${process.env.ML_SERVICE_URL}/predict-multiplier`, features, { timeout: 3000 });
        if (resp?.data?.multiplier) mlMultiplier = Number(resp.data.multiplier) || 1;
      } catch (err) {
        console.warn("ML service not available or returned error:", err.message);
        mlMultiplier = 1;
      }
    }

    const scaledBuyerDelta = Math.round(buyerDelta * mlMultiplier);
    const scaledVendorDelta = Math.round(vendorDelta * mlMultiplier);

    const res = await applyTrustScoreDeltas({
      buyerId: tx.buyerId,
      vendorId: tx.vendorId,
      buyerDelta: scaledBuyerDelta,
      vendorDelta: scaledVendorDelta,
      txId: txId || tx._id,
      reason: "completed_transaction"
    });

    return res;
  } catch (err) {
    console.error("TrustScore update failed:", err.message);
    throw err;
  }
}

/**
 * Recalculate trust scores for a specific user or for all users from history.
 * WARNING: This function will recompute scores from TrustScoreHistory and overwrite user scores.
 * Use carefully (admin-only).
 */
export async function recomputeTrustScores({ userId = null } = {}) {
  // Strategy:
  // - Reset scores to base (100)
  // - Replay TrustScoreHistory entries in chronological order and apply deltas
  // Note: Our TrustScoreHistory stores oldScore/newScore + reason; we can recompute by reading deltas
  const filter = userId ? { userId } : {};
  const users = userId ? [await User.findById(userId)] : await User.find();

  for (const user of users) {
    if (!user) continue;
    user.buyerTrustScore = 100;
    user.vendorTrustScore = 100;
    user.overallTrustScore = 100;
    user.txCounts = { buyer: 0, vendor: 0 };
    await user.save();

    // fetch history entries for this user sorted by timestamp
    const hist = await TrustScoreHistory.find({ userId: user._id }).sort({ timestamp: 1 }).lean();
    for (const h of hist) {
      const delta = h.newScore - h.oldScore;
      if (h.role === "buyer") {
        user.buyerTrustScore = clamp(user.buyerTrustScore + delta);
        user.txCounts.buyer = (user.txCounts.buyer || 0) + 1;
      } else {
        user.vendorTrustScore = clamp(user.vendorTrustScore + delta);
        user.txCounts.vendor = (user.txCounts.vendor || 0) + 1;
      }
      user.overallTrustScore = clamp(Math.round((user.buyerTrustScore * 0.6) + (user.vendorTrustScore * 0.4)));
      await user.save();
    }
  }

  return { ok: true };
}
