const express = require('express');
const products = require('../../models/products');
const router = express.Router();
// const Product = require('../models/product');



// ✅ GET all products
router.get("/get-all-products", async (req, res) => {
    try {
        const allProducts = await products.find().sort({ date: -1 });

        if (allProducts.length === 0) {
            return res.status(404).json({ status: false, msg: "No products found" });
        }

        res.status(200).json({
            status: true,
            msg: `Found ${allProducts.length} products`,
            products: allProducts,
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        res.status(500).json({ status: false, msg: "Internal server error" });
    }
});
module.exports = router;