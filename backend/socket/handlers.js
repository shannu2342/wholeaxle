const jwt = require('jsonwebtoken');
const { ChatMessage, Conversation } = require('../models/Chat');
const { CreditLedger, CreditLimit } = require('../models/Finance');
const Offer = require('../models/Offer');
const User = require('../models/User');
const Notification = require('../models/Notification');
const logger = require('../utils/logger');

// Store connected users
const connectedUsers = new Map();
const userSockets = new Map();

// Real-time event handlers
const socketHandlers = {
    // Handle new connection
    handleConnection: (socket, io) => {
        const userId = socket.userId;
        const userRole = socket.userRole;

        // Store user connection
        connectedUsers.set(userId, {
            socketId: socket.id,
            role: userRole,
            connectedAt: new Date(),
            isActive: true
        });

        if (!userSockets.has(userId)) {
            userSockets.set(userId, new Set());
        }
        userSockets.get(userId).add(socket.id);

        // Join user to their personal room
        socket.join(`user:${userId}`);

        // Update user status to online
        updateUserOnlineStatus(userId, true);

        // Notify contacts about user coming online
        notifyContactsOnlineStatus(userId, true, io);

        // Handle chat events
        handleChatEvents(socket, io);

        // Handle offer events
        handleOfferEvents(socket, io);

        // Handle typing events
        handleTypingEvents(socket, io);

        // Handle system events
        handleSystemEvents(socket, io);

        // Send initial data
        sendInitialData(socket, io);
    },

    // Handle disconnection
    handleDisconnection: (socket, io) => {
        const userId = socket.userId;

        // Remove socket from user's socket set
        if (userSockets.has(userId)) {
            userSockets.get(userId).delete(socket.id);

            // If no more sockets for this user, mark as offline
            if (userSockets.get(userId).size === 0) {
                userSockets.delete(userId);
                connectedUsers.delete(userId);

                // Update user status to offline
                updateUserOnlineStatus(userId, false);

                // Notify contacts about user going offline
                notifyContactsOnlineStatus(userId, false, io);
            }
        }
    }
};

