// services/escrowService.js
// MOCK ESCROW SERVICE – Razorpay ready

export const createHold = async ({ transactionId, amount }) => {
  return {
    provider: "mock",
    holdId: `HOLD_${transactionId}_${Date.now()}`,
    amountHeld: amount,
    createdAt: new Date(),
  };
};

export const releaseHold = async ({ holdId }) => {
  return {
    released: true,
    releaseTxId: `REL_${Date.now()}`,
    releasedAt: new Date(),
  };
};
