import Product from "../models/Product.js";

// Vendor creates product
export const createProduct = async (req, res) => {
  const product = await Product.create({
    ...req.body,
    vendorId: req.user._id,
  });
  res.status(201).json(product);
};

// Marketplace list
export const getProducts = async (req, res) => {
  const products = await Product.find({ active: true })
    .populate("vendorId", "name overallTrustScore");
  res.json(products);
};

// Single product
export const getProductById = async (req, res) => {
  const product = await Product.findById(req.params.id)
    .populate("vendorId", "name overallTrustScore");
  res.json(product);
};

// Vendor update
export const updateProduct = async (req, res) => {
  const product = await Product.findOneAndUpdate(
    { _id: req.params.id, vendorId: req.user._id },
    req.body,
    { new: true }
  );
  res.json(product);
};

// Vendor delete
export const deleteProduct = async (req, res) => {
  await Product.findOneAndDelete({
    _id: req.params.id,
    vendorId: req.user._id,
  });
  res.json({ msg: "Product deleted" });
};
