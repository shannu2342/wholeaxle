const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isString().withMessage('Type must be a string'),
    query('status').optional().isIn(['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled']).withMessage('Invalid status'),
    query('unread').optional().isBoolean().withMessage('Unread must be a boolean')
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
        recipient: req.userId,
        expiresAt: { $gt: new Date() }
    };

    if (req.query.type) {
        filter.type = req.query.type;
    }

    if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.unread === 'true') {
        filter.status = { $ne: 'read' };
    }

    // Get notifications
    const notifications = await Notification.find(filter)
        .populate('data.senderId', 'firstName lastName businessName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get total count
    const total = await Notification.countDocuments(filter);

    // Get unread count
    const unreadCount = await Notification.countDocuments({
        recipient: req.userId,
        status: { $ne: 'read' },
        expiresAt: { $gt: new Date() }
    });

    res.json({
        notifications,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        },
        unreadCount
    });
}));

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', asyncHandler(async (req, res) => {
    const unreadCount = await Notification.countDocuments({
        recipient: req.userId,
        status: { $ne: 'read' },
        expiresAt: { $gt: new Date() }
    });

    res.json({ unreadCount });
}));

// @route   GET /api/notifications/:notificationId
// @desc    Get specific notification
// @access  Private
router.get('/:notificationId', [
    param('notificationId').isMongoId().withMessage('Invalid notification ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { notificationId } = req.params;

    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: req.userId
    }).populate('data.senderId', 'firstName lastName businessName');

    if (!notification) {
        return res.status(404).json({
            error: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND'
        });
    }

    res.json({ notification });
}));

// @route   PUT /api/notifications/:notificationId/read
// @desc    Mark notification as read
// @access  Private
router.put('/:notificationId/read', [
    param('notificationId').isMongoId().withMessage('Invalid notification ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { notificationId } = req.params;

    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: req.userId
    });

    if (!notification) {
        return res.status(404).json({
            error: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND'
        });
    }

    await notification.markAsRead();

    res.json({
        message: 'Notification marked as read'
    });
}));

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', asyncHandler(async (req, res) => {
    await Notification.updateMany(
        {
            recipient: req.userId,
            status: { $ne: 'read' }
        },
        {
            status: 'read',
            readAt: new Date()
        }
    );

    res.json({
        message: 'All notifications marked as read'
    });
}));

// @route   DELETE /api/notifications/:notificationId
// @desc    Delete notification
// @access  Private
router.delete('/:notificationId', [
    param('notificationId').isMongoId().withMessage('Invalid notification ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { notificationId } = req.params;

    const notification = await Notification.findOne({
        _id: notificationId,
        recipient: req.userId
    });

    if (!notification) {
        return res.status(404).json({
            error: 'Notification not found',
            code: 'NOTIFICATION_NOT_FOUND'
        });
    }

    await Notification.findByIdAndDelete(notificationId);

    res.json({
        message: 'Notification deleted successfully'
    });
}));

// @route   DELETE /api/notifications
// @desc    Delete multiple notifications
// @access  Private
router.delete('/', [
    body('notificationIds').isArray({ min: 1 }).withMessage('Notification IDs array is required'),
    body('notificationIds.*').isMongoId().withMessage('Invalid notification ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { notificationIds } = req.body;

    const result = await Notification.deleteMany({
        _id: { $in: notificationIds },
        recipient: req.userId
    });

    res.json({
        message: `${result.deletedCount} notifications deleted successfully`,
        deletedCount: result.deletedCount
    });
}));

// @route   POST /api/notifications/send
// @desc    Send a notification (in-app record)
// @access  Private
router.post('/send', [
    body('recipient').isMongoId().withMessage('Recipient is required'),
    body('type').notEmpty().withMessage('Type is required'),
    body('title').notEmpty().withMessage('Title is required'),
    body('message').notEmpty().withMessage('Message is required'),
    body('channels').isArray({ min: 1 }).withMessage('Channels are required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const notification = await Notification.create({
        recipient: req.body.recipient,
        type: req.body.type,
        title: req.body.title,
        message: req.body.message,
        channels: req.body.channels,
        priority: req.body.priority || 'normal',
        data: req.body.data || {},
        status: 'sent',
    });

    res.status(201).json({ notification });
}));

