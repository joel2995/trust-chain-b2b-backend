import Event from "../models/Event.js";

export const logEvent = async ({
  transactionId = null,
  userId = null,
  type,
  payload = {},
}) => {
  try {
    await Event.create({
      transactionId,
      userId,
      type: type.toUpperCase(),
      payload,
      createdAt: new Date(),
    });
  } catch (err) {
    console.warn("⚠ Event log failed:", err.message);
  }
};
