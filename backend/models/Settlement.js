const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema(
    {
        vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        amount: Number,
        status: { type: String, default: 'pending' },
        scheduledAt: Date,
        completedAt: Date,
        reference: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Settlement', settlementSchema);

