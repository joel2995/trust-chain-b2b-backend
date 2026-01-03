import Transaction from "../models/Transaction.js";
import { canTransition } from "../utils/transactionStateMachine.js";

export const updateTransactionStatus = async (
  transactionId,
  newStatus,
  extra = {}
) => {
  const tx = await Transaction.findById(transactionId);
  if (!tx) throw new Error("Transaction not found");

  if (!canTransition(tx.status, newStatus)) {
    throw new Error(
      `Invalid state transition: ${tx.status} → ${newStatus}`
    );
  }

  // Optional data (dispute reason)
  if (newStatus === "DISPUTED") {
    tx.disputeReason = extra.disputeReason || "Not specified";
  }

  tx.status = newStatus;
  await tx.save();

  return tx;
};