// @route   POST /api/notifications/schedule
// @desc    Schedule a notification
// @access  Private
router.post('/schedule', asyncHandler(async (req, res) => {
    const scheduled = {
        id: `scheduled_${Date.now()}`,
        scheduledAt: req.body.scheduledAt,
        notification: req.body.notification,
        status: 'scheduled',
    };
    res.status(201).json({ scheduled });
}));

// @route   GET /api/notifications/analytics
// @desc    Notification analytics
// @access  Private
router.get('/analytics', asyncHandler(async (req, res) => {
    const totalSent = await Notification.countDocuments({});
    const totalRead = await Notification.countDocuments({ status: 'read' });
    const totalDelivered = await Notification.countDocuments({ status: { $in: ['delivered', 'read'] } });
    const totalClicked = 0;

    res.json({
        totalSent,
        totalDelivered,
        totalRead,
        totalClicked,
        deliveryRate: totalSent ? (totalDelivered / totalSent) * 100 : 0,
        readRate: totalSent ? (totalRead / totalSent) * 100 : 0,
        clickRate: 0,
        channels: {},
    });
}));

// @route   POST /api/notifications/optimize
// @desc    Notification optimization recommendations
// @access  Private
router.post('/optimize', asyncHandler(async (req, res) => {
    res.json({
        recommendations: [
            'Best time to send: 10:00 AM - 12:00 PM',
            'Use SMS for urgent notifications',
        ],
        optimizedChannels: req.body.preferences || {},
        frequency: {
            daily: 3,
            weekly: 12,
            monthly: 40,
        },
    });
}));

// @route   PUT /api/notifications/preferences
// @desc    Update notification preferences
// @access  Private
router.put('/preferences', [
    body('enabled').optional().isBoolean().withMessage('Enabled must be a boolean'),
    body('quietHours').optional().isObject().withMessage('Quiet hours must be an object'),
    body('quietHours.enabled').optional().isBoolean().withMessage('Quiet hours enabled must be a boolean'),
    body('quietHours.start').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Start time must be in HH:mm format'),
    body('quietHours.end').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('End time must be in HH:mm format'),
    body('channels').optional().isObject().withMessage('Channels must be an object'),
    body('channels.in_app').optional().isBoolean().withMessage('In-app must be a boolean'),
    body('channels.push').optional().isBoolean().withMessage('Push must be a boolean'),
    body('channels.email').optional().isBoolean().withMessage('Email must be a boolean'),
    body('channels.sms').optional().isBoolean().withMessage('SMS must be a boolean')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const User = require('../models/User');
    const user = await User.findById(req.userId);

    if (!user) {
        return res.status(404).json({
            error: 'User not found',
            code: 'USER_NOT_FOUND'
        });
    }

    // Update preferences
    const { enabled, quietHours, channels } = req.body;

    if (enabled !== undefined) {
        user.preferences.notifications = user.preferences.notifications || {};
        user.preferences.notifications.enabled = enabled;
    }

    if (quietHours) {
        user.preferences.notifications = user.preferences.notifications || {};
        user.preferences.notifications.quietHours = quietHours;
    }

    if (channels) {
        user.preferences.notifications = user.preferences.notifications || {};
        user.preferences.notifications = { ...user.preferences.notifications, ...channels };
    }

    await user.save();

    res.json({
        message: 'Notification preferences updated successfully',
        preferences: user.preferences.notifications
    });
}));

// @route   POST /api/notifications/test
// @desc    Send test notification
// @access  Private
router.post('/test', [
    body('type').optional().isString().withMessage('Type must be a string'),
    body('message').optional().isString().withMessage('Message must be a string')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { type = 'system_update', message = 'This is a test notification' } = req.body;

    const notification = new Notification({
        recipient: req.userId,
        type,
        title: 'Test Notification',
        message,
        channels: ['in_app'],
        priority: 'normal'
    });

    await notification.save();

    res.json({
        message: 'Test notification created',
        notification
    });
}));

module.exports = router;
