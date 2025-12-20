import User from "../models/User.js";
import KYC from "../models/KYC.js";
import { requireProfileComplete } from "../utils/validators.js";

// -------------------------------------
// GET USER PROFILE
// -------------------------------------
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .lean();

    const kyc = await KYC.findOne({ userId: user._id }).lean();

    res.json({ user, kyc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------
// UPDATE USER PROFILE
// -------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    const user = await User.findById(req.user._id);
    user.profile = { ...(user.profile || {}), ...updates };
    await user.save();

    // If profile is complete → trigger KYC pending (if exists)
    if (requireProfileComplete(user.profile)) {
      await KYC.findOneAndUpdate(
        { userId: user._id },
        { status: "pending" },
        { upsert: true }
      );
    }

    res.json({
      msg: "Profile updated",
      profile: user.profile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
