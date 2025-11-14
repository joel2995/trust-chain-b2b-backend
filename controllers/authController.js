import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const registerUser = async (req, res) => {
try {
const { name, email, phone, password } = req.body;
if (!name || !email || !password) return res.status(400).json({ msg: "Missing fields" });


const exists = await User.findOne({ email });
if (exists) return res.status(400).json({ msg: "Email already registered" });


const hashed = await bcrypt.hash(password, 10);
const user = await User.create({ name, email, phone, passwordHash: hashed });
const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });


res.status(201).json({ msg: "User registered", token, user: { id: user._id, name: user.name, email: user.email } });
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


const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
} catch (err) {
res.status(500).json({ error: err.message });
}
};