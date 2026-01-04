export const TRUST_EVENTS = {
  // ───── VENDOR EVENTS ─────
  VENDOR_SUCCESSFUL_DELIVERY: {
    role: "VENDOR",
    delta: +2,
    reason: "Successful delivery",
  },

  VENDOR_LATE_DELIVERY: {
    role: "VENDOR",
    delta: -2,
    reason: "Late delivery",
  },

  VENDOR_DISPUTE_LOST: {
    role: "VENDOR",
    delta: -8,
    reason: "Dispute lost",
  },

  VENDOR_DISPUTE_WON: {
    role: "VENDOR",
    delta: +3,
    reason: "Dispute resolved in favor",
  },

  VENDOR_POOR_IMAGE_QUALITY: {
    role: "VENDOR",
    delta: -3,
    reason: "Poor product image quality",
  },

  // ───── BUYER EVENTS ─────
  BUYER_SUCCESSFUL_PAYMENT: {
    role: "BUYER",
    delta: +1,
    reason: "Successful payment",
  },

  BUYER_DISPUTE_ABUSE: {
    role: "BUYER",
    delta: -6,
    reason: "Dispute abuse detected",
  },

  BUYER_PAYMENT_FAILURE: {
    role: "BUYER",
    delta: -4,
    reason: "Payment failure",
  },

  BUYER_FRAUD_ATTEMPT: {
    role: "BUYER",
    delta: -20,
    reason: "Fraud attempt detected",
  },
};
