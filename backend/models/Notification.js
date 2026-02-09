const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // Recipient Information
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Notification Content
    type: {
        type: String,
        enum: [
            'chat_message',
            'offer_received',
            'offer_response',
            'offer_accepted',
            'offer_rejected',
            'offer_countered',
            'order_placed',
            'order_confirmed',
            'order_shipped',
            'order_delivered',
            'payment_received',
            'payment_failed',
            'credit_added',
            'credit_deducted',
            'system_update',
            'promotion',
            'security_alert',
            'reminder',
            'feedback_request'
        ],
        required: true
    },

    title: {
        type: String,
        required: [true, 'Notification title is required'],
        maxlength: [100, 'Title cannot exceed 100 characters']
    },

    message: {
        type: String,
        required: [true, 'Notification message is required'],
        maxlength: [500, 'Message cannot exceed 500 characters']
    },

    // Data payload for additional information
    data: {
        messageId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'ChatMessage'
        },
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation'
        },
        offerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Offer'
        },
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        paymentId: String,
        transactionId: String,
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        senderName: String,
        amount: Number,
        currency: String,
        priority: {
            type: String,
            enum: ['low', 'normal', 'high', 'urgent'],
            default: 'normal'
        },
        tags: [String],
        metadata: mongoose.Schema.Types.Mixed
    },

    // Delivery Channels
    channels: [{
        type: String,
        enum: ['in_app', 'push', 'email', 'sms'],
        required: true
    }],

    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'],
        default: 'pending'
    },

    deliveryStatus: {
        in_app: {
            delivered: { type: Boolean, default: false },
            deliveredAt: Date,
            read: { type: Boolean, default: false },
            readAt: Date
        },
        push: {
            sent: { type: Boolean, default: false },
            sentAt: Date,
            delivered: { type: Boolean, default: false },
            deliveredAt: Date,
            failed: { type: Boolean, default: false },
            failureReason: String,
            messageId: String
        },
        email: {
            sent: { type: Boolean, default: false },
            sentAt: Date,
            delivered: { type: Boolean, default: false },
            deliveredAt: Date,
            opened: { type: Boolean, default: false },
            openedAt: Date,
            clicked: { type: Boolean, default: false },
            clickedAt: Date,
            failed: { type: Boolean, default: false },
            failureReason: String,
            messageId: String
        },
        sms: {
            sent: { type: Boolean, default: false },
            sentAt: Date,
            delivered: { type: Boolean, default: false },
            deliveredAt: Date,
            failed: { type: Boolean, default: false },
            failureReason: String,
            messageId: String
        }
    },

    // Priority and Urgency
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },

    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    },

    // Action Buttons
    actions: [{
        label: {
            type: String,
            required: true,
            maxlength: [20, 'Action label cannot exceed 20 characters']
        },
        type: {
            type: String,
            enum: ['primary', 'secondary', 'danger'],
            default: 'secondary'
        },
        action: {
            type: String,
            enum: ['open_chat', 'view_offer', 'view_order', 'make_payment', 'dismiss'],
            required: true
        },
        url: String,
        data: mongoose.Schema.Types.Mixed
    }],

    // Grouping and Threading
    groupId: String, // For grouping related notifications
    threadId: String, // For threading conversation notifications

    // User Preferences
    userPreference: {
        enabled: { type: Boolean, default: true },
        quietHours: {
            enabled: { type: Boolean, default: false },
            start: String, // HH:mm format
            end: String    // HH:mm format
        },
        channels: {
            in_app: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            email: { type: Boolean, default: false },
            sms: { type: Boolean, default: false }
        }
    },

    // Analytics
    analytics: {
        source: String,
        campaign: String,
        segment: String,
        triggeredBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        automated: { type: Boolean, default: false }
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    sentAt: Date,
    deliveredAt: Date,
    readAt: Date,
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Indexes for better performance
notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, status: 1, type: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
notificationSchema.index({ groupId: 1 });
notificationSchema.index({ threadId: 1 });
notificationSchema.index({ 'analytics.campaign': 1 });

// Virtual for checking if notification is expired
notificationSchema.virtual('isExpired').get(function () {
    return new Date() > new Date(this.expiresAt);
});

// Virtual for checking if notification is unread
notificationSchema.virtual('isUnread').get(function () {
    return this.status !== 'read';
});

// Virtual for time since creation
notificationSchema.virtual('timeAgo').get(function () {
    const now = new Date();
    const created = new Date(this.createdAt);
    const diffInSeconds = Math.floor((now - created) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
});

// Pre-save middleware
notificationSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});

// Methods
notificationSchema.methods.markAsRead = function () {
    this.status = 'read';
    this.readAt = new Date();
    this.deliveryStatus.in_app.read = true;
    this.deliveryStatus.in_app.readAt = new Date();
    return this.save();
};

