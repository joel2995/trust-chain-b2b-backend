import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getMyProducts,
} from "../controllers/productController.js";

const router = express.Router();

// Marketplace (buyer + vendor browse)
router.get("/", getProducts);

// Vendor dashboard (OWN products)
router.get("/my", protect, getMyProducts);

// Single product
router.get("/:id", getProductById);

// Vendor CRUD (OWN products only)
router.post("/", protect, createProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

export default router;
