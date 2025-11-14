// Mock escrow service – replace with Razorpay/Stripe later

export const createHold = async ({ transactionId, amount }) => {
  return {
    provider: "mock",
    holdId: `HOLD_${transactionId}_${Date.now()}`,
    amountHeld: amount,
  };
};

export const releaseHold = async ({ holdId }) => {
  return {
    released: true,
    releaseTxId: `REL_${Date.now()}`,
  };
};
