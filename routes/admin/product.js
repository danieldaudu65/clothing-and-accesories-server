const express = require("express");
const router = express.Router();
const products = require("../../models/products");
const upload = require("../../util/multer");
const cloudinary = require("../../util/cloudinary");
const verifyAdmin = require("../../middlewave/authMiddleware");
// const verifyAdmin = require("../../middleware/verifyAdmin");

// ============================
// 📦 ADD PRODUCT
// ============================
router.post("/addproduct", verifyAdmin, async (req, res) => {
  try {
    const { name, images, newproductPrice, oldproductPrice, sizes, colors } = req.body;

    if (!name || !images || !newproductPrice) {
      return res.status(400).json({ success: false, msg: "All fields are required" });
    }

    const productList = await products.find({});
    const id = productList.length > 0 ? productList[productList.length - 1].id + 1 : 1;

    const newProduct = new products({
      id,
      name,
      images,
      newproductPrice,
      oldproductPrice,
      sizes: sizes || [],   // ✅ Save sizes if available
      colors: colors || [], // ✅ Save colors if available
    });

    await newProduct.save();
    res.status(200).json({ success: true, msg: "Product added successfully", product: newProduct });
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).json({ success: false, error: "Error Saving Product" });
  }
});



// ============================
// 🗑️ REMOVE PRODUCT
// ============================


router.post("/removeproduct", verifyAdmin, async (req, res) => {
  try {
    const { id } = req.body;

    const deletedProduct = await products.findOneAndDelete({ id });
    if (!deletedProduct) {
      return res.status(400).json({ success: false, msg: "Product not found" });
    }

    res.status(200).json({ success: true, msg: "Product removed successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, error: "Error deleting product" });
  }
});



// ============================
// 📃 GET ALL PRODUCTS
// ============================
router.get("/all_product", verifyAdmin, async (req, res) => {
  try {
    const all_products = await products.find({});
    if (!all_products.length) {
      return res.status(404).json({ success: false, msg: "No products found" });
    }

    res.status(200).json({
      success: true,
      msg: `There are ${all_products.length} products available`,
      all_products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

module.exports = router;
