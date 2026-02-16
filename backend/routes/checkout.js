const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const Order = require('../models/Order');
const logger = require('../utils/logger');

const router = express.Router();

const GST_RATE = 0.18;
const DEFAULT_CURRENCY = 'INR';
const COD_LIMIT = 25000;

const DELIVERY_OPTIONS = {
    standard: {
        id: 'standard',
        label: 'Standard Delivery',
        minDays: 3,
        maxDays: 5,
        surcharge: 0,
        recommended: true
    },
    express: {
        id: 'express',
        label: 'Express Delivery',
        minDays: 1,
        maxDays: 2,
        surcharge: 120,
        recommended: false
    }
};

const sanitizeItems = (items = []) => {
    return items
        .filter(Boolean)
        .map((item) => {
            const quantity = Math.max(1, Number(item.quantity || 1));
            const price = Math.max(0, Number(item.price || 0));
            return {
                productId: item.productId || item.id || item._id,
                name: item.name || 'Unnamed Item',
                quantity,
                price,
                total: Number((quantity * price).toFixed(2)),
                vendor: item.vendor || item.brand || 'unknown'
            };
        });
};

const calculateCart = (items = [], couponCode = '') => {
    const normalized = sanitizeItems(items);
    const subtotal = normalized.reduce((sum, item) => sum + item.total, 0);

    let couponDiscount = 0;
    let coupon = null;
    if (couponCode && typeof couponCode === 'string') {
        const normalizedCode = couponCode.trim().toUpperCase();
        if (normalizedCode === 'WHOLEXALE10') {
            couponDiscount = Math.min(subtotal * 0.1, 1000);
            coupon = { code: normalizedCode, type: 'percentage', value: 10, maxDiscount: 1000 };
        } else if (normalizedCode === 'B2B500' && subtotal >= 5000) {
            couponDiscount = 500;
            coupon = { code: normalizedCode, type: 'flat', value: 500 };
        }
    }

    const packagingFee = subtotal > 0 && subtotal < 500 ? 29 : 0;
    const taxableAmount = Math.max(0, subtotal - couponDiscount);
    const tax = Number((taxableAmount * GST_RATE).toFixed(2));
    const totalBeforeShipping = Number((taxableAmount + packagingFee + tax).toFixed(2));

    return {
        items: normalized,
        totals: {
            subtotal: Number(subtotal.toFixed(2)),
            couponDiscount: Number(couponDiscount.toFixed(2)),
            packagingFee: Number(packagingFee.toFixed(2)),
            tax,
            totalBeforeShipping,
            currency: DEFAULT_CURRENCY
        },
        coupon
    };
};

const validateAddressShape = (address = {}) => {
    const pincode = String(address.pincode || '').trim();
    const phone = String(address.phone || '').trim();
    const requiredFields = ['fullName', 'line1', 'city', 'state', 'pincode', 'phone'];
    const missing = requiredFields.filter((field) => !String(address[field] || '').trim());

    if (missing.length > 0) {
        return {
            isValid: false,
            serviceable: false,
            missingFields: missing,
            message: `Missing required fields: ${missing.join(', ')}`
        };
    }

    if (!/^\d{6}$/.test(pincode)) {
        return {
            isValid: false,
            serviceable: false,
            missingFields: [],
            message: 'Pincode must be 6 digits'
        };
    }

    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
        return {
            isValid: false,
            serviceable: false,
            missingFields: [],
            message: 'Phone must be 10-15 digits'
        };
    }

    return {
        isValid: true,
        serviceable: true,
        missingFields: [],
        message: 'Address validated successfully'
    };
};

const shippingFeeFor = (deliveryOptionId, subtotal) => {
    const base = subtotal >= 999 ? 0 : 79;
    const option = DELIVERY_OPTIONS[deliveryOptionId] || DELIVERY_OPTIONS.standard;
    return Number((base + option.surcharge).toFixed(2));
};

const formatAddress = (address = {}) => {
    return [
        address.fullName,
        address.line1,
        address.line2,
        address.city,
        address.state,
        address.pincode,
        address.country || 'India'
    ].filter(Boolean).join(', ');
};

const generateOrderNumber = () => {
    return `WHX-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
};

// @route   POST /api/checkout/validate-cart
// @desc    Validate cart and compute base totals
// @access  Private
router.post('/validate-cart', [
    body('items').isArray({ min: 1 }).withMessage('At least one cart item is required'),
    body('couponCode').optional().isString()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { items, couponCode } = req.body;
    const calculated = calculateCart(items, couponCode);

    res.json({
        valid: calculated.items.length > 0,
        cart: calculated
    });
}));

// @route   POST /api/checkout/address/validate
// @desc    Validate shipping address for checkout
// @access  Private
router.post('/address/validate', [
    body('address').isObject().withMessage('Address is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { address } = req.body;
    const result = validateAddressShape(address);

    const eta = result.serviceable
        ? {
            earliestDeliveryDays: 1,
            latestDeliveryDays: 5
        }
        : null;

    res.json({
        addressValidation: {
            ...result,
            eta
        }
    });
}));

// @route   POST /api/checkout/delivery/options
// @desc    Fetch delivery options for current cart/address
// @access  Private
router.post('/delivery/options', [
    body('items').isArray({ min: 1 }).withMessage('At least one cart item is required'),
    body('address').optional().isObject()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { items, address } = req.body;
    const { totals } = calculateCart(items);
    const addressValidation = address ? validateAddressShape(address) : { serviceable: true };

    if (!addressValidation.serviceable) {
        return res.status(400).json({
            error: 'Address is not serviceable',
            code: 'ADDRESS_NOT_SERVICEABLE',
            addressValidation
        });
    }

    const options = Object.values(DELIVERY_OPTIONS).map((option) => ({
        ...option,
        fee: shippingFeeFor(option.id, totals.subtotal),
        estimatedDeliveryText: `${option.minDays}-${option.maxDays} days`
    }));

    res.json({
        options,
        defaultOption: 'standard'
    });
}));

// @route   POST /api/checkout/payment/options
// @desc    Fetch available payment methods
// @access  Private
router.post('/payment/options', [
    body('orderTotal').isFloat({ min: 0 }).withMessage('orderTotal must be a valid amount')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const orderTotal = Number(req.body.orderTotal || 0);
    const walletBalance = Number(req.user?.wallet?.balance || 0);

    const methods = [
        { id: 'upi', label: 'UPI', enabled: true },
        { id: 'card', label: 'Credit / Debit Card', enabled: true },
        { id: 'netbanking', label: 'Net Banking', enabled: true },
        {
            id: 'cod',
            label: 'Cash on Delivery',
            enabled: orderTotal <= COD_LIMIT,
            reason: orderTotal > COD_LIMIT ? `COD is limited to orders up to ₹${COD_LIMIT}` : undefined
        },
        {
            id: 'wallet',
            label: 'Wallet',
            enabled: walletBalance > 0,
            balance: walletBalance
        }
    ];

    res.json({
        methods,
        recommended: 'upi'
    });
}));

// @route   POST /api/checkout/review
// @desc    Build full checkout review summary
// @access  Private
router.post('/review', [
    body('items').isArray({ min: 1 }).withMessage('At least one cart item is required'),
    body('address').isObject().withMessage('Address is required'),
    body('deliveryOption').isString().withMessage('deliveryOption is required'),
    body('paymentMethod').isString().withMessage('paymentMethod is required'),
    body('couponCode').optional().isString()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { items, address, deliveryOption, paymentMethod, couponCode } = req.body;
    const addressValidation = validateAddressShape(address);
    if (!addressValidation.serviceable) {
        return res.status(400).json({
            error: addressValidation.message,
            code: 'INVALID_ADDRESS',
            addressValidation
        });
    }

    const calculated = calculateCart(items, couponCode);
    const shippingFee = shippingFeeFor(deliveryOption, calculated.totals.subtotal);
    const grandTotal = Number((calculated.totals.totalBeforeShipping + shippingFee).toFixed(2));

    if (paymentMethod === 'cod' && grandTotal > COD_LIMIT) {
        return res.status(400).json({
            error: `COD is limited to orders up to ₹${COD_LIMIT}`,
            code: 'COD_LIMIT_EXCEEDED'
        });
    }

    res.json({
        review: {
            items: calculated.items,
            coupon: calculated.coupon,
            totals: {
                ...calculated.totals,
                shippingFee,
                grandTotal
            },
            address: {
                ...address,
                formatted: formatAddress(address)
            },
            delivery: DELIVERY_OPTIONS[deliveryOption] || DELIVERY_OPTIONS.standard,
            paymentMethod
        }
    });
}));

// @route   POST /api/checkout/place-order
// @desc    Place order after review
// @access  Private
router.post('/place-order', [
    body('items').isArray({ min: 1 }).withMessage('At least one cart item is required'),
    body('address').isObject().withMessage('Address is required'),
    body('deliveryOption').isString().withMessage('deliveryOption is required'),
    body('paymentMethod').isString().withMessage('paymentMethod is required'),
    body('couponCode').optional().isString()
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { items, address, deliveryOption, paymentMethod, couponCode } = req.body;
    const addressValidation = validateAddressShape(address);
    if (!addressValidation.serviceable) {
        return res.status(400).json({
            error: addressValidation.message,
            code: 'INVALID_ADDRESS',
            addressValidation
        });
    }

    const calculated = calculateCart(items, couponCode);
    const shippingFee = shippingFeeFor(deliveryOption, calculated.totals.subtotal);
    const grandTotal = Number((calculated.totals.totalBeforeShipping + shippingFee).toFixed(2));

    if (paymentMethod === 'cod' && grandTotal > COD_LIMIT) {
        return res.status(400).json({
            error: `COD is limited to orders up to ₹${COD_LIMIT}`,
            code: 'COD_LIMIT_EXCEEDED'
        });
    }

    const option = DELIVERY_OPTIONS[deliveryOption] || DELIVERY_OPTIONS.standard;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + option.maxDays);

    const order = await Order.create({
        orderNumber: generateOrderNumber(),
        customer: {
            id: req.userId,
            name: req.user?.fullName || req.user?.businessName || req.user?.email || 'Wholexale Customer',
            phone: address.phone,
            address: formatAddress(address)
        },
        items: calculated.items,
        totalAmount: calculated.totals.subtotal,
        discount: calculated.totals.couponDiscount,
        finalAmount: grandTotal,
        status: 'confirmed',
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'initiated',
        paymentMethod,
        shipping: {
            address: formatAddress(address),
            estimatedDelivery
        }
    });

    logger.info(`Checkout order placed: ${order.orderNumber} by user ${req.userId}`);

    res.status(201).json({
        message: 'Order placed successfully',
        order: {
            ...order.toObject(),
            id: order._id
        },
        checkout: {
            totals: {
                ...calculated.totals,
                shippingFee,
                grandTotal
            },
            nextAction: paymentMethod === 'cod' ? 'await_delivery' : 'complete_payment'
        }
    });
}));

module.exports = router;
