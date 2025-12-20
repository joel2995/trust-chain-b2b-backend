import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";

export const adminProtect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ msg: "Admin token missing" });
    }

    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (decoded.type !== "admin") {
      return res.status(401).json({ msg: "Invalid admin token" });
    }

    const admin = await Admin.findById(decoded.id).select("-passwordHash");
    if (!admin) {
      return res.status(401).json({ msg: "Admin not found" });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      msg: "Admin unauthorized",
      error: err.message,
    });
  }
};
