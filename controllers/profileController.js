import User from "../models/User.js";
import KYC from "../models/KYC.js";
import UserEvent from "../models/UserEvent.js";
import { requireProfileComplete } from "../utils/validators.js";
import { logUserEvent } from "../utils/logUserEvent.js";

// -------------------------------------
// GET USER PROFILE
// -------------------------------------
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-passwordHash")
      .lean();

    const kyc = await KYC.findOne({ userId: user._id }).lean();

    // Fetch recent events (latest 20)
    const events = await UserEvent.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ user, kyc, events });
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

    // Log profile update
    await logUserEvent({
      userId: user._id,
      title: "Profile Updated",
      description: "User updated profile information",
      mode: user.activeRole,
      type: "profile",
    });

    // If profile is complete → KYC pending
    if (requireProfileComplete(user.profile)) {
      await KYC.findOneAndUpdate(
        { userId: user._id },
        { status: "pending" },
        { upsert: true }
      );

      await logUserEvent({
        userId: user._id,
        title: "KYC Pending",
        description: "Profile completed, KYC verification pending",
        mode: user.activeRole,
        type: "kyc",
      });
    }

    res.json({
      msg: "Profile updated",
      profile: user.profile,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------
// SWITCH USER ROLE
// -------------------------------------
export const switchUserRole = async (req, res) => {
  try {
    const user = req.user;

    const previousRole = user.activeRole;
    user.activeRole = previousRole === "buyer" ? "vendor" : "buyer";
    await user.save();

    await logUserEvent({
      userId: user._id,
      title: "Mode Switched",
      description: `User switched from ${previousRole} to ${user.activeRole} mode`,
      mode: user.activeRole,
      type: "role",
    });

    res.status(200).json({
      message: "Role switched successfully",
      activeRole: user.activeRole,
    });
  } catch (error) {
    console.error("Switch role error:", error);
    res.status(500).json({ message: "Failed to switch role" });
  }
};
