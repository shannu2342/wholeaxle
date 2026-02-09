const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        action: String,
        entity: String,
        entityId: String,
        metadata: Object,
    },
    { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);

