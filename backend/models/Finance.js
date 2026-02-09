const mongoose = require('mongoose');

// Credit Ledger Schema
const creditLedgerSchema = new mongoose.Schema({
    // Transaction Identification
    transactionId: {
        type: String,
        unique: true,
        default: () => 'TXN-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },

    // User Information
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    businessName: String,

    // Transaction Details
    type: {
        type: String,
        enum: [
            'credit_addition',
            'credit_deduction',
            'payment_received',
            'payment_made',
            'refund',
            'chargeback',
            'fee_charge',
            'bonus_credit',
            'penalty',
            'adjustment'
        ],
        required: true
    },

    category: {
        type: String,
        enum: [
            'order_payment',
            'offer_payment',
            'subscription_fee',
            'service_fee',
            'penalty',
            'bonus',
            'refund',
            'withdrawal',
            'deposit',
            'transfer',
            'adjustment',
            'commission',
            'tax'
        ],
        required: true
    },

    // Amount Information
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },

    // Balance Information
    balanceBefore: {
        type: Number,
        required: true
    },
    balanceAfter: {
        type: Number,
        required: true
    },

    // Reference Information
    reference: {
        type: {
            type: String,
            enum: ['order', 'offer', 'invoice', 'user', 'admin', 'system'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        }
    },

    // Payment Information
    paymentMethod: {
        type: String,
        enum: [
            'credit_balance',
            'bank_transfer',
            'upi',
            'credit_card',
            'debit_card',
            'net_banking',
            'wallet',
            'crypto',
            'cash',
            'cheque'
        ]
    },
    paymentGateway: {
        name: String,
        transactionId: String,
        gatewayResponse: mongoose.Schema.Types.Mixed
    },

    // Status and State
    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'completed',
            'failed',
            'cancelled',
            'refunded',
            'disputed'
        ],
        default: 'pending'
    },

    // Description and Notes
    description: {
        type: String,
        required: [true, 'Description is required'],
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    notes: String,

    // Additional Data
    metadata: {
        taxAmount: Number,
        discountAmount: Number,
        fees: {
            gatewayFee: Number,
            serviceFee: Number,
            taxFee: Number
        },
        tags: [String],
        location: {
            city: String,
            state: String,
            country: String
        }
    },

    // Approval Information
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    approvedAt: Date,
    approvalNotes: String,

    // Timestamps
    transactionDate: {
        type: Date,
        default: Date.now
    },
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

// Credit Limit Schema
const creditLimitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },

    // Credit Limits
    creditLimit: {
        type: Number,
        required: [true, 'Credit limit is required'],
        min: [0, 'Credit limit cannot be negative']
    },
    availableCredit: {
        type: Number,
        required: true,
        min: [0, 'Available credit cannot be negative']
    },
    usedCredit: {
        type: Number,
        default: 0,
        min: [0, 'Used credit cannot be negative']
    },

    // Risk Assessment
    riskScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 50
    },
    creditRating: {
        type: String,
        enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'CCC', 'CC', 'C', 'D'],
        default: 'B'
    },

    // Business Information
    businessDetails: {
        registrationNumber: String,
        gstNumber: String,
        panNumber: String,
        establishmentDate: Date,
        annualTurnover: Number,
        employeeCount: Number,
        businessType: String,
        industry: String
    },

    // Financial History
    financialHistory: {
        totalOrders: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        onTimePayments: { type: Number, default: 0 },
        latePayments: { type: Number, default: 0 },
        defaultedPayments: { type: Number, default: 0 },
        averageOrderValue: { type: Number, default: 0 },
        paymentStreak: { type: Number, default: 0 },
        lastPaymentDate: Date
    },

    // Documents and Verification
    documents: [{
        type: {
            type: String,
            enum: [
                'business_registration',
                'gst_certificate',
                'pan_card',
                'bank_statement',
                'tax_returns',
                'audit_report',
                'credit_report',
                'reference_letter'
            ]
        },
        filename: String,
        url: String,
        verified: { type: Boolean, default: false },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date,
        notes: String
    }],

    // Status
    status: {
        type: String,
        enum: ['active', 'suspended', 'revoked', 'under_review'],
        default: 'active'
    },

    // Review Information
    lastReviewDate: Date,
    nextReviewDate: Date,
    reviewNotes: String,

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

