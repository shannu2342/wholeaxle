const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { requirePartition } = require('../middleware/rbac');
const AuditLog = require('../models/AuditLog');
const BrandRequest = require('../models/BrandRequest');

const router = express.Router();

const recordAudit = async ({ userId, action, entity, entityId, metadata }) => {
    await AuditLog.create({
        userId,
        action,
        entity,
        entityId: entityId ? String(entityId) : undefined,
        metadata: metadata || null,
    });
};

// @route   GET /api/brand/requests
// @desc    List brand requests (admins: all, sellers: own)
// @access  Private
router.get('/requests', authMiddleware, asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status) query.status = status;

    // Admins can see all, non-admins can see only their requests.
    if (req.userRole !== 'admin' && req.userRole !== 'super_admin') {
        query.sellerId = req.userId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [total, requests] = await Promise.all([
        BrandRequest.countDocuments(query),
        BrandRequest.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    ]);

    res.json({
        requests: requests.map((r) => ({
            id: String(r._id),
            status: r.status,
            brandName: r.brandName,
            businessName: r.businessName,
            sellerId: String(r.sellerId),
            payload: r.payload || {},
            comments: r.comments || '',
            reviewedBy: r.reviewedBy ? String(r.reviewedBy) : null,
            reviewedAt: r.reviewedAt ? new Date(r.reviewedAt).toISOString() : null,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        })),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            hasMore: skip + requests.length < total,
        },
    });
}));

// @route   POST /api/brand/requests
// @desc    Create a brand authorization request (seller)
// @access  Private
router.post('/requests', authMiddleware, asyncHandler(async (req, res) => {
    const payload = req.body || {};
    const brandName = String(payload.brandName || payload.brand || payload.name || '').trim();
    const businessName = String(payload.businessName || payload.companyName || payload.sellerBusinessName || '').trim();

    const request = await BrandRequest.create({
        sellerId: req.userId,
        status: 'pending',
        brandName,
        businessName,
        payload,
    });

    await recordAudit({
        userId: req.userId,
        action: 'brand_request.create',
        entity: 'brand_request',
        entityId: request._id,
        metadata: { brandName, businessName },
    });

    res.status(201).json({
        request: {
            id: String(request._id),
            status: request.status,
            brandName: request.brandName,
            businessName: request.businessName,
            sellerId: String(request.sellerId),
            payload: request.payload || {},
            createdAt: request.createdAt ? new Date(request.createdAt).toISOString() : null,
        },
    });
}));

// @route   POST /api/brand/requests/:id/approve
// @access  Private (admin/super_admin + brands)
router.post('/requests/:id/approve', authMiddleware, adminOnly, requirePartition('brands'), asyncHandler(async (req, res) => {
    const comments = String(req.body?.comments || '').trim();
    const updated = await BrandRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'approved', reviewedBy: req.userId, reviewedAt: new Date(), comments },
        { new: true }
    ).lean();

    await recordAudit({
        userId: req.userId,
        action: 'brand_request.approve',
        entity: 'brand_request',
        entityId: req.params.id,
        metadata: { comments },
    });

    res.json({ id: req.params.id, status: updated?.status || 'approved' });
}));

// @route   POST /api/brand/requests/:id/reject
// @access  Private (admin/super_admin + brands)
router.post('/requests/:id/reject', authMiddleware, adminOnly, requirePartition('brands'), asyncHandler(async (req, res) => {
    const comments = String(req.body?.comments || '').trim();
    const updated = await BrandRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected', reviewedBy: req.userId, reviewedAt: new Date(), comments },
        { new: true }
    ).lean();

    await recordAudit({
        userId: req.userId,
        action: 'brand_request.reject',
        entity: 'brand_request',
        entityId: req.params.id,
        metadata: { comments },
    });

    res.json({ id: req.params.id, status: updated?.status || 'rejected' });
}));

// @route   POST /api/brand/detect
// @desc    Stub for AI brand detection
// @access  Private
router.post('/detect', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ brandName: 'Unknown', confidence: 0.0, logo: null });
}));

module.exports = router;

