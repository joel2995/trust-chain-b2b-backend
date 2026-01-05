import fs from "fs";
import Product from "../models/Product.js";
import { pinFileToPinata } from "../config/ipfs.js";
// Vendor creates product
export const createProduct = async (req, res) => {
  try {
    if (req.user.activeRole !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can create products" });
    }

    const product = await Product.create({
      ...req.body,
      vendorId: req.user._id,
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Marketplace list
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ active: true })
      .populate("vendorId", "name overallTrustScore");

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Single product
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("vendorId", "name overallTrustScore");

    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Vendor update
export const updateProduct = async (req, res) => {
  try {
    if (req.user.activeRole !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can update products" });
    }

    delete req.body.stock; // 🔒 optional safety

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, vendorId: req.user._id },
      req.body,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ msg: "Product not found or unauthorized" });
    }

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Vendor delete
export const deleteProduct = async (req, res) => {
  try {
    if (req.user.activeRole !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can delete products" });
    }

    const deleted = await Product.findOneAndDelete({
      _id: req.params.id,
      vendorId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({ msg: "Product not found or unauthorized" });
    }

    res.json({ msg: "Product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyProducts = async (req, res) => {
  if (req.user.role !== "vendor") {
    return res.status(403).json({ msg: "Only vendors can access this" });
  }

  const products = await Product.find({
    vendorId: req.user._id,
  });

  res.json(products);
};


export const replaceProductImage = async (req, res) => {
  try {
    if (req.user.activeRole !== "vendor") {
      return res.status(403).json({ msg: "Vendor access only" });
    }

    const { id, oldCid } = req.params;

    const product = await Product.findOne({
      _id: id,
      vendorId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ msg: "Product not found or unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ msg: "No image uploaded" });
    }

    const pin = await pinFileToPinata(req.file.path);
    fs.unlinkSync(req.file.path);

    product.images = product.images.map((img) =>
      img === oldCid ? pin.cid : img
    );

    await product.save();

    res.json({
      msg: "Product image replaced",
      newCid: pin.cid,
      images: product.images,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


export const deleteProductImage = async (req, res) => {
  try {
    if (req.user.activeRole !== "vendor") {
      return res.status(403).json({ msg: "Vendor access only" });
    }

    const { id, cid } = req.params;

    const product = await Product.findOne({
      _id: id,
      vendorId: req.user._id,
    });

    if (!product) {
      return res.status(404).json({ msg: "Product not found or unauthorized" });
    }

    product.images = product.images.filter((img) => img !== cid);
    await product.save();

    res.json({
      msg: "Product image deleted",
      images: product.images,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
