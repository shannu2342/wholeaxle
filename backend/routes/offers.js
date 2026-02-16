const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Offer = require('../models/Offer');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

const CLOSED_STATUSES = ['accepted', 'rejected', 'withdrawn', 'expired', 'cancelled', 'completed'];

// @route   GET /api/offers
// @desc    Get user's offers
// @access  Private
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['pending', 'sent', 'viewed', 'countered', 'accepted', 'rejected', 'expired', 'withdrawn', 'cancelled', 'completed']).withMessage('Invalid status'),
    query('type').optional().isIn(['sent', 'received']).withMessage('Invalid type')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {
        $or: [
            { buyer: req.userId },
            { seller: req.userId }
        ],
        isDeleted: false
    };

    if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.type === 'sent') {
        filter.buyer = req.userId;
    } else if (req.query.type === 'received') {
        filter.seller = req.userId;
    }

    // Get offers
    const offers = await Offer.find(filter)
        .populate('buyer', 'firstName lastName businessName avatar')
        .populate('seller', 'firstName lastName businessName avatar')
        .populate('product.productId', 'name images category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get total count
    const total = await Offer.countDocuments(filter);

    res.json({
        offers,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
}));

// @route   GET /api/offers/analytics/summary
// @desc    Get offer analytics summary
// @access  Private
router.get('/analytics/summary', asyncHandler(async (req, res) => {
    const userId = req.userId;

    // Get stats for offers sent
    const sentStats = await Offer.aggregate([
        { $match: { buyer: userId, isDeleted: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$pricing.offerPrice' }
            }
        }
    ]);

    // Get stats for offers received
    const receivedStats = await Offer.aggregate([
        { $match: { seller: userId, isDeleted: false } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalValue: { $sum: '$pricing.offerPrice' }
            }
        }
    ]);

    // Calculate response rate
    const totalSent = await Offer.countDocuments({ buyer: userId, isDeleted: false });
    const respondedSent = await Offer.countDocuments({
        buyer: userId,
        status: { $in: ['accepted', 'rejected', 'countered'] },
        isDeleted: false
    });

    const totalReceived = await Offer.countDocuments({ seller: userId, isDeleted: false });
    const respondedReceived = await Offer.countDocuments({
        seller: userId,
        status: { $in: ['accepted', 'rejected', 'countered'] },
        isDeleted: false
    });

    res.json({
        sent: {
            total: totalSent,
            responded: respondedSent,
            responseRate: totalSent > 0 ? (respondedSent / totalSent * 100).toFixed(2) : 0,
            stats: sentStats
        },
        received: {
            total: totalReceived,
            responded: respondedReceived,
            responseRate: totalReceived > 0 ? (respondedReceived / totalReceived * 100).toFixed(2) : 0,
            stats: receivedStats
        }
    });
}));

// @route   GET /api/offers/:offerId
// @desc    Get specific offer
// @access  Private
router.get('/:offerId', [
    param('offerId').isMongoId().withMessage('Invalid offer ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { offerId } = req.params;

    const offer = await Offer.findOne({
        _id: offerId,
        $or: [
            { buyer: req.userId },
            { seller: req.userId }
        ],
        isDeleted: false
    })
        .populate('buyer', 'firstName lastName businessName avatar phone email')
        .populate('seller', 'firstName lastName businessName avatar phone email')
        .populate('product.productId')
        .populate('negotiations.fromUser', 'firstName lastName businessName')
        .populate('negotiations.toUser', 'firstName lastName businessName');

    if (!offer) {
        return res.status(404).json({
            error: 'Offer not found',
            code: 'OFFER_NOT_FOUND'
        });
    }

    res.json({ offer });
}));

// @route   POST /api/offers
// @desc    Create new offer
// @access  Private
router.post('/', [
    body('title').notEmpty().withMessage('Title is required').isLength({ max: 200 }).withMessage('Title too long'),
    body('description').notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description too long'),
    body('seller').isMongoId().withMessage('Invalid seller ID'),
    body('product').isObject().withMessage('Product information is required'),
    body('product.productId').isMongoId().withMessage('Invalid product ID'),
    body('product.name').notEmpty().withMessage('Product name is required'),
    body('pricing').isObject().withMessage('Pricing information is required'),
    body('pricing.originalPrice').isFloat({ min: 0 }).withMessage('Invalid original price'),
    body('pricing.offerPrice').isFloat({ min: 0 }).withMessage('Invalid offer price'),
    body('quantity').isObject().withMessage('Quantity information is required'),
    body('quantity.requested').isInt({ min: 1 }).withMessage('Invalid requested quantity'),
    body('quantity.unit').notEmpty().withMessage('Unit is required'),
    body('validity').isObject().withMessage('Validity information is required'),
    body('validity.endDate').isISO8601().withMessage('Invalid end date')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const offerData = {
        ...req.body,
        buyer: req.userId,
        negotiations: [
            {
                fromUser: req.userId,
                toUser: req.body.seller,
                action: 'sent',
                message: req.body.description || '',
                timestamp: new Date()
            }
        ]
    };

    // Check if seller is valid (not the same as buyer)
    if (offerData.seller === req.userId.toString()) {
        return res.status(400).json({
            error: 'Cannot create offer for yourself',
            code: 'INVALID_SELLER'
        });
    }

    const offer = new Offer(offerData);
    await offer.save();

    // Populate for response
    await offer.populate('seller', 'firstName lastName businessName avatar');
    await offer.populate('buyer', 'firstName lastName businessName avatar');

    logger.info(`Offer created: ${offer.offerId} by user ${req.userId}`);

    res.status(201).json({
        message: 'Offer created successfully',
        offer: offer.toJSON()
    });
}));

