const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    // Message Identification
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true
    },
    messageId: {
        type: String,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },

    // Sender Information
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderName: {
        type: String,
        required: true
    },
    senderRole: {
        type: String,
        enum: ['user', 'vendor', 'admin', 'system'],
        required: true
    },

    // Message Content
    messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'voice', 'location', 'offer', 'system'],
        default: 'text'
    },
    content: {
        type: String,
        required: true,
        maxlength: [2000, 'Message content cannot exceed 2000 characters']
    },

    // Media Files
    media: {
        url: String,
        filename: String,
        mimeType: String,
        size: Number,
        thumbnail: String
    },

    // Location Data
    location: {
        latitude: Number,
        longitude: Number,
        address: String
    },

    // Offer Data (for offer messages)
    offer: {
        offerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Offer'
        },
        title: String,
        amount: Number,
        currency: { type: String, default: 'INR' },
        status: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'countered', 'expired']
        }
    },

    // Message Status
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent'
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: {
            type: Date,
            default: Date.now
        }
    }],
    deliveredTo: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        deliveredAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Reply Information
    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    quotedMessage: {
        content: String,
        sender: String,
        messageId: String
    },

    // Reactions
    reactions: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        emoji: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Encryption and Security
    isEncrypted: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // System Message Flags
    isSystemMessage: {
        type: Boolean,
        default: false
    },
    systemMessageType: {
        type: String,
        enum: [
            'user_joined',
            'user_left',
            'conversation_created',
            'offer_created',
            'offer_accepted',
            'offer_rejected',
            'offer_countered',
            'payment_processed',
            'order_placed',
            'order_confirmed',
            'order_shipped',
            'order_delivered',
            'order_cancelled',
            'credit_added',
            'credit_deducted',
            'account_suspended',
            'account_activated'
        ]
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Conversation Schema
const conversationSchema = new mongoose.Schema({
    conversationId: {
        type: String,
        unique: true,
        default: () => new mongoose.Types.ObjectId().toString()
    },

    // Participants
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        role: {
            type: String,
            enum: ['user', 'vendor', 'admin'],
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        },
        isActive: {
            type: Boolean,
            default: true
        },
        lastReadAt: {
            type: Date,
            default: Date.now
        },
        notifications: {
            type: Boolean,
            default: true
        }
    }],

    // Conversation Type
    conversationType: {
        type: String,
        enum: ['direct', 'group', 'system'],
        default: 'direct'
    },

    // Group Information (for group chats)
    groupInfo: {
        name: String,
        description: String,
        avatar: String,
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        admins: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isPrivate: {
            type: Boolean,
            default: true
        },
        inviteCode: String
    },

    // Business Context
    businessContext: {
        orderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order'
        },
        offerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Offer'
        },
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        inquiryType: {
            type: String,
            enum: ['general', 'product_inquiry', 'quote_request', 'complaint', 'support']
        }
    },

    // Status and Settings
    status: {
        type: String,
        enum: ['active', 'archived', 'blocked', 'closed'],
        default: 'active'
    },
    isBlocked: {
        type: Boolean,
        default: false
    },
    blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    blockedAt: Date,
    blockReason: String,

    // Message Counters
    messageCount: {
        type: Number,
        default: 0
    },
    unreadCount: {
        type: Number,
        default: 0
    },
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ChatMessage'
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },

    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
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
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ sender: 1, createdAt: -1 });
chatMessageSchema.index({ 'readBy.user': 1 });
chatMessageSchema.index({ messageId: 1 });

conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ conversationId: 1 });
conversationSchema.index({ status: 1 });
conversationSchema.index({ lastMessageAt: -1 });

// Virtual for unread count per user
conversationSchema.virtual('unreadMessages').get(function () {
    return this.messages.filter(message =>
        !message.readBy.some(read => read.user.toString() === this.userId?.toString()) &&
        message.sender.toString() !== this.userId?.toString()
    );
});

// Methods for ChatMessage
chatMessageSchema.methods.markAsRead = function (userId) {
    const alreadyRead = this.readBy.some(read => read.user.toString() === userId.toString());

    if (!alreadyRead) {
        this.readBy.push({ user: userId, readAt: new Date() });
        this.status = 'read';
        return this.save();
    }

    return Promise.resolve(this);
};

// Methods for Conversation
conversationSchema.methods.addParticipant = function (userId, role = 'user') {
    const existingParticipant = this.participants.find(
        p => p.user.toString() === userId.toString()
    );

    if (!existingParticipant) {
        this.participants.push({
            user: userId,
            role,
            joinedAt: new Date(),
            isActive: true
        });
        return this.save();
    }

    return Promise.resolve(this);
};

conversationSchema.methods.removeParticipant = function (userId) {
    this.participants = this.participants.filter(
        p => p.user.toString() !== userId.toString()
    );
    return this.save();
};

conversationSchema.methods.markAsReadForUser = function (userId) {
    const participant = this.participants.find(
        p => p.user.toString() === userId.toString()
    );

    if (participant) {
        participant.lastReadAt = new Date();
        return this.save();
    }

    return Promise.resolve(this);
};

// Create models
const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = {
    ChatMessage,
    Conversation
};