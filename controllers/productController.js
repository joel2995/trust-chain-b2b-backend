import Product from "../models/Product.js";

// Vendor creates product
export const createProduct = async (req, res) => {
  try {
    if (req.user.role !== "vendor") {
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
    if (req.user.role !== "vendor") {
      return res.status(403).json({ msg: "Only vendors can update products" });
    }

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
    if (req.user.role !== "vendor") {
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
