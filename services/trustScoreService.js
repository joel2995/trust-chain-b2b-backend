import TrustScore from "../models/TrustScore.js";
import { TRUST_EVENTS } from "../constants/trustEvents.js";

/**
 * Clamp value between min and max
 */
const clamp = (value, min = 0, max = 100) => {
  return Math.max(min, Math.min(max, value));
};

/**
 * Apply trust event to buyer or vendor score
 */
export const applyTrustEvent = async ({
  userId,
  eventKey,
  referenceId,
}) => {
  const event = TRUST_EVENTS[eventKey];
  if (!event) {
    throw new Error("Invalid trust event");
  }

  let trust = await TrustScore.findOne({ userId });

  if (!trust) {
    trust = await TrustScore.create({ userId });
  }

  // 🔒 CORE SCORING RULE (FINAL)
  if (event.role === "VENDOR") {
    trust.vendorScore = clamp(
      trust.vendorScore + event.delta
    );
  }

  if (event.role === "BUYER") {
    trust.buyerScore = clamp(
      trust.buyerScore + event.delta
    );
  }

  // Audit trail (immutable history)
  trust.history.push({
    role: event.role,
    event: eventKey,
    delta: event.delta,
    reason: event.reason,
    referenceId,
  });

  await trust.save();
  return trust;
};