notificationSchema.methods.markAsDelivered = function (channel = 'in_app') {
    if (channel === 'in_app') {
        this.deliveryStatus.in_app.delivered = true;
        this.deliveryStatus.in_app.deliveredAt = new Date();
    } else if (channel === 'push') {
        this.deliveryStatus.push.delivered = true;
        this.deliveryStatus.push.deliveredAt = new Date();
    } else if (channel === 'email') {
        this.deliveryStatus.email.delivered = true;
        this.deliveryStatus.email.deliveredAt = new Date();
    } else if (channel === 'sms') {
        this.deliveryStatus.sms.delivered = true;
        this.deliveryStatus.sms.deliveredAt = new Date();
    }

    // Update overall status
    if (this.deliveryStatus.in_app.delivered) {
        this.status = 'delivered';
        this.deliveredAt = new Date();
    }

    return this.save();
};

notificationSchema.methods.markAsFailed = function (channel, reason) {
    if (channel === 'push') {
        this.deliveryStatus.push.failed = true;
        this.deliveryStatus.push.failureReason = reason;
    } else if (channel === 'email') {
        this.deliveryStatus.email.failed = true;
        this.deliveryStatus.email.failureReason = reason;
    } else if (channel === 'sms') {
        this.deliveryStatus.sms.failed = true;
        this.deliveryStatus.sms.failureReason = reason;
    }

    return this.save();
};

notificationSchema.methods.shouldSend = function () {
    // Check if notification is not expired
    if (this.isExpired) return false;

    // Check if notification is already read
    if (this.status === 'read') return false;

    // Check user preferences
    if (!this.userPreference.enabled) return false;

    // Check quiet hours
    if (this.userPreference.quietHours.enabled) {
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:mm format
        const { start, end } = this.userPreference.quietHours;

        if (start <= currentTime && currentTime <= end) {
            return false;
        }
    }

    // Check if at least one channel is enabled
    return this.channels.some(channel => this.userPreference.channels[channel]);
};

// Static methods
notificationSchema.statics.createChatNotification = function (recipient, message, sender) {
    return new this({
        recipient,
        type: 'chat_message',
        title: 'New Message',
        message: `${sender.fullName}: ${message.content.substring(0, 50)}...`,
        data: {
            messageId: message._id,
            conversationId: message.conversationId,
            senderId: sender._id,
            senderName: sender.fullName,
            priority: 'normal'
        },
        channels: ['in_app', 'push'],
        actions: [
            {
                label: 'Reply',
                type: 'primary',
                action: 'open_chat',
                data: { conversationId: message.conversationId }
            }
        ]
    });
};

notificationSchema.statics.createOfferNotification = function (recipient, offer, action) {
    const titles = {
        offer_received: 'New Offer Received',
        offer_response: 'Offer Response',
        offer_accepted: 'Offer Accepted',
        offer_rejected: 'Offer Rejected',
        offer_countered: 'Offer Countered'
    };

    const messages = {
        offer_received: `You received a new offer for ${offer.product.name}`,
        offer_response: `Your offer for ${offer.product.name} received a response`,
        offer_accepted: `Your offer for ${offer.product.name} was accepted`,
        offer_rejected: `Your offer for ${offer.product.name} was rejected`,
        offer_countered: `Your offer for ${offer.product.name} was countered`
    };

    return new this({
        recipient,
        type: action,
        title: titles[action],
        message: messages[action],
        data: {
            offerId: offer._id,
            senderId: action === 'offer_received' ? offer.buyer : offer.seller,
            amount: offer.pricing.offerPrice,
            currency: offer.pricing.currency,
            priority: offer.priority === 'urgent' ? 'high' : 'normal'
        },
        channels: ['in_app', 'push'],
        actions: [
            {
                label: 'View Offer',
                type: 'primary',
                action: 'view_offer',
                data: { offerId: offer._id }
            }
        ]
    });
};

notificationSchema.statics.createPaymentNotification = function (recipient, transaction, type) {
    const titles = {
        payment_received: 'Payment Received',
        payment_failed: 'Payment Failed',
        credit_added: 'Credit Added',
        credit_deducted: 'Credit Deducted'
    };

    const messages = {
        payment_received: `Payment of ${transaction.currency} ${transaction.amount} received`,
        payment_failed: `Payment of ${transaction.currency} ${transaction.amount} failed`,
        credit_added: `${transaction.currency} ${transaction.amount} added to your account`,
        credit_deducted: `${transaction.currency} ${transaction.amount} deducted from your account`
    };

    return new this({
        recipient,
        type,
        title: titles[type],
        message: messages[type],
        data: {
            transactionId: transaction.transactionId,
            paymentId: transaction.paymentId,
            amount: transaction.amount,
            currency: transaction.currency,
            priority: type === 'payment_failed' ? 'high' : 'normal'
        },
        channels: ['in_app', 'push'],
        actions: type === 'payment_failed' ? [
            {
                label: 'Retry Payment',
                type: 'primary',
                action: 'make_payment',
                data: { paymentId: transaction.paymentId }
            }
        ] : []
    });
};

module.exports = mongoose.model('Notification', notificationSchema);