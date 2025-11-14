// backend/controllers/adminController.js

import User from "../models/User.js";
import KYC from "../models/KYC.js";
import Transaction from "../models/Transaction.js";
import Event from "../models/Event.js";
import TrustScoreHistory from "../models/TrustScoreHistory.js";

//
// 1) List all users
//
export const getAllUsers = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 25;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const search = req.query.search;
    let filter = {};

    if (search) {
      filter = {
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ]
      };
    }

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit).select("-passwordHash").lean(),
      User.countDocuments(filter),
    ]);

    res.json({ users, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 2) Get pending KYC requests
//
export const getPendingKyc = async (req, res) => {
  try {
    const pending = await KYC.find({ status: "pending" })
      .populate("userId", "name email profile")
      .lean();

    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 3) Approve KYC
//
export const approveKyc = async (req, res) => {
  try {
    const { kycId } = req.params;

    const kyc = await KYC.findByIdAndUpdate(
      kycId,
      { status: "verified", reviewedAt: new Date() },
      { new: true }
    ).populate("userId");

    if (!kyc) return res.status(404).json({ msg: "KYC not found" });

    // Log event
    await Event.create({
      userId: req.admin._id,
      type: "kyc_verified",
      payload: { kycId, userId: kyc.userId._id }
    });

    res.json({ msg: "KYC approved", kyc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 4) Reject KYC
//
export const rejectKyc = async (req, res) => {
  try {
    const { kycId } = req.params;

    const kyc = await KYC.findByIdAndUpdate(
      kycId,
      { status: "rejected", reviewedAt: new Date() },
      { new: true }
    ).populate("userId");

    if (!kyc) return res.status(404).json({ msg: "KYC not found" });

    await Event.create({
      userId: req.admin._id,
      type: "kyc_rejected",
      payload: { kycId, userId: kyc.userId._id }
    });

    res.json({ msg: "KYC rejected", kyc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 5) All transactions list
//
export const getAllTransactions = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 25;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) {
      filter.$or = [
        { buyerId: req.query.userId },
        { vendorId: req.query.userId }
      ];
    }

    const [txs, total] = await Promise.all([
      Transaction.find(filter)
        .skip(skip)
        .limit(limit)
        .populate("buyerId vendorId")
        .lean(),
      Transaction.countDocuments(filter),
    ]);

    res.json({ txs, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 6) Admin statistics
//
export const getAdminStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTx = await Transaction.countDocuments();
    const completed = await Transaction.countDocuments({ status: "completed" });
    const pendingKyc = await KYC.countDocuments({ status: "pending" });

    const avgTrust = await User.aggregate([
      {
        $group: {
          _id: null,
          avgBuyer: { $avg: "$buyerTrustScore" },
          avgVendor: { $avg: "$vendorTrustScore" }
        }
      }
    ]);

    res.json({
      totalUsers,
      totalTx,
      completed,
      pendingKyc,
      avgBuyerTrust: avgTrust[0]?.avgBuyer || 0,
      avgVendorTrust: avgTrust[0]?.avgVendor || 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
// 7) System Events list
//
export const getEvents = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const events = await Event.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
