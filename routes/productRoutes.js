import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadMiddleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
  addProductImage,
  deleteProductImage,
  replaceProductImage,
} from "../controllers/productController.js";

const router = express.Router();

// Marketplace
router.get("/", getProducts);
// Vendor dashboard
router.get("/my", protect, getMyProducts);

router.get("/:id", getProductById);

// Product CRUD
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

// 📸 Product Images (Vendor only)
router.post(
  "/:id/images",
  protect,
  upload.single("image"),
  addProductImage
);

router.delete(
  "/:id/images/:cid",
  protect,
  deleteProductImage
);

router.put(
  "/:id/images/:oldCid",
  protect,
  upload.single("image"),
  replaceProductImage
);

export default router;
