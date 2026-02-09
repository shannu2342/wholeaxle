const mongoose = require('mongoose');

const returnSchema = new mongoose.Schema(
    {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        items: [
            {
                productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
                name: String,
                quantity: Number,
                price: Number,
            },
        ],
        reason: String,
        description: String,
        primaryReason: String,
        detailedReason: String,
        images: [String],
        status: { type: String, default: 'initiated' },
        priority: { type: String, default: 'normal' },
        requestedAt: Date,
        estimatedProcessingTime: String,
        refundDetails: {
            method: String,
            walletCredit: Boolean,
            amount: Number,
        },
        pickupDetails: {
            required: Boolean,
            preferredDate: String,
            preferredTime: String,
            address: String,
            scheduledDate: String,
            scheduledTime: String,
            contactPerson: String,
            contactPhone: String,
            courierPartner: String,
            trackingNumber: String,
            status: String,
            instructions: String,
        },
        qualityCheck: {
            checkedBy: String,
            checkedAt: Date,
            condition: String,
            notes: String,
            images: [String],
            refundEligibility: String,
            refundPercentage: Number,
            adminDecision: String,
        },
        refund: {
            amount: Number,
            method: String,
            status: String,
            processingFee: Number,
            taxDeducted: Number,
            netAmount: Number,
            initiatedAt: Date,
            estimatedCompletion: Date,
            reference: String,
            transactionId: String,
        },
        timeline: [
            {
                status: String,
                timestamp: Date,
                description: String,
            },
        ],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Return', returnSchema);
