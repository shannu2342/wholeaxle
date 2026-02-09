const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const Category = require('../models/Category');
const Product = require('../models/Product');

const router = express.Router();

// @route   GET /api/content/home
// @desc    Get home page content (banners, brands, FAQs)
// @access  Public
router.get('/home', asyncHandler(async (req, res) => {
    const [categories, brands] = await Promise.all([
        Category.find({ isActive: true }).sort({ name: 1 }).limit(6).lean(),
        Product.distinct('vendor.name'),
    ]);

    const banners = categories.map((category) => ({
        id: `banner_${category._id}`,
        title: category.name,
        subtitle: `Explore ${category.name} catalog`,
    }));

    const brandList = (brands || [])
        .filter(Boolean)
        .slice(0, 12)
        .map((name, index) => ({
            id: `brand_${index}`,
            name,
        }));

    res.json({
        banners,
        brands: brandList,
        faqs: [],
    });
}));

module.exports = router;
