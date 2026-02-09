const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    List products with optional filters
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        category,
        subcategory,
        search,
        minPrice,
        maxPrice,
    } = req.query;

    const query = {};

    if (category) {
        query.category = category;
    }
    if (subcategory) {
        query.subcategory = subcategory;
    }
    if (search) {
        query.$text = { $search: search };
    }
    if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, products] = await Promise.all([
        Product.countDocuments(query),
        Product.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(Number(limit))
            .lean(),
    ]);

    res.json({
        products: products.map((product) => ({
            ...product,
            id: product._id,
        })),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            hasMore: skip + products.length < total,
        },
    });
}));

// @route   POST /api/products
// @desc    Create product
// @access  Private
router.post(
    '/',
    authMiddleware,
    [
        body('name').notEmpty().withMessage('Product name is required'),
        body('price').isNumeric().withMessage('Price must be a number'),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array(),
            });
        }

        const product = await Product.create({
            ...req.body,
            vendor: {
                id: req.userId,
                name: req.user?.fullName || req.user?.email,
            },
        });

        res.status(201).json({
            product: {
                ...product.toObject(),
                id: product._id,
            },
        });
    })
);

// @route   POST /api/products/bulk
// @desc    Bulk create products (stub)
// @access  Private
router.post('/bulk', authMiddleware, asyncHandler(async (req, res) => {
    const items = Array.isArray(req.body.products) ? req.body.products : [];
    const created = await Product.insertMany(
        items.map((product) => ({
            ...product,
            vendor: {
                id: req.userId,
                name: req.user?.fullName || req.user?.email,
            },
        })),
        { ordered: false }
    );

    res.status(201).json({
        jobId: `bulk_${Date.now()}`,
        totalProducts: items.length,
        successful: created.length,
        failed: items.length - created.length,
        errors: [],
        status: 'completed',
    });
}));

module.exports = router;
