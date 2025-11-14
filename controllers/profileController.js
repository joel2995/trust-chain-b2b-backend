import User from "../models/User.js";
import { requireProfileComplete } from "../utils/validators.js";


export const getProfile = async (req, res) => {
res.json(req.user);
};


export const updateProfile = async (req, res) => {
try {
const updates = req.body;
const user = req.user;
user.profile = { ...(user.profile || {}), ...updates };
await user.save();


if (requireProfileComplete(user.profile) && user.kyc?.docs?.length) {
user.kyc.status = "pending";
await user.save();
}


res.json({ msg: "Profile updated", user });
} catch (err) {
res.status(500).json({ error: err.message });
}
};