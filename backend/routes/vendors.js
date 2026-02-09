const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
let applications = [];

router.get('/applications', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ applications });
}));

router.post('/applications', authMiddleware, asyncHandler(async (req, res) => {
    const app = { id: `vendor_${Date.now()}`, ...req.body, status: 'pending', createdAt: new Date().toISOString() };
    applications.unshift(app);
    res.status(201).json({ application: app });
}));

router.post('/applications/:id/approve', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ id: req.params.id, status: 'approved' });
}));

router.post('/applications/:id/reject', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ id: req.params.id, status: 'rejected' });
}));

module.exports = router;
