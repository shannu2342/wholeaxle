const express = require('express');
const Category = require('../models/Category');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

const defaultCategories = [
    {
        name: 'Women',
        icon: 'female',
        subcategories: ['Dresses', 'Kurtis', 'Tops', 'Jeans', 'Leggings', 'Sarees'],
    },
    {
        name: 'Men',
        icon: 'male',
        subcategories: ['Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Formal Wear', 'Ethnic Wear'],
    },
    {
        name: 'Kids',
        icon: 'child',
        subcategories: ['Boys Wear', 'Girls Wear', 'Infants', 'School Wear', 'Footwear', 'Accessories'],
    },
    {
        name: 'Accessories',
        icon: 'star',
        subcategories: ['Belts', 'Wallets', 'Sunglasses', 'Caps', 'Scarves', 'Hair Accessories'],
    },
    {
        name: 'Footwear',
        icon: 'shopping-bag',
        subcategories: ['Sneakers', 'Sandals', 'Formal Shoes', 'Heels', 'Flats', 'Sports Shoes'],
    },
    {
        name: 'Bags',
        icon: 'briefcase',
        subcategories: ['Handbags', 'Backpacks', 'Sling Bags', 'Laptop Bags', 'Travel Bags', 'Wallets'],
    },
    {
        name: 'Jewelry',
        icon: 'diamond',
        subcategories: ['Necklaces', 'Earrings', 'Bangles', 'Rings', 'Anklets', 'Sets'],
    },
    {
        name: 'Watches',
        icon: 'clock-o',
        subcategories: ['Analog', 'Digital', 'Smart Watches', 'Luxury', 'Sports', 'Kids Watches'],
    },
];

// @route   GET /api/categories
// @desc    List categories
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const existingCount = await Category.countDocuments();
    if (existingCount === 0) {
        await Category.insertMany(defaultCategories);
    }

    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    res.json({ categories });
}));

module.exports = router;

