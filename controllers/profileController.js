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
// -------------------------------------
// UPDATE USER PROFILE (ONLY NAME & PHONE)
// -------------------------------------
export const updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;

    const user = await User.findById(req.user._id);

    // 🔒 Only allow these fields
    if (typeof name === "string") {
      user.name = name.trim();
    }

    if (typeof phone === "string") {
      user.phone = phone.trim();
    }

    await user.save();

    // 🔔 Log profile update
    await logUserEvent({
      userId: user._id,
      title: "Profile Updated",
      description: "User updated name or phone number",
      mode: user.activeRole,
      type: "profile",
    });

    res.json({
      message: "Profile updated successfully",
      user: {
        _id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
      },
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
