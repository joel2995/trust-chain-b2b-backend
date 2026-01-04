import TrustScore from "../models/TrustScore.js";
import { TRUST_EVENTS } from "../constants/trustEvents.js";

export const applyTrustEvent = async ({
  userId,
  eventKey,
  referenceId,
}) => {
  const event = TRUST_EVENTS[eventKey];
  if (!event) throw new Error("Invalid trust event");

  let trust = await TrustScore.findOne({ userId });

  if (!trust) {
    trust = await TrustScore.create({ userId });
  }

  if (event.role === "VENDOR") {
    trust.vendorScore = Math.max(
      0,
      Math.min(100, trust.vendorScore + event.delta)
    );
  }

  if (event.role === "BUYER") {
    trust.buyerScore = Math.max(
      0,
      Math.min(100, trust.buyerScore + event.delta)
    );
  }

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
