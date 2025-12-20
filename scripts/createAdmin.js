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
      console.error("❌ Missing admin credentials in .env");
      process.exit(1);
    }

    const exists = await Admin.findOne({ email });
    if (exists) {
      console.log("ℹ Admin already exists:", email);
      process.exit(0);
    }

    const passwordHash = await bcrypt.hash(pass, 12);
    await Admin.create({
      email,
      passwordHash,
      name: "Platform Admin",
    });

    console.log("✅ Admin created:", email);
    process.exit(0);
  } catch (err) {
    console.error("Admin creation failed:", err);
    process.exit(1);
  }
};

run();
