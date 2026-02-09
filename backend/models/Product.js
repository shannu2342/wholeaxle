const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        description: { type: String, default: '' },
        price: { type: Number, required: true },
        originalPrice: { type: Number },
        category: { type: String, index: true },
        subcategory: { type: String, index: true },
        images: [{ type: String }],
        stock: { type: Number, default: 0 },
        moq: { type: Number, default: 1 },
        sizes: [{ type: String }],
        colors: [{ type: String }],
        vendor: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: { type: String },
            rating: { type: Number, default: 0 },
        },
        location: {
            state: String,
            city: String,
            serviceableAreas: [String],
        },
        tags: [String],
        isAffiliatedOnly: { type: Boolean, default: false },
        barcode: { type: String },
        complianceStatus: { type: String, default: 'pending' },
        aiGeneratedImages: [String],
        views: { type: Number, default: 0 },
        clicks: { type: Number, default: 0 },
        conversions: { type: Number, default: 0 },
        rating: { type: Number, default: 0 },
        reviewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);

