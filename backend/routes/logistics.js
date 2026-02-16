const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const delhivery = require('../services/delhivery');

const router = express.Router();

const validationError = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            error: 'Validation failed',
            details: errors.array(),
        });
        return true;
    }
    return false;
};

const providerErrorResponse = (res, error) => {
    const statusCode = error.statusCode || 502;
    return res.status(statusCode).json({
        error: error.message || 'Provider request failed',
        provider: error.provider || 'delhivery',
        action: error.action,
        details: error.providerData || undefined,
    });
};

router.get('/providers', authMiddleware, asyncHandler(async (req, res) => {
    res.json({
        providers: {
            delhivery: delhivery.getPublicConfig(),
        },
    });
}));

router.post(
    '/delhivery/waybills',
    authMiddleware,
    [body('count').optional().isInt({ min: 1, max: 100 }).withMessage('count must be between 1 and 100')],
    asyncHandler(async (req, res) => {
        if (validationError(req, res)) return;

        try {
            delhivery.ensureConfiguredOrThrow();
            const count = Number(req.body.count || 1);
            const result = await delhivery.allocateWaybills(count);

            res.json({
                provider: 'delhivery',
                count,
                result,
                waybill: delhivery.extractWaybill(result),
            });
        } catch (error) {
            logger.error('Delhivery waybill allocation failed:', error);
            return providerErrorResponse(res, error);
        }
    })
);

router.post(
    '/delhivery/shipments',
    authMiddleware,
    [body('payload').optional().isObject().withMessage('payload must be an object')],
    asyncHandler(async (req, res) => {
        if (validationError(req, res)) return;

        const payload = req.body.payload || req.body;

        try {
            delhivery.ensureConfiguredOrThrow();
            const result = await delhivery.createShipment(payload);
            res.json({
                provider: 'delhivery',
                action: 'create_shipment',
                result,
                waybill: delhivery.extractWaybill(result),
            });
        } catch (error) {
            logger.error('Delhivery create shipment failed:', error);
            return providerErrorResponse(res, error);
        }
    })
);

router.post(
    '/delhivery/pickups',
    authMiddleware,
    [body('payload').optional().isObject().withMessage('payload must be an object')],
    asyncHandler(async (req, res) => {
        if (validationError(req, res)) return;

        const payload = req.body.payload || req.body;

        try {
            delhivery.ensureConfiguredOrThrow();
            const result = await delhivery.createPickupRequest(payload);
            res.json({
                provider: 'delhivery',
                action: 'create_pickup',
                result,
            });
        } catch (error) {
            logger.error('Delhivery create pickup failed:', error);
            return providerErrorResponse(res, error);
        }
    })
);

router.get(
    '/delhivery/track',
    authMiddleware,
    [
        query('waybill').optional().isString().withMessage('waybill must be a string'),
        query('ref').optional().isString().withMessage('ref must be a string'),
    ],
    asyncHandler(async (req, res) => {
        if (validationError(req, res)) return;

        const { waybill, ref } = req.query;
        if (!waybill && !ref) {
            return res.status(400).json({
                error: 'Either query param `waybill` or `ref` is required',
            });
        }

        try {
            delhivery.ensureConfiguredOrThrow();
            const result = await delhivery.trackShipment({ waybill, ref });
            res.json({
                provider: 'delhivery',
                action: 'track_shipment',
                result,
            });
        } catch (error) {
            logger.error('Delhivery tracking failed:', error);
            return providerErrorResponse(res, error);
        }
    })
);

router.get(
    '/delhivery/serviceability',
    authMiddleware,
    [
        query('pincode').notEmpty().withMessage('pincode is required'),
        query('weight').optional().isFloat({ gt: 0 }).withMessage('weight must be > 0'),
        query('cod').optional().isIn(['0', '1', 'true', 'false']).withMessage('cod must be 0/1/true/false'),
    ],
    asyncHandler(async (req, res) => {
        if (validationError(req, res)) return;

        try {
            delhivery.ensureConfiguredOrThrow();
            const result = await delhivery.checkServiceability({
                pincode: req.query.pincode,
                weight: req.query.weight,
                cod: req.query.cod,
            });

            res.json({
                provider: 'delhivery',
                action: 'check_serviceability',
                result,
            });
        } catch (error) {
            logger.error('Delhivery serviceability failed:', error);
            return providerErrorResponse(res, error);
        }
    })
);

module.exports = router;
