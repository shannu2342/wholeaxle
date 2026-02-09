const express = require('express');
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const generateOrderNumber = () => `WHX-${Date.now()}`;

// @route   GET /api/orders
// @desc    List orders (optionally by status)
// @access  Private
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [total, orders] = await Promise.all([
        Order.countDocuments(query),
        Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);

    res.json({
        orders: orders.map((order) => ({
            ...order,
            id: order._id,
        })),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            hasMore: skip + orders.length < total,
        },
    });
}));

// @route   POST /api/orders
// @desc    Create order
// @access  Private
router.post(
    '/',
    authMiddleware,
    [
        body('items').isArray({ min: 1 }).withMessage('Items are required'),
        body('finalAmount').isNumeric().withMessage('Final amount is required'),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array(),
            });
        }

        const order = await Order.create({
            ...req.body,
            orderNumber: req.body.orderNumber || generateOrderNumber(),
            customer: {
                id: req.userId,
                name: req.user?.fullName || req.user?.email,
                phone: req.user?.phone,
                address: req.body?.customer?.address || req.body?.shipping?.address,
            },
        });

        res.status(201).json({
            order: {
                ...order.toObject(),
                id: order._id,
            },
        });
    })
);

module.exports = router;

