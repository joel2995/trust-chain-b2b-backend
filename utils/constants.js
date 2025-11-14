// utils/constants.js
export const ROLES = {
  BUYER: "buyer",
  VENDOR: "vendor",
};

export const KYC_STATUS = {
  NONE: "none",
  PENDING: "pending",
  VERIFIED: "verified",
  REJECTED: "rejected",
};

export const DEFAULT_TRUST_SCORE = 100;
export const HIGH_VALUE_THRESHOLD = Number(process.env.HIGH_VALUE_THRESHOLD || 50000);
