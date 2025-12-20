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
// KYC
// --------------------------------------------------
export const getPendingKyc = async (_, res) => {
  try {
    const list = await KYC.find({ status: "pending" }).populate(
      "userId",
      "name email profile"
    );
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveKyc = async (req, res) => {
  try {
    const kyc = await KYC.findByIdAndUpdate(
      req.params.kycId,
      { status: "verified", reviewedAt: new Date() },
      { new: true }
    ).populate("userId");

    if (!kyc) return res.status(404).json({ msg: "KYC not found" });

    await Event.create({
      userId: req.admin._id,
      type: "kyc_verified",
      payload: { userId: kyc.userId._id },
    });

    res.json({ msg: "KYC approved", kyc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const rejectKyc = async (req, res) => {
  try {
    const kyc = await KYC.findByIdAndUpdate(
      req.params.kycId,
      { status: "rejected", reviewedAt: new Date() },
      { new: true }
    );

    if (!kyc) return res.status(404).json({ msg: "KYC not found" });

    await Event.create({
      userId: req.admin._id,
      type: "kyc_rejected",
      payload: { kycId: kyc._id },
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
// STATS
// --------------------------------------------------
export const getAdminStats = async (_, res) => {
  try {
    const [users, txs, pendingKyc] = await Promise.all([
      User.countDocuments(),
      Transaction.countDocuments(),
      KYC.countDocuments({ status: "pending" }),
    ]);

    res.json({ users, txs, pendingKyc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

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
