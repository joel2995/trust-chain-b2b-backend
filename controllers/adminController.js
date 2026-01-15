import User from "../models/User.js";
import KYC from "../models/KYC.js";
import Transaction from "../models/Transaction.js";
import Event from "../models/Event.js";

// --------------------------------------------------
// USERS
// --------------------------------------------------
export const getAllUsers = async (req, res) => {
  try {
    const limit = Number(req.query.limit || 25);
    const page = Number(req.query.page || 1);
    const skip = (page - 1) * limit;

    const search = req.query.search;
    const filter = search
      ? {
          $or: [
            { name: new RegExp(search, "i") },
            { email: new RegExp(search, "i") },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select("-passwordHash"),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------------------------------------
// SINGLE USER DETAILS (ADMIN)
// --------------------------------------------------
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-passwordHash");

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------------------------------------
// KYC
// --------------------------------------------------
// adminController.js
// --------------------------------------------------
// KYC REVIEW QUEUE (ADMIN)
// --------------------------------------------------
export const getPendingKyc = async (req, res) => {
  try {
    const list = await KYC.find({
      status: "pending",
      "docs.0": { $exists: true } // ensures at least 1 document uploaded
    })
    .populate("userId", "name email phone role kycStatus profile");

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --------------------------------------------------
// USERS WHO HAVE NOT COMPLETED KYC
// --------------------------------------------------
export const getUsersWithPendingKyc = async (req, res) => {
  try {
    const users = await User.find({ kycStatus: "pending" })
      .select("name email phone role kycStatus createdAt");

    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



export const approveKyc = async (req, res) => {
  try {
    const { userId } = req.params;

    const kyc = await KYC.findOne({ userId });
    if (!kyc) return res.status(404).json({ msg: "KYC not found" });

    kyc.status = "verified";
    kyc.reviewedAt = new Date();
    await kyc.save();

    const user = await User.findByIdAndUpdate(
      userId,
      { kycStatus: "verified" },
      { new: true }
    );

    await Event.create({
      userId: req.admin._id,
      type: "KYC_VERIFIED",
      payload: { userId },
    });

    res.json({
      msg: "KYC approved successfully",
      userId,
      kycStatus: user.kycStatus,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const rejectKyc = async (req, res) => {
  try {
    const { userId } = req.params;

    const kyc = await KYC.findOneAndUpdate(
      { userId },
      { status: "rejected", reviewedAt: new Date() },
      { new: true }
    );

    if (!kyc) return res.status(404).json({ msg: "KYC not found" });

    await User.findByIdAndUpdate(userId, {
      kycStatus: "rejected",
    });

    await Event.create({
      userId: req.admin._id,
      type: "KYC_REJECTED",
      payload: { userId },
    });

    res.json({ msg: "KYC rejected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



// --------------------------------------------------
// TRANSACTIONS
// --------------------------------------------------
export const getAllTransactions = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const txs = await Transaction.find(filter)
      .populate("buyerId vendorId")
      .sort({ createdAt: -1 });

    res.json(txs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// --------------------------------------------------
// ADMIN STATS (KYC + USERS + TXS)
// --------------------------------------------------
export const getAdminStats = async (req, res) => {
  try {
    const [
      totalUsers,
      totalTransactions,

      pendingKycUsers,
      approvedKycUsers,
      rejectedKycUsers,
    ] = await Promise.all([
      User.countDocuments(),

      Transaction.countDocuments(),

      // ✅ PENDING (same logic as /users/kyc-pending)
      User.countDocuments({ kycStatus: "pending" }),

      // ✅ APPROVED
      User.countDocuments({ kycStatus: "verified" }),

      // ✅ REJECTED / DISPUTED
      User.countDocuments({ kycStatus: "rejected" }),
    ])

    res.json({
      users: {
        total: totalUsers,
      },

      transactions: {
        total: totalTransactions,
      },

      kyc: {
        pending: pendingKycUsers,
        approved: approvedKycUsers,
        rejected: rejectedKycUsers,
      },
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

// --------------------------------------------------
// EVENTS
// --------------------------------------------------
export const getEvents = async (_, res) => {
  try {
    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const setUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["buyer", "vendor"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    res.json({
      msg: "Role updated successfully",
      userId: user._id,
      role: user.role,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

