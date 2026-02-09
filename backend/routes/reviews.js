const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

let reviews = [];

const buildSummary = (items) => {
    if (items.length === 0) {
        return {
            totalReviews: 0,
            averageRating: 0,
            ratingDistribution: {},
            verifiedCount: 0,
            totalHelpful: 0,
            responseRate: 0,
        };
    }

    const totalHelpful = items.reduce((sum, item) => sum + (item.helpful || 0), 0);
    const averageRating = items.reduce((sum, item) => sum + (item.rating || 0), 0) / items.length;
    const distribution = items.reduce((acc, item) => {
        const rating = item.rating || 0;
        acc[rating] = (acc[rating] || 0) + 1;
        return acc;
    }, {});

    return {
        totalReviews: items.length,
        averageRating: Number(averageRating.toFixed(2)),
        ratingDistribution: distribution,
        verifiedCount: items.filter((item) => item.verified).length,
        totalHelpful,
        responseRate: items.filter((item) => (item.responses || []).length > 0).length,
    };
};

// @route   GET /api/reviews
// @desc    Get reviews
// @access  Private
router.get('/', authMiddleware, asyncHandler(async (req, res) => {
    const { targetId, type, rating, verified, page = 1, limit = 10 } = req.query;

    let filtered = [...reviews];
    if (targetId) filtered = filtered.filter((r) => r.targetId === targetId);
    if (type) filtered = filtered.filter((r) => r.type === type);
    if (rating) filtered = filtered.filter((r) => r.rating === Number(rating));
    if (verified === 'true') filtered = filtered.filter((r) => r.verified);

    const start = (Number(page) - 1) * Number(limit);
    const pageItems = filtered.slice(start, start + Number(limit));

    res.json({
        reviews: pageItems,
        summary: buildSummary(filtered),
        pagination: {
            page: Number(page),
            limit: Number(limit),
            total: filtered.length,
            hasMore: start + pageItems.length < filtered.length,
        },
    });
}));

// @route   POST /api/reviews
// @desc    Submit review
// @access  Private
router.post('/', authMiddleware, asyncHandler(async (req, res) => {
    const review = {
        id: `review_${Date.now()}`,
        userId: req.userId,
        helpful: 0,
        notHelpful: 0,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        responses: [],
        ...req.body,
    };

    reviews.unshift(review);
    res.status(201).json({ review });
}));

// @route   PATCH /api/reviews/:id/moderate
// @desc    Moderate review
// @access  Private
router.patch('/:id/moderate', authMiddleware, asyncHandler(async (req, res) => {
    const review = reviews.find((r) => r.id === req.params.id);
    if (!review) {
        return res.status(404).json({ error: 'Review not found' });
    }

    review.status = req.body.status || review.status;
    review.moderation = {
        ...review.moderation,
        reviewedBy: req.userId,
        reviewedAt: new Date().toISOString(),
        notes: req.body.notes || '',
    };
    review.updatedAt = new Date().toISOString();

    res.json({ review });
}));

module.exports = router;