// Payment Schema
const paymentSchema = new mongoose.Schema({
    // Payment Identification
    paymentId: {
        type: String,
        unique: true,
        default: () => 'PAY-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase()
    },

    // Parties
    payer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    payee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },

    // Payment Details
    amount: {
        type: Number,
        required: [true, 'Amount is required'],
        min: [0, 'Amount cannot be negative']
    },
    currency: {
        type: String,
        default: 'INR',
        enum: ['INR', 'USD', 'EUR', 'GBP']
    },

    // Reference
    reference: {
        type: {
            type: String,
            enum: ['order', 'offer', 'invoice', 'subscription', 'service'],
            required: true
        },
        id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        number: String
    },

    // Payment Method
    paymentMethod: {
        type: String,
        enum: [
            'credit_balance',
            'bank_transfer',
            'upi',
            'credit_card',
            'debit_card',
            'net_banking',
            'wallet',
            'crypto'
        ],
        required: true
    },

    // Gateway Information
    paymentGateway: {
        name: {
            type: String,
            enum: ['razorpay', 'payu', 'instamojo', 'paytm', 'stripe', 'custom'],
            default: 'razorpay'
        },
        gatewayTransactionId: String,
        gatewayOrderId: String,
        gatewayPaymentId: String,
        gatewayResponse: mongoose.Schema.Types.Mixed,
        webhookData: mongoose.Schema.Types.Mixed
    },

    // Status
    status: {
        type: String,
        enum: [
            'pending',
            'processing',
            'authorized',
            'captured',
            'failed',
            'cancelled',
            'refunded',
            'partially_refunded',
            'disputed',
            'timeout'
        ],
        default: 'pending'
    },

    // Timeline
    initiatedAt: {
        type: Date,
        default: Date.now
    },
    authorizedAt: Date,
    capturedAt: Date,
    failedAt: Date,
    refundedAt: Date,

    // Fees and Charges
    fees: {
        gatewayFee: { type: Number, default: 0 },
        serviceFee: { type: Number, default: 0 },
        taxAmount: { type: Number, default: 0 },
        totalFees: { type: Number, default: 0 }
    },

    // Failure Information
    failure: {
        code: String,
        description: String,
        source: String,
        step: String
    },

    // Refund Information
    refunds: [{
        refundId: String,
        amount: Number,
        reason: String,
        status: {
            type: String,
            enum: ['pending', 'processed', 'failed', 'cancelled']
        },
        processedAt: Date,
        gatewayRefundId: String
    }],

    // Metadata
    metadata: {
        ipAddress: String,
        userAgent: String,
        location: {
            city: String,
            state: String,
            country: String
        },
        device: String,
        browser: String,
        isRecurring: { type: Boolean, default: false },
        subscriptionId: String
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

// Indexes
creditLedgerSchema.index({ user: 1, transactionDate: -1 });
creditLedgerSchema.index({ transactionId: 1 });
creditLedgerSchema.index({ status: 1, type: 1 });
creditLedgerSchema.index({ 'reference.id': 1, 'reference.type': 1 });

creditLimitSchema.index({ user: 1 });
creditLimitSchema.index({ creditRating: 1, status: 1 });
creditLimitSchema.index({ riskScore: 1 });

paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ payer: 1, status: 1 });
paymentSchema.index({ payee: 1, status: 1 });
paymentSchema.index({ 'reference.id': 1, 'reference.type': 1 });
paymentSchema.index({ status: 1, initiatedAt: -1 });
paymentSchema.index({ 'paymentGateway.gatewayTransactionId': 1 });

// Virtuals
creditLimitSchema.virtual('utilizationPercentage').get(function () {
    if (this.creditLimit === 0) return 0;
    return Math.round((this.usedCredit / this.creditLimit) * 100);
});

creditLimitSchema.virtual('availableForUse').get(function () {
    return Math.max(0, this.availableCredit);
});

paymentSchema.virtual('isSuccessful').get(function () {
    return ['authorized', 'captured'].includes(this.status);
});

paymentSchema.virtual('isFailed').get(function () {
    return ['failed', 'cancelled', 'timeout'].includes(this.status);
});

paymentSchema.virtual('refundedAmount').get(function () {
    return this.refunds
        .filter(refund => refund.status === 'processed')
        .reduce((total, refund) => total + refund.amount, 0);
});

// Methods
creditLedgerSchema.methods.reverseTransaction = function (adminId, reason = '') {
    if (this.status !== 'completed') {
        throw new Error('Only completed transactions can be reversed');
    }

    const CreditLedger = mongoose.model('CreditLedger');

    const reverseTransaction = new CreditLedger({
        user: this.user,
        type: 'adjustment',
        category: 'adjustment',
        amount: -this.amount,
        balanceBefore: this.balanceAfter,
        balanceAfter: this.balanceBefore,
        reference: {
            type: 'admin',
            id: adminId
        },
        description: `Reversal of transaction ${this.transactionId}`,
        notes: reason,
        status: 'completed',
        approvedBy: adminId,
        approvedAt: new Date()
    });

    this.status = 'reversed';

    return Promise.all([this.save(), reverseTransaction.save()]);
};

paymentSchema.methods.processRefund = function (amount, reason, adminId) {
    if (!this.isSuccessful) {
        throw new Error('Only successful payments can be refunded');
    }

    if (amount > this.amount) {
        throw new Error('Refund amount cannot exceed payment amount');
    }

    const refund = {
        refundId: 'REF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        amount,
        reason,
        status: 'pending'
    };

    this.refunds.push(refund);

    if (this.refundedAmount + amount === this.amount) {
        this.status = 'refunded';
    } else {
        this.status = 'partially_refunded';
    }

    return this.save();
};

// Create models
const CreditLedger = mongoose.model('CreditLedger', creditLedgerSchema);
const CreditLimit = mongoose.model('CreditLimit', creditLimitSchema);
const Payment = mongoose.model('Payment', paymentSchema);

module.exports = {
    CreditLedger,
    CreditLimit,
    Payment
};