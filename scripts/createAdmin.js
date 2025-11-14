// backend/scripts/createAdmin.js
import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import Admin from "../models/Admin.js";
import connectDB from "../config/db.js";

dotenv.config();

const run = async () => {
  try {
    await connectDB();
    const email = process.env.INIT_ADMIN_EMAIL;
    const pass = process.env.INIT_ADMIN_PASS;
    if (!email || !pass) {
      console.error("Missing INIT_ADMIN_EMAIL or INIT_ADMIN_PASS in .env");
      process.exit(1);
    }
    const existing = await Admin.findOne({ email });
    if (existing) {
      console.log("Admin already exists:", email);
      process.exit(0);
    }
    const hashed = await bcrypt.hash(pass, 10);
    const admin = await Admin.create({ email, passwordHash: hashed, name: "Platform Admin" });
    console.log("Created admin:", admin.email, admin._id);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

run();