// @route   PUT /api/offers/:offerId/respond
// @desc    Respond to an offer
// @access  Private
router.put('/:offerId/respond', [
    param('offerId').isMongoId().withMessage('Invalid offer ID'),
    body('action').isIn(['accept', 'reject', 'counter']).withMessage('Invalid action'),
    body('message').optional().isString().withMessage('Message must be a string'),
    body('changes').optional().isObject().withMessage('Changes must be an object')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { offerId } = req.params;
    const { action, message, changes } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) {
        return res.status(404).json({
            error: 'Offer not found',
            code: 'OFFER_NOT_FOUND'
        });
    }

    const userId = req.userId.toString();
    const isBuyer = offer.buyer.toString() === userId;
    const isSeller = offer.seller.toString() === userId;

    if (!isBuyer && !isSeller) {
        return res.status(403).json({
            error: 'You are not allowed to respond to this offer',
            code: 'UNAUTHORIZED'
        });
    }

    if (CLOSED_STATUSES.includes(offer.status)) {
        return res.status(400).json({
            error: `Offer is already ${offer.status} and cannot be updated`,
            code: 'OFFER_CLOSED'
        });
    }

    const lastNegotiation = offer.negotiations?.[offer.negotiations.length - 1];
    const isInitialOffer = offer.status === 'pending' || offer.status === 'sent';

    if (action === 'counter') {
        if (isInitialOffer && !isSeller) {
            return res.status(403).json({
                error: 'Only the seller can counter the initial buyer offer',
                code: 'INITIAL_COUNTER_SELLER_ONLY'
            });
        }

        if (lastNegotiation?.action === 'countered' && String(lastNegotiation.fromUser) === userId) {
            return res.status(400).json({
                error: 'Wait for the other party to respond before countering again',
                code: 'WAIT_FOR_COUNTER_RESPONSE'
            });
        }
    }

    let updatedOffer;
    try {
        switch (action) {
            case 'accept':
                updatedOffer = await offer.accept(req.userId, message);
                break;
            case 'reject':
                updatedOffer = await offer.reject(req.userId, message);
                break;
            case 'counter':
                updatedOffer = await offer.counter(req.userId, changes, message);
                break;
            default:
                throw new Error('Invalid action');
        }
    } catch (error) {
        const code = error?.code || 'INVALID_ACTION';
        return res.status(400).json({
            error: error.message,
            code
        });
    }

    // Populate for response
    await updatedOffer.populate('buyer', 'firstName lastName businessName avatar');
    await updatedOffer.populate('seller', 'firstName lastName businessName avatar');

    logger.info(`Offer ${offerId} action=${action} by user ${req.userId}`);

    res.json({
        message: `Offer ${action}ed successfully`,
        offer: updatedOffer.toJSON()
    });
}));

// @route   PUT /api/offers/:offerId/withdraw
// @desc    Withdraw an offer
// @access  Private
router.put('/:offerId/withdraw', [
    param('offerId').isMongoId().withMessage('Invalid offer ID'),
    body('reason').optional().isString().withMessage('Reason must be a string')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { offerId } = req.params;
    const { reason } = req.body;

    const offer = await Offer.findById(offerId);
    if (!offer) {
        return res.status(404).json({
            error: 'Offer not found',
            code: 'OFFER_NOT_FOUND'
        });
    }

    // Check if user is the buyer
    if (offer.buyer.toString() !== req.userId.toString()) {
        return res.status(403).json({
            error: 'Only the buyer can withdraw this offer',
            code: 'UNAUTHORIZED'
        });
    }

    try {
        await offer.withdraw(req.userId, reason);
    } catch (error) {
        return res.status(400).json({
            error: error.message,
            code: 'CANNOT_WITHDRAW'
        });
    }

    logger.info(`Offer ${offerId} withdrawn by user ${req.userId}`);

    res.json({
        message: 'Offer withdrawn successfully',
        offer: offer.toJSON()
    });
}));

module.exports = router;
