// utils/validators.js
export const requireProfileComplete = (profile) => {
if (!profile) return false;
const { addressLine1, city, state, pin } = profile;
return !!(addressLine1 && city && state && pin);
};


export const requireKycVerifiedOrPending = (kyc) => {
if (!kyc) return false;
return ["pending", "verified"].includes(kyc.status);
};


export const validateTransactionItems = (items) => {
if (!Array.isArray(items) || items.length === 0) return false;
return items.every((i) => i.name && i.qty > 0 && i.price >= 0);
};