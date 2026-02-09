const mongoose = require('mongoose');

const brandRequestSchema = new mongoose.Schema(
    {
        sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
            index: true,
        },
        brandName: { type: String, default: '', trim: true },
        businessName: { type: String, default: '', trim: true },
        payload: { type: Object, default: {} },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        reviewedAt: { type: Date, default: null },
        comments: { type: String, default: '', trim: true },
    },
    { timestamps: true }
);

brandRequestSchema.index({ createdAt: -1 });

module.exports = mongoose.model('BrandRequest', brandRequestSchema);

