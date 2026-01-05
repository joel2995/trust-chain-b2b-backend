import KYC from "../models/KYC.js";

export const getMyKycStatus = async (req, res) => {
  try {
    const kyc = await KYC.findOne({ userId: req.user._id })
      .select("status docs reviewedAt");

    if (!kyc) {
      return res.json({
        status: "not_submitted",
        docs: [],
      });
    }

    res.json({
      status: kyc.status,
      docs: kyc.docs,
      reviewedAt: kyc.reviewedAt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
