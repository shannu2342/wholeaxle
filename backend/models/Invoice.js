const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema(
    {
        invoiceNumber: { type: String, required: true, unique: true },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        customer: {
            name: String,
            email: String,
            address: String,
        },
        items: [{ name: String, quantity: Number, price: Number }],
        subtotal: Number,
        taxDetails: {
            cgst: Number,
            sgst: Number,
            igst: Number,
            totalTax: Number,
        },
        discount: Number,
        totalAmount: Number,
        currency: { type: String, default: 'INR' },
        status: { type: String, default: 'generated' },
        generatedAt: Date,
        dueDate: Date,
        paymentTerms: String,
        notes: String,
        attachments: [String],
    },
    { timestamps: true }
);

module.exports = mongoose.model('Invoice', invoiceSchema);

