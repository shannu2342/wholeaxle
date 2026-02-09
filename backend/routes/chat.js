const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { ChatMessage, Conversation } = require('../models/Chat');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// @route   GET /api/chat/conversations
// @desc    Get user's conversations
// @access  Private
router.get('/conversations', [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('status').optional().isIn(['active', 'archived', 'blocked', 'closed']).withMessage('Invalid status'),
    query('type').optional().isIn(['direct', 'group', 'system']).withMessage('Invalid conversation type')
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
        'participants.user': req.userId,
        'participants.isActive': true
    };

    if (req.query.status) {
        filter.status = req.query.status;
    }

    if (req.query.type) {
        filter.conversationType = req.query.type;
    }

    // Get conversations with pagination
    const conversations = await Conversation.find(filter)
        .populate('participants.user', 'firstName lastName businessName avatar role')
        .populate('lastMessage')
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit);

    // Get total count for pagination
    const total = await Conversation.countDocuments(filter);

    // Get unread count for each conversation
    const conversationsWithUnread = conversations.map(conversation => {
        const userParticipant = conversation.participants.find(
            p => p.user._id.toString() === req.userId.toString()
        );

        const unreadCount = conversation.messages
            ? conversation.messages.filter(message =>
                !message.readBy.some(read => read.user.toString() === req.userId.toString()) &&
                message.sender.toString() !== req.userId.toString()
            ).length
            : 0;

        return {
            ...conversation.toJSON(),
            unreadCount,
            userLastReadAt: userParticipant?.lastReadAt
        };
    });

    res.json({
        conversations: conversationsWithUnread,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
}));

// @route   GET /api/chat/conversations/:conversationId
// @desc    Get specific conversation
// @access  Private
router.get('/conversations/:conversationId', [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': req.userId,
        'participants.isActive': true
    })
        .populate('participants.user', 'firstName lastName businessName avatar role')
        .populate('lastMessage');

    if (!conversation) {
        return res.status(404).json({
            error: 'Conversation not found',
            code: 'CONVERSATION_NOT_FOUND'
        });
    }

    res.json({ conversation });
}));

// @route   GET /api/chat/messages/:conversationId
// @desc    Get messages for a conversation
// @access  Private
router.get('/messages/:conversationId', [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Before must be a valid ISO date')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user has access to this conversation
    const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': req.userId,
        'participants.isActive': true
    });

    if (!conversation) {
        return res.status(404).json({
            error: 'Conversation not found or access denied',
            code: 'CONVERSATION_NOT_FOUND'
        });
    }

    // Build filter for messages
    const messageFilter = {
        conversationId,
        isDeleted: false
    };

    if (req.query.before) {
        messageFilter.createdAt = { $lt: new Date(req.query.before) };
    }

    // Get messages
    const messages = await ChatMessage.find(messageFilter)
        .populate('sender', 'firstName lastName businessName avatar role')
        .populate('replyTo')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    // Reverse to get chronological order
    const reversedMessages = messages.reverse();

    // Mark messages as read for this user
    await ChatMessage.updateMany(
        {
            conversationId,
            'readBy.user': { $ne: req.userId },
            sender: { $ne: req.userId }
        },
        {
            $addToSet: {
                readBy: {
                    user: req.userId,
                    readAt: new Date()
                }
            },
            status: 'read'
        }
    );

    // Update conversation's last read time for this user
    await conversation.markAsReadForUser(req.userId);

    // Get total count for pagination
    const total = await ChatMessage.countDocuments(messageFilter);

    res.json({
        messages: reversedMessages,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalCount: total,
            hasNext: page * limit < total,
            hasPrev: page > 1
        }
    });
}));

// @route   POST /api/chat/messages
// @desc    Send a message
// @access  Private
router.post('/messages', [
    body('conversationId').isMongoId().withMessage('Invalid conversation ID'),
    body('content').notEmpty().withMessage('Message content is required').isLength({ max: 2000 }).withMessage('Message too long'),
    body('messageType').optional().isIn(['text', 'image', 'file', 'voice', 'location', 'offer', 'system']).withMessage('Invalid message type'),
    body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID'),
    body('media').optional().isObject().withMessage('Media must be an object'),
    body('location').optional().isObject().withMessage('Location must be an object')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { conversationId, content, messageType = 'text', replyTo, media, location } = req.body;

    // Verify conversation access
    const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': req.userId,
        'participants.isActive': true
    });

    if (!conversation) {
        return res.status(404).json({
            error: 'Conversation not found or access denied',
            code: 'CONVERSATION_NOT_FOUND'
        });
    }

    // Create message
    const message = new ChatMessage({
        conversationId,
        sender: req.userId,
        senderName: req.user.fullName || `${req.user.firstName} ${req.user.lastName}`,
        senderRole: req.user.role,
        messageType,
        content,
        replyTo,
        media,
        location,
        status: 'sent'
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.messageCount += 1;
    await conversation.save();

    // Populate message for response
    await message.populate('sender', 'firstName lastName businessName avatar role');

    logger.info(`Message sent in conversation ${conversationId} by user ${req.userId}`);

    res.status(201).json({
        message: 'Message sent successfully',
        data: {
            message: message.toJSON(),
            conversationId
        }
    });
}));