// Chat event handlers
const handleChatEvents = (socket, io) => {
    // Join conversation room
    socket.on('chat:join', async (data) => {
        try {
            const { conversationId } = data;

            // Verify user has access to this conversation
            const conversation = await Conversation.findOne({
                _id: conversationId,
                'participants.user': socket.userId,
                'participants.isActive': true
            });

            if (!conversation) {
                socket.emit('error', { message: 'Access denied to conversation' });
                return;
            }

            // Join the conversation room
            socket.join(`conversation:${conversationId}`);

            // Mark messages as read
            await markMessagesAsRead(conversationId, socket.userId);

            // Update user's last read time
            await conversation.markAsReadForUser(socket.userId);

            socket.emit('chat:joined', { conversationId });
            logger.info(`User ${socket.userId} joined conversation ${conversationId}`);

        } catch (error) {
            logger.error('Chat join error:', error);
            socket.emit('error', { message: 'Failed to join conversation' });
        }
    });

    // Send message
    socket.on('chat:send', async (data) => {
        try {
            const { conversationId, content, messageType = 'text', replyTo, media, location } = data;

            // Verify conversation access
            const conversation = await Conversation.findOne({
                _id: conversationId,
                'participants.user': socket.userId,
                'participants.isActive': true
            }).populate('participants.user');

            if (!conversation) {
                socket.emit('error', { message: 'Access denied to conversation' });
                return;
            }

            // Create message
            const message = new ChatMessage({
                conversationId,
                sender: socket.userId,
                senderName: socket.user.fullName || socket.user.firstName,
                senderRole: socket.userRole,
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

            // Emit to all participants in the conversation
            io.to(`conversation:${conversationId}`).emit('chat:message', {
                message: message.toJSON(),
                conversationId
            });

            // Send notifications to offline participants
            await sendMessageNotifications(message, conversation, io);

            logger.info(`Message sent in conversation ${conversationId} by user ${socket.userId}`);

        } catch (error) {
            logger.error('Chat send error:', error);
            socket.emit('error', { message: 'Failed to send message' });
        }
    });

    // Mark message as read
    socket.on('chat:read', async (data) => {
        try {
            const { messageId, conversationId } = data;

            const message = await ChatMessage.findById(messageId);
            if (!message) {
                socket.emit('error', { message: 'Message not found' });
                return;
            }

            await message.markAsRead(socket.userId);

            // Emit read receipt
            io.to(`conversation:${conversationId}`).emit('chat:read', {
                messageId,
                readBy: {
                    user: socket.userId,
                    readAt: new Date()
                }
            });

        } catch (error) {
            logger.error('Chat read error:', error);
            socket.emit('error', { message: 'Failed to mark message as read' });
        }
    });
};

// Offer event handlers
const handleOfferEvents = (socket, io) => {
    // Create offer
    socket.on('offer:create', async (data) => {
        try {
            const offer = new Offer({
                ...data,
                buyer: socket.userId
            });

            await offer.save();

            // Create conversation for the offer
            const conversation = new Conversation({
                participants: [
                    { user: socket.userId, role: 'user' },
                    { user: data.seller, role: 'vendor' }
                ],
                conversationType: 'direct',
                businessContext: {
                    offerId: offer._id,
                    inquiryType: 'quote_request'
                }
            });

            await conversation.save();

            // Link offer to conversation
            offer.conversationId = conversation._id;
            offer.lastMessageAt = new Date();
            await offer.save();

            // Send real-time notification to seller
            io.to(`user:${data.seller}`).emit('offer:received', {
                offer: offer.toJSON(),
                conversationId: conversation._id
            });

            socket.emit('offer:created', {
                offer: offer.toJSON(),
                conversationId: conversation._id
            });

            logger.info(`Offer created by user ${socket.userId} for seller ${data.seller}`);

        } catch (error) {
            logger.error('Offer create error:', error);
            socket.emit('error', { message: 'Failed to create offer' });
        }
    });

    // Respond to offer
    socket.on('offer:respond', async (data) => {
        try {
            const { offerId, action, changes, message } = data;

            const offer = await Offer.findById(offerId).populate('buyer seller');
            if (!offer) {
                socket.emit('error', { message: 'Offer not found' });
                return;
            }

            // Only seller can respond to offers
            if (offer.seller._id.toString() !== socket.userId) {
                socket.emit('error', { message: 'Only the seller can respond to this offer' });
                return;
            }

            // Perform the action
            let updatedOffer;
            switch (action) {
                case 'accept':
                    updatedOffer = await offer.accept(socket.userId, message);
                    break;
                case 'reject':
                    updatedOffer = await offer.reject(socket.userId, message);
                    break;
                case 'counter':
                    updatedOffer = await offer.counter(socket.userId, changes, message);
                    break;
                default:
                    throw new Error('Invalid action');
            }

            // Send notifications
            io.to(`user:${offer.buyer._id}`).emit('offer:response', {
                offer: updatedOffer.toJSON(),
                action,
                responder: {
                    id: socket.userId,
                    name: socket.user.fullName,
                    role: socket.userRole
                }
            });

            socket.emit('offer:responded', {
                offer: updatedOffer.toJSON(),
                action
            });

            logger.info(`Offer ${offerId} ${action}ed by user ${socket.userId}`);

        } catch (error) {
            logger.error('Offer respond error:', error);
            socket.emit('error', { message: error.message });
        }
    });
};

// Typing event handlers
const handleTypingEvents = (socket, io) => {
    socket.on('typing:start', (data) => {
        const { conversationId } = data;
        socket.to(`conversation:${conversationId}`).emit('typing:start', {
            userId: socket.userId,
            userName: socket.user.fullName || socket.user.firstName,
            conversationId
        });
    });

    socket.on('typing:stop', (data) => {
        const { conversationId } = data;
        socket.to(`conversation:${conversationId}`).emit('typing:stop', {
            userId: socket.userId,
            conversationId
        });
    });
};

// System event handlers
const handleSystemEvents = (socket, io) => {
    // Credit notifications
    socket.on('finance:credit_update', async (data) => {
        try {
            const { type, amount, transactionId } = data;

            const creditLimit = await CreditLimit.findOne({ user: socket.userId });
            if (!creditLimit) return;

            io.to(`user:${socket.userId}`).emit('finance:credit_changed', {
                availableCredit: creditLimit.availableCredit,
                usedCredit: creditLimit.usedCredit,
                creditLimit: creditLimit.creditLimit,
                type,
                amount,
                transactionId
            });

        } catch (error) {
            logger.error('Credit update error:', error);
        }
    });

    // System notifications
    socket.on('system:notification', (data) => {
        const { type, message, data: notificationData } = data;

        io.to(`user:${socket.userId}`).emit('system:notification', {
            type,
            message,
            data: notificationData,
            timestamp: new Date()
        });
    });
};

// Helper functions
const updateUserOnlineStatus = async (userId, isOnline) => {
    try {
        await User.findByIdAndUpdate(userId, {
            'preferences.privacy.showOnlineStatus': isOnline
        });
    } catch (error) {
        logger.error('Update online status error:', error);
    }
};

const notifyContactsOnlineStatus = async (userId, isOnline, io) => {
    try {
        // Find conversations where user is participant
        const conversations = await Conversation.find({
            'participants.user': userId,
            'participants.isActive': true
        }).populate('participants.user');

        const contactIds = new Set();
        conversations.forEach(conversation => {
            conversation.participants.forEach(participant => {
                if (participant.user._id.toString() !== userId && participant.isActive) {
                    contactIds.add(participant.user._id.toString());
                }
            });
        });

        // Notify all contacts
        contactIds.forEach(contactId => {
            io.to(`user:${contactId}`).emit('user:status_change', {
                userId,
                isOnline,
                timestamp: new Date()
            });
        });

    } catch (error) {
        logger.error('Notify contacts error:', error);
    }
};

const markMessagesAsRead = async (conversationId, userId) => {
    try {
        await ChatMessage.updateMany(
            {
                conversationId,
                'readBy.user': { $ne: userId },
                sender: { $ne: userId }
            },
            {
                $addToSet: {
                    readBy: {
                        user: userId,
                        readAt: new Date()
                    }
                },
                status: 'read'
            }
        );
    } catch (error) {
        logger.error('Mark messages read error:', error);
    }
};

const sendMessageNotifications = async (message, conversation, io) => {
    try {
        const offlineParticipants = conversation.participants.filter(
            p => p.user.toString() !== message.sender.toString() &&
                !userSockets.has(p.user.toString())
        );

        for (const participant of offlineParticipants) {
            // Create notification
            const notification = new Notification({
                recipient: participant.user,
                type: 'chat_message',
                title: 'New Message',
                message: `${message.senderName}: ${message.content.substring(0, 50)}...`,
                data: {
                    messageId: message._id,
                    conversationId: conversation._id,
                    senderId: message.sender,
                    senderName: message.senderName
                },
                channels: ['in_app', 'push']
            });

            await notification.save();

            // Send push notification if enabled
            await sendPushNotification(participant.user, notification);
        }

    } catch (error) {
        logger.error('Send message notifications error:', error);
    }
};

const sendPushNotification = async (userId, notification) => {
    try {
        // Implementation for push notifications
        // This would integrate with Firebase FCM or similar service
        logger.info(`Push notification sent to user ${userId}: ${notification.title}`);
    } catch (error) {
        logger.error('Push notification error:', error);
    }
};

const sendInitialData = async (socket, io) => {
    try {
        // Send user's active conversations
        const conversations = await Conversation.find({
            'participants.user': socket.userId,
            'participants.isActive': true,
            status: 'active'
        })
            .populate('participants.user', 'firstName lastName businessName avatar')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 })
            .limit(20);

        socket.emit('chat:initial_data', {
            conversations: conversations.map(conv => conv.toJSON())
        });

        // Send user's offers
        const offers = await Offer.find({
            $or: [
                { buyer: socket.userId },
                { seller: socket.userId }
            ],
            status: { $nin: ['expired', 'withdrawn', 'cancelled'] }
        })
            .populate('buyer', 'firstName lastName businessName')
            .populate('seller', 'firstName lastName businessName')
            .sort({ createdAt: -1 })
            .limit(10);

        socket.emit('offers:initial_data', {
            offers: offers.map(offer => offer.toJSON())
        });

    } catch (error) {
        logger.error('Send initial data error:', error);
    }
};

module.exports = socketHandlers;