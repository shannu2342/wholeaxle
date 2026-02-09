const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// @route   POST /api/location/validate
// @desc    Validate pincode and return serviceability
// @access  Public
router.post(
    '/validate',
    [body('pincode').isLength({ min: 6, max: 6 }).withMessage('Invalid pincode')],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'Validation failed',
                details: errors.array(),
            });
        }

        const { pincode } = req.body;

        // Basic rule: accept all 6-digit pincodes for now
        res.json({
            pincode,
            state: 'Unknown',
            city: 'Unknown',
            isServiceable: true,
            deliveryTime: '2-5 days',
        });
    })
);

// @route   GET /api/location/nearby
// @desc    Nearby serviceable areas
// @access  Public
router.get('/nearby', asyncHandler(async (req, res) => {
    res.json({ areas: [] });
}));

module.exports = router;
