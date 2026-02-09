const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
    {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String,
        quantity: { type: Number, default: 1 },
        price: { type: Number, default: 0 },
        total: { type: Number, default: 0 },
        vendor: String,
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        orderNumber: { type: String, required: true, unique: true },
        customer: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            name: String,
            phone: String,
            address: String,
        },
        items: [orderItemSchema],
        totalAmount: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        finalAmount: { type: Number, default: 0 },
        status: { type: String, default: 'confirmed' },
        paymentStatus: { type: String, default: 'pending' },
        paymentMethod: { type: String, default: 'cod' },
        shipping: {
            address: String,
            estimatedDelivery: Date,
            trackingNumber: String,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

