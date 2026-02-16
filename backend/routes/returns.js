const express = require('express');
const { body, validationResult } = require('express-validator');
const Return = require('../models/Return');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const delhivery = require('../services/delhivery');

const router = express.Router();

const toBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value === 1;
    if (typeof value !== 'string') return false;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const buildDefaultDelhiveryPickupPayload = ({ returnRequest, body, trackingNumber }) => {
    const pickupDate = body.date || body.scheduledDate || body.preferredDate;
    const pickupTime = body.timeSlot || body.scheduledTime || body.preferredTime;

    return {
        pickup_date: pickupDate,
        pickup_time: pickupTime,
        pickup_location: body.pickupLocation || process.env.DELHIVERY_PICKUP_LOCATION || '',
        contact_name: body.contactPerson || '',
        contact_phone: body.contactPhone || '',
        shipments: [
            {
                waybill: trackingNumber,
                return_id: String(returnRequest._id),
                order_id: returnRequest.orderId ? String(returnRequest.orderId) : undefined,
            },
        ],
    };
};

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

    let trackingNumber = req.body.trackingNumber || `TRK${Date.now()}`;
    const courierPartner = String(req.body.courierPartner || '').toLowerCase();
    const useDelhivery = courierPartner === 'delhivery'
        || toBoolean(req.body.useDelhivery)
        || toBoolean(req.body.useProvider);

    let providerIntegration = null;

    if (useDelhivery) {
        if (!delhivery.isConfigured()) {
            return res.status(503).json({
                error: 'Delhivery integration is not configured',
                code: 'DELHIVERY_NOT_CONFIGURED',
            });
        }

        providerIntegration = { provider: 'delhivery' };

        try {
            const shouldAllocateWaybill = toBoolean(req.body.allocateWaybill);
            if (shouldAllocateWaybill || !req.body.trackingNumber) {
                const waybillData = await delhivery.allocateWaybills(1);
                const allocated = delhivery.extractWaybill(waybillData);

                if (allocated) {
                    trackingNumber = allocated;
                }

                providerIntegration.waybill = {
                    allocated: Boolean(allocated),
                    trackingNumber,
                    raw: waybillData,
                };
            }

            const shipmentPayload = req.body.providerShipmentPayload || req.body.delhiveryShipmentPayload;
            const pickupPayload = req.body.providerPickupPayload || req.body.delhiveryPickupPayload;
            const shouldCreateShipment = toBoolean(req.body.createShipmentWithProvider) || Boolean(shipmentPayload);
            const shouldCreatePickup = toBoolean(req.body.schedulePickupWithProvider) || Boolean(pickupPayload);

            if (shouldCreateShipment) {
                const payload = shipmentPayload || {
                    shipments: [{ waybill: trackingNumber, return_id: String(returnRequest._id) }],
                };
                const shipmentResult = await delhivery.createShipment(payload);
                providerIntegration.shipment = {
                    created: true,
                    raw: shipmentResult,
                };

                const providerWaybill = delhivery.extractWaybill(shipmentResult);
                if (providerWaybill) {
                    trackingNumber = providerWaybill;
                }
            }

            if (shouldCreatePickup) {
                const payload = pickupPayload || buildDefaultDelhiveryPickupPayload({
                    returnRequest,
                    body: req.body,
                    trackingNumber,
                });
                const pickupResult = await delhivery.createPickupRequest(payload);
                providerIntegration.pickup = {
                    created: true,
                    raw: pickupResult,
                };
            }

            if (!shouldCreateShipment && !shouldCreatePickup) {
                providerIntegration.note = 'Delhivery enabled. No providerShipmentPayload/providerPickupPayload supplied, so only local pickup was scheduled.';
            }
        } catch (error) {
            logger.error('Delhivery pickup integration failed:', error);
            return res.status(error.statusCode || 502).json({
                error: error.message || 'Delhivery request failed',
                code: 'DELHIVERY_REQUEST_FAILED',
                provider: 'delhivery',
                action: error.action,
                details: error.providerData || undefined,
            });
        }
    }

    returnRequest.pickupDetails = {
        ...(returnRequest.pickupDetails || {}),
        ...req.body,
        required: req.body.required !== undefined
            ? toBoolean(req.body.required)
            : (returnRequest.pickupDetails?.required ?? true),
        preferredDate: req.body.preferredDate || req.body.date || returnRequest.pickupDetails?.preferredDate,
        preferredTime: req.body.preferredTime || req.body.timeSlot || returnRequest.pickupDetails?.preferredTime,
        scheduledDate: req.body.scheduledDate || req.body.date || returnRequest.pickupDetails?.scheduledDate,
        scheduledTime: req.body.scheduledTime || req.body.timeSlot || returnRequest.pickupDetails?.scheduledTime,
        status: 'scheduled',
        trackingNumber,
    };

    returnRequest.status = returnRequest.status || 'pickup_scheduled';
    returnRequest.timeline.push({
        status: 'pickup_scheduled',
        timestamp: new Date(),
        description: useDelhivery
            ? `Pickup scheduled${trackingNumber ? ` (Delhivery: ${trackingNumber})` : ' via Delhivery'}`
            : 'Pickup scheduled',
    });

    await returnRequest.save();
    res.json({
        pickup: returnRequest.pickupDetails,
        providerIntegration,
        returnRequest: { ...returnRequest.toObject(), id: returnRequest._id },
    });
}));

// @route   GET /api/returns/:id/tracking
// @desc    Get tracking details for a return shipment
// @access  Private
router.get('/:id/tracking', authMiddleware, asyncHandler(async (req, res) => {
    const returnRequest = await Return.findById(req.params.id).lean();
    if (!returnRequest) {
        return res.status(404).json({ error: 'Return request not found' });
    }

    const trackingNumber = returnRequest?.pickupDetails?.trackingNumber;
    const courierPartner = String(returnRequest?.pickupDetails?.courierPartner || '').toLowerCase();

    if (!trackingNumber) {
        return res.status(400).json({
            error: 'Tracking number is not available for this return',
            code: 'NO_TRACKING_NUMBER',
        });
    }

    if (courierPartner === 'delhivery') {
        if (!delhivery.isConfigured()) {
            return res.status(503).json({
                error: 'Delhivery integration is not configured',
                code: 'DELHIVERY_NOT_CONFIGURED',
            });
        }

        try {
            const tracking = await delhivery.trackShipment({ waybill: trackingNumber });
            return res.json({
                provider: 'delhivery',
                trackingNumber,
                tracking,
            });
        } catch (error) {
            logger.error('Delhivery tracking error:', error);
            return res.status(error.statusCode || 502).json({
                error: error.message || 'Delhivery tracking failed',
                code: 'DELHIVERY_TRACKING_FAILED',
                provider: 'delhivery',
                action: error.action,
                details: error.providerData || undefined,
            });
        }
    }

    return res.json({
        provider: courierPartner || 'unknown',
        trackingNumber,
        message: 'Tracking integration is not configured for this courier partner',
    });
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
