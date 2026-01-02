export const createHold = async ({ transactionId, amount }) => {
  return {
    provider: "razorpay",
    holdId: `ESCROW_${transactionId}_${Date.now()}`,
    amountHeld: amount,
    createdAt: new Date(),
  };
};
