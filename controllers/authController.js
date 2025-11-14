// backend/controllers/authController.js
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ msg: "Missing fields" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ msg: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);
    // role MUST NOT be accepted from client; default 'user' in model
    const user = await User.create({ name, email, phone, passwordHash: hashed });
    res.status(201).json({ msg: "User registered", user: { _id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: "User not found" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ msg: "Invalid password" });

    // sign token with id and (optionally) role — but role for users is not admin
    const token = jwt.sign({ id: user._id, role: user.role || "user" }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ token, name: user.name, id: user._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
