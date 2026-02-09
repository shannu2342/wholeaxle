const express = require('express');
const { body, validationResult } = require('express-validator');
const Return = require('../models/Return');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/returns
// @desc    List returns
// @access  Private
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const [total, returns] = await Promise.all([
        Return.countDocuments({}),
        Return.find({}).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);
    res.json({
        returns: returns.map((entry) => ({ ...entry, id: entry._id })),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            hasMore: skip + returns.length < total,
        },
    });
}));

// @route   POST /api/returns
// @desc    Create return request
// @access  Private
router.post(
    '/',
    authMiddleware,
    [
        body('orderId').notEmpty().withMessage('Order ID is required'),
        body('reason').notEmpty().withMessage('Reason is required'),
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array(),
            });
        }

        const payload = {
            orderId: req.body.orderId,
            customerId: req.body.customerId,
            vendorId: req.body.vendorId,
            items: req.body.items || [],
            reason: req.body.reason,
            description: req.body.description,
            primaryReason: req.body.primaryReason,
            detailedReason: req.body.detailedReason,
            images: req.body.images || [],
            status: 'requested',
            priority: req.body.priority || 'normal',
            requestedAt: new Date(),
            estimatedProcessingTime: req.body.estimatedProcessingTime || '3-5 business days',
            refundDetails: req.body.refundDetails || {},
            pickupDetails: req.body.pickupDetails || {},
            timeline: [
                {
                    status: 'return_requested',
                    timestamp: new Date(),
                    description: 'Return request submitted by customer',
                },
            ],
        };

        const request = await Return.create(payload);

        res.status(201).json({
            returnRequest: {
                ...request.toObject(),
                id: request._id,
            },
        });
    })
);

// @route   PATCH /api/returns/:id/status
// @desc    Update return status
// @access  Private
router.patch('/:id/status', authMiddleware, asyncHandler(async (req, res) => {
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
    }

    const { status, notes } = req.body;
    returnRequest.status = status || returnRequest.status;
    returnRequest.timeline = returnRequest.timeline || [];
    returnRequest.timeline.push({
        status: status || returnRequest.status,
        timestamp: new Date(),
        description: notes || `Return status updated to ${status}`,
    });

    await returnRequest.save();
    res.json({ returnRequest: { ...returnRequest.toObject(), id: returnRequest._id } });
}));

// @route   POST /api/returns/:id/pickup
// @desc    Schedule pickup
// @access  Private
router.post('/:id/pickup', authMiddleware, asyncHandler(async (req, res) => {
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
    }

    returnRequest.pickupDetails = {
        ...(returnRequest.pickupDetails || {}),
        ...req.body,
        status: 'scheduled',
        trackingNumber: req.body.trackingNumber || `TRK${Date.now()}`,
    };

    returnRequest.timeline.push({
        status: 'pickup_scheduled',
        timestamp: new Date(),
        description: 'Pickup scheduled',
    });

    await returnRequest.save();
    res.json({ pickup: returnRequest.pickupDetails, returnRequest: { ...returnRequest.toObject(), id: returnRequest._id } });
}));

// @route   POST /api/returns/:id/quality-check
// @desc    Process quality check
// @access  Private
router.post('/:id/quality-check', authMiddleware, asyncHandler(async (req, res) => {
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
    }

    returnRequest.qualityCheck = {
        ...req.body,
        checkedAt: new Date(),
    };
    returnRequest.timeline.push({
        status: 'quality_check',
        timestamp: new Date(),
        description: 'Quality check completed',
    });

    await returnRequest.save();
    res.json({ qualityCheck: returnRequest.qualityCheck, returnRequest: { ...returnRequest.toObject(), id: returnRequest._id } });
}));

// @route   POST /api/returns/:id/refund
// @desc    Process refund
// @access  Private
router.post('/:id/refund', authMiddleware, asyncHandler(async (req, res) => {
    const returnRequest = await Return.findById(req.params.id);
    if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
    }

    const refund = {
        ...req.body,
        status: req.body.status || 'processing',
        initiatedAt: new Date(),
        reference: req.body.reference || `RF${Date.now()}`,
        transactionId: req.body.transactionId || `txn_${Date.now()}`,
    };
    returnRequest.refund = refund;
    returnRequest.timeline.push({
        status: 'refund_initiated',
        timestamp: new Date(),
        description: 'Refund initiated',
    });

    await returnRequest.save();
    res.json({ refund, returnRequest: { ...returnRequest.toObject(), id: returnRequest._id } });
}));

// @route   GET /api/returns/analytics
// @desc    Return analytics
// @access  Private
router.get('/analytics/summary', authMiddleware, asyncHandler(async (req, res) => {
    const totalReturns = await Return.countDocuments({});
    const statusDistribution = await Return.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
        overview: {
            totalReturns,
        },
        statusDistribution: statusDistribution.map((entry) => ({ status: entry._id, count: entry.count })),
    });
}));

module.exports = router;