// @route   POST /api/chat/conversations
// @desc    Create a new conversation
// @access  Private
router.post('/conversations', [
    body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
    body('participants.*.user').isMongoId().withMessage('Invalid participant user ID'),
    body('participants.*.role').isIn(['user', 'vendor', 'admin']).withMessage('Invalid participant role'),
    body('conversationType').optional().isIn(['direct', 'group', 'system']).withMessage('Invalid conversation type'),
    body('businessContext').optional().isObject().withMessage('Business context must be an object')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { participants, conversationType = 'direct', businessContext } = req.body;

    // Add current user as participant if not already included
    const hasCurrentUser = participants.some(p => p.user === req.userId.toString());
    if (!hasCurrentUser) {
        participants.push({
            user: req.userId,
            role: req.user.role
        });
    }

    // Check if direct conversation already exists
    if (conversationType === 'direct' && participants.length === 2) {
        const existingConversation = await Conversation.findOne({
            conversationType: 'direct',
            'participants.user': { $all: participants.map(p => p.user) },
            status: 'active'
        });

        if (existingConversation) {
            return res.status(409).json({
                error: 'Direct conversation already exists',
                code: 'CONVERSATION_EXISTS',
                conversationId: existingConversation._id
            });
        }
    }

    // Create conversation
    const conversation = new Conversation({
        participants: participants.map(p => ({
            user: p.user,
            role: p.role,
            joinedAt: new Date(),
            isActive: true,
            notifications: true
        })),
        conversationType,
        businessContext,
        status: 'active'
    });

    await conversation.save();

    // Populate participants for response
    await conversation.populate('participants.user', 'firstName lastName businessName avatar role');

    logger.info(`New conversation created: ${conversation._id} by user ${req.userId}`);

    res.status(201).json({
        message: 'Conversation created successfully',
        conversation: conversation.toJSON()
    });
}));

// @route   PUT /api/chat/conversations/:conversationId/read
// @desc    Mark conversation as read
// @access  Private
router.put('/conversations/:conversationId/read', [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
        _id: conversationId,
        'participants.user': req.userId,
        'participants.isActive': true
    });

    if (!conversation) {
        return res.status(404).json({
            error: 'Conversation not found',
            code: 'CONVERSATION_NOT_FOUND'
        });
    }

    // Mark messages as read
    await ChatMessage.updateMany(
        {
            conversationId,
            'readBy.user': { $ne: req.userId },
            sender: { $ne: req.userId }
        },
        {
            $addToSet: {
                readBy: {
                    user: req.userId,
                    readAt: new Date()
                }
            },
            status: 'read'
        }
    );

    // Update conversation's last read time
    await conversation.markAsReadForUser(req.userId);

    res.json({
        message: 'Conversation marked as read'
    });
}));

// @route   PUT /api/chat/messages/:messageId/read
// @desc    Mark specific message as read
// @access  Private
router.put('/messages/:messageId/read', [
    param('messageId').isMongoId().withMessage('Invalid message ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
        return res.status(404).json({
            error: 'Message not found',
            code: 'MESSAGE_NOT_FOUND'
        });
    }

    // Verify user has access to this message's conversation
    const conversation = await Conversation.findOne({
        _id: message.conversationId,
        'participants.user': req.userId,
        'participants.isActive': true
    });

    if (!conversation) {
        return res.status(404).json({
            error: 'Conversation not found or access denied',
            code: 'CONVERSATION_NOT_FOUND'
        });
    }

    await message.markAsRead(req.userId);

    res.json({
        message: 'Message marked as read'
    });
}));

// @route   POST /api/chat/messages/:messageId/reaction
// @desc    Add reaction to message
// @access  Private
router.post('/messages/:messageId/reaction', [
    param('messageId').isMongoId().withMessage('Invalid message ID'),
    body('emoji').notEmpty().withMessage('Emoji is required').isLength({ max: 10 }).withMessage('Emoji too long')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { messageId } = req.params;
    const { emoji } = req.body;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
        return res.status(404).json({
            error: 'Message not found',
            code: 'MESSAGE_NOT_FOUND'
        });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
        r => r.user.toString() === req.userId.toString() && r.emoji === emoji
    );

    if (existingReaction) {
        return res.status(400).json({
            error: 'Already reacted with this emoji',
            code: 'REACTION_EXISTS'
        });
    }

    // Remove existing reaction from this user (if any)
    message.reactions = message.reactions.filter(
        r => r.user.toString() !== req.userId.toString()
    );

    // Add new reaction
    message.reactions.push({
        user: req.userId,
        emoji,
        createdAt: new Date()
    });

    await message.save();

    res.json({
        message: 'Reaction added successfully',
        data: {
            emoji,
            reactions: message.reactions
        }
    });
}));

// @route   DELETE /api/chat/messages/:messageId/reaction
// @desc    Remove reaction from message
// @access  Private
router.delete('/messages/:messageId/reaction', [
    param('messageId').isMongoId().withMessage('Invalid message ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { messageId } = req.params;

    const message = await ChatMessage.findById(messageId);
    if (!message) {
        return res.status(404).json({
            error: 'Message not found',
            code: 'MESSAGE_NOT_FOUND'
        });
    }

    // Remove user's reactions
    message.reactions = message.reactions.filter(
        r => r.user.toString() !== req.userId.toString()
    );

    await message.save();

    res.json({
        message: 'Reaction removed successfully',
        data: {
            reactions: message.reactions
        }
    });
}));

module.exports = router;