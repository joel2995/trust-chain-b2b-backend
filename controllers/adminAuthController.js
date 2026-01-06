import Admin from "../models/Admin.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Missing credentials" });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(404).json({ msg: "Admin not found" });

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid)
      return res.status(401).json({ msg: "Invalid credentials" });

    const token = jwt.sign(
      { id: admin._id, type: "admin" },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "12h" }
    );

    admin.lastLoginAt = new Date();
    await admin.save();

    res.json({
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select("-passwordHash")

    if (!admin) {
      return res.status(404).json({ msg: "Admin not found" })
    }

    res.json({
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: "admin",
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

