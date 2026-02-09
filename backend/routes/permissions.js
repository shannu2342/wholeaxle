const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

let roles = [
    { id: 'admin', name: 'Admin', permissions: ['*'] },
    { id: 'seller', name: 'Seller', permissions: ['products:create', 'orders:view'] },
    { id: 'buyer', name: 'Buyer', permissions: ['orders:create'] },
];
let auditLogs = [];
let assignments = [];

router.get('/roles', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ roles });
}));

router.post('/roles', authMiddleware, asyncHandler(async (req, res) => {
    const role = { id: `role_${Date.now()}`, ...req.body };
    roles.push(role);
    res.status(201).json({ role });
}));

router.post('/assign', authMiddleware, asyncHandler(async (req, res) => {
    const assignment = {
        id: `role_assign_${Date.now()}`,
        userId: req.body.userId,
        role: req.body.role,
        permissions: req.body.permissions || [],
        assignedBy: req.userId,
        assignedAt: new Date().toISOString(),
        isActive: true,
    };
    assignments.push(assignment);
    const log = {
        id: `audit_${Date.now()}`,
        action: 'role_assigned',
        userId: req.userId,
        targetUserId: req.body.userId,
        details: { role: req.body.role },
        timestamp: new Date().toISOString(),
    };
    auditLogs.unshift(log);
    res.json({ assignment, auditLog: log });
}));

router.post('/revoke', authMiddleware, asyncHandler(async (req, res) => {
    const log = {
        id: `audit_${Date.now()}`,
        action: 'role_revoked',
        userId: req.userId,
        targetUserId: req.body.userId,
        details: { roleId: req.body.roleId },
        timestamp: new Date().toISOString(),
    };
    auditLogs.unshift(log);
    res.json({ userId: req.body.userId, roleId: req.body.roleId, auditLog: log });
}));

router.post('/check', authMiddleware, asyncHandler(async (req, res) => {
    res.json({
        id: `check_${Date.now()}`,
        userId: req.body.userId,
        permission: req.body.permission,
        resourceId: req.body.resourceId,
        hasPermission: true,
        result: 'granted',
        timestamp: new Date().toISOString(),
    });
}));

router.get('/audit', authMiddleware, asyncHandler(async (req, res) => {
    res.json({ logs: auditLogs.slice(0, 100) });
}));

module.exports = router;
