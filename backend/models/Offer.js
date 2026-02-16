const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    // Offer Identification
    offerId: {
        type: String,
        unique: true,
        default: () => 'OFF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },

    // Basic Information
    title: {
        type: String,
        required: [true, 'Offer title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
        type: String,
        required: [true, 'Offer description is required'],
        maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    // Parties Involved
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Product Information
    product: {
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        category: String,
        specifications: [{
            name: String,
            value: String
        }],
        images: [String],
        sku: String,
        brand: String
    },

    // Pricing Information
    pricing: {
        originalPrice: {
            type: Number,
            required: [true, 'Original price is required'],
            min: [0, 'Price cannot be negative']
        },
        offerPrice: {
            type: Number,
            required: [true, 'Offer price is required'],
            min: [0, 'Price cannot be negative']
        },
        currency: {
            type: String,
            default: 'INR',
            enum: ['INR', 'USD', 'EUR', 'GBP']
        },
        discount: {
            percentage: Number,
            amount: Number
        },
        minimumQuantity: {
            type: Number,
            default: 1,
            min: [1, 'Minimum quantity must be at least 1']
        },
        maximumQuantity: {
            type: Number,
            min: [1, 'Maximum quantity must be at least 1']
        }
    },

    // Quantity and Availability
    quantity: {
        requested: {
            type: Number,
            required: [true, 'Requested quantity is required'],
            min: [1, 'Quantity must be at least 1']
        },
        available: {
            type: Number,
            default: 0
        },
        unit: {
            type: String,
            required: [true, 'Unit is required'],
            enum: ['pieces', 'kg', 'grams', 'liters', 'meters', 'boxes', 'packs', 'sets']
        }
    },

    // Offer Status
    status: {
        type: String,
        enum: [
            'pending',
            'sent',
            'viewed',
            'countered',
            'accepted',
            'rejected',
            'expired',
            'withdrawn',
            'cancelled',
            'completed'
        ],
        default: 'pending'
    },
    maxVendorCounters: {
        type: Number,
        default: 2,
        min: [0, 'maxVendorCounters cannot be negative']
    },
    vendorCounterCount: {
        type: Number,
        default: 0,
        min: [0, 'vendorCounterCount cannot be negative']
    },

    // Timeline
    validity: {
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            required: [true, 'End date is required']
        },
        timezone: {
            type: String,
            default: 'Asia/Kolkata'
        }
    },

    // Negotiation History
    negotiations: [{
        fromUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        toUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        action: {
            type: String,
            enum: ['sent', 'countered', 'accepted', 'rejected', 'withdrawn', 'modified'],
            required: true
        },
        changes: {
            price: Number,
            quantity: Number,
            description: String,
            terms: [String]
        },
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],

    // Terms and Conditions
    terms: {
        paymentTerms: {
            type: String,
            enum: [
                'advance_payment',
                'cod',
                'net_30',
                'net_60',
                'net_90',
                'custom'
            ],
            default: 'net_30'
        },
        deliveryTerms: {
            type: String,
            enum: [
                'ex_works',
                'fob',
                'cif',
                'door_delivery',
                'pickup'
            ],
            default: 'door_delivery'
        },
        warranty: {
            duration: String,
            coverage: String
        },
        returnPolicy: {
            days: Number,
            conditions: String
        },
        customTerms: [String]
    },

    // Shipping Information
    shipping: {
        from: {
            address: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' }
        },
        to: {
            address: String,
            city: String,
            state: String,
            pincode: String,
            country: { type: String, default: 'India' }
        },
        method: {
            type: String,
            enum: ['standard', 'express', 'same_day', 'pickup']
        },
        estimatedDays: Number,
        cost: Number
    },

    // Attachments
    attachments: [{
        filename: String,
        url: String,
        mimeType: String,
        size: Number,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadedAt: {
            type: Date,
            default: Date.now
        }
    }],

    // Priority and Urgency
    priority: {
        type: String,
        enum: ['low', 'normal', 'high', 'urgent'],
        default: 'normal'
    },
    isUrgent: {
        type: Boolean,
        default: false
    },

    // Business Context
    context: {
        inquiryType: {
            type: String,
            enum: ['rfq', 'quote_request', 'bulk_order', 'regular_order', 'sample_request'],
            default: 'rfq'
        },
        projectId: String,
        referenceId: String,
        tags: [String]
    },

    // Analytics
    analytics: {
        views: {
            type: Number,
            default: 0
        },
        responses: {
            type: Number,
            default: 0
        },
        timeToResponse: Number, // in hours
        conversionRate: Number
    },

    // Communication
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation'
    },
    lastMessageAt: Date,

    // System Fields
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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
offerSchema.index({ buyer: 1, createdAt: -1 });
offerSchema.index({ seller: 1, status: 1 });
offerSchema.index({ 'product.productId': 1 });
offerSchema.index({ status: 1, 'validity.endDate': 1 });
offerSchema.index({ offerId: 1 });
offerSchema.index({ title: 'text', description: 'text' });

// Virtual for time remaining
offerSchema.virtual('timeRemaining').get(function () {
    const now = new Date();
    const end = new Date(this.validity.endDate);
    return Math.max(0, end - now);
});

// Virtual for discount percentage
offerSchema.virtual('discountPercentage').get(function () {
    if (this.pricing.originalPrice === 0) return 0;
    return Math.round(((this.pricing.originalPrice - this.pricing.offerPrice) / this.pricing.originalPrice) * 100);
});

// Virtual for is expired
offerSchema.virtual('isExpired').get(function () {
    return new Date() > new Date(this.validity.endDate);
});

// Virtual for days remaining
offerSchema.virtual('daysRemaining').get(function () {
    const now = new Date();
    const end = new Date(this.validity.endDate);
    const diffTime = end - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for remaining vendor counters
offerSchema.virtual('remainingVendorCounters').get(function () {
    return Math.max(0, (this.maxVendorCounters || 2) - (this.vendorCounterCount || 0));
});

// Pre-save middleware
offerSchema.pre('save', function (next) {
    // Calculate discount
    if (this.pricing.originalPrice && this.pricing.offerPrice) {
        this.pricing.discount = {
            percentage: Math.round(((this.pricing.originalPrice - this.pricing.offerPrice) / this.pricing.originalPrice) * 100),
            amount: this.pricing.originalPrice - this.pricing.offerPrice
        };
    }

    // Set end date if not provided
    if (!this.validity.endDate) {
        this.validity.endDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
    }

    // Update timestamps
    this.updatedAt = new Date();
    next();
});

// Methods
offerSchema.methods.accept = function (userId, message = '') {
    if (!['pending', 'sent', 'countered'].includes(this.status)) {
        throw new Error('Offer cannot be accepted in current status');
    }

    this.status = 'accepted';
    this.negotiations.push({
        fromUser: userId,
        toUser: this.buyer.toString() === userId.toString() ? this.seller : this.buyer,
        action: 'accepted',
        message,
        timestamp: new Date()
    });

    return this.save();
};

offerSchema.methods.reject = function (userId, message = '') {
    if (!['pending', 'sent', 'countered'].includes(this.status)) {
        throw new Error('Offer cannot be rejected in current status');
    }

    this.status = 'rejected';
    this.negotiations.push({
        fromUser: userId,
        toUser: this.buyer.toString() === userId.toString() ? this.seller : this.buyer,
        action: 'rejected',
        message,
        timestamp: new Date()
    });

    return this.save();
};

offerSchema.methods.counter = function (userId, changes, message = '') {
    if (!['pending', 'sent', 'countered'].includes(this.status)) {
        throw new Error('Offer cannot be countered in current status');
    }

    const isSellerCounter = this.seller.toString() === userId.toString();
    if (isSellerCounter) {
        const remaining = Math.max(0, (this.maxVendorCounters || 2) - (this.vendorCounterCount || 0));
        if (remaining <= 0) {
            const err = new Error('Vendor counter limit reached. Accept or reject the latest buyer offer.');
            err.code = 'VENDOR_COUNTER_LIMIT_REACHED';
            throw err;
        }
        this.vendorCounterCount += 1;
    }

    this.status = 'countered';

    // Apply changes
    if (changes?.price !== undefined && changes?.price !== null) this.pricing.offerPrice = changes.price;
    if (changes?.quantity !== undefined && changes?.quantity !== null) this.quantity.requested = changes.quantity;
    if (changes?.description) this.description = changes.description;

    this.negotiations.push({
        fromUser: userId,
        toUser: this.buyer.toString() === userId.toString() ? this.seller : this.buyer,
        action: 'countered',
        changes,
        message,
        timestamp: new Date()
    });

    return this.save();
};

offerSchema.methods.withdraw = function (userId, reason = '') {
    if (this.buyer.toString() !== userId.toString()) {
        throw new Error('Only the buyer can withdraw the offer');
    }

    if (this.status === 'accepted' || this.status === 'completed') {
        throw new Error('Cannot withdraw accepted or completed offer');
    }

    this.status = 'withdrawn';
    this.negotiations.push({
        fromUser: userId,
        toUser: this.seller,
        action: 'withdrawn',
        message: reason,
        timestamp: new Date()
    });

    return this.save();
};

offerSchema.methods.expire = function () {
    this.status = 'expired';
    return this.save();
};

module.exports = mongoose.model('Offer', offerSchema);
