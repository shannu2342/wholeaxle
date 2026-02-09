const express = require('express');
const crypto = require('crypto');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Middleware to verify webhook signature
const verifyWebhookSignature = (req, res, next) => {
    const signature = req.headers['x-webhook-signature'];
    const payload = JSON.stringify(req.body);
    const expectedSignature = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(payload)
        .digest('hex');

    if (signature !== expectedSignature) {
        return res.status(401).json({
            error: 'Invalid webhook signature',
            code: 'INVALID_SIGNATURE'
        });
    }

    next();
};

// @route   POST /api/webhooks/payment
// @desc    Handle payment gateway webhooks
// @access  Public (but verified)
router.post('/payment', verifyWebhookSignature, asyncHandler(async (req, res) => {
    const { event, data } = req.body;

    logger.info(`Payment webhook received: ${event}`, data);

    // Handle different payment events
    switch (event) {
        case 'payment.success':
            // Update payment status
            logger.info(`Payment successful: ${data.paymentId}`);
            break;

        case 'payment.failed':
            // Update payment status
            logger.info(`Payment failed: ${data.paymentId}`);
            break;

        case 'refund.success':
            // Process refund
            logger.info(`Refund successful: ${data.refundId}`);
            break;

        default:
            logger.warn(`Unknown payment event: ${event}`);
    }

    res.json({ received: true });
}));

// @route   POST /api/webhooks/sms-status
// @desc    Handle SMS delivery status webhooks
// @access  Public
router.post('/sms-status', asyncHandler(async (req, res) => {
    const { MessageSid, MessageStatus, ErrorCode } = req.body;

    logger.info(`SMS status update: ${MessageSid} - ${MessageStatus}`);

    if (ErrorCode) {
        logger.error(`SMS delivery failed: ${MessageSid} - Error: ${ErrorCode}`);
    }

    res.json({ received: true });
}));

// @route   POST /api/webhooks/logistics
// @desc    Handle logistics provider webhooks
// @access  Public (but verified)
router.post('/logistics', verifyWebhookSignature, asyncHandler(async (req, res) => {
    const { event, tracking_number, status, details } = req.body;

    logger.info(`Logistics webhook: ${tracking_number} - ${status}`, details);

    // Update order status based on logistics events
    switch (status) {
        case 'picked_up':
            // Order picked up by courier
            break;
        case 'in_transit':
            // Order in transit
            break;
        case 'delivered':
            // Order delivered
            break;
        case 'failed':
            // Delivery failed
            break;
        default:
            logger.warn(`Unknown logistics status: ${status}`);
    }

    res.json({ received: true });
}));

// @route   POST /api/webhooks/ai-service
// @desc    Handle AI service webhooks
// @access  Public (but verified)
router.post('/ai-service', verifyWebhookSignature, asyncHandler(async (req, res) => {
    const { job_id, status, result, error } = req.body;

    logger.info(`AI service webhook: ${job_id} - ${status}`);

    if (error) {
        logger.error(`AI service error: ${job_id}`, error);
    }

    // Process AI service results
    // This would typically update a job queue or notify the user

    res.json({ received: true });
}));

module.exports = router;