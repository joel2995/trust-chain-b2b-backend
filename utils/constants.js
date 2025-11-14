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

export const HIGH_VALUE_THRESHOLD = Number(
  process.env.HIGH_VALUE_THRESHOLD || 50000
);

// TrustScore weighting
export const TRUST_WEIGHTS = {
  buyer: 0.6,
  vendor: 0.4,
};

// ML Engine
export const ML_ENABLED = process.env.ML_ENABLED === "true";
export const ML_SERVICE_URL = process.env.ML_SERVICE_URL || null;

// Blockchain network
export const BLOCKCHAIN_NETWORK = process.env.BLOCKCHAIN_NETWORK || "ethereum";
