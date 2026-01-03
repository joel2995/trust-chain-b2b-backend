export const allowedTransitions = {
  CREATED: ["PAID"],
  PAID: ["IN_ESCROW"],
  IN_ESCROW: ["DELIVERED", "DISPUTED"],
  DELIVERED: ["RELEASED"],
  DISPUTED: ["REFUNDED"],
};

export const canTransition = (from, to) => {
  return allowedTransitions[from]?.includes(to);
};
