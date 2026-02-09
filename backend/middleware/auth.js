const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                error: 'Access denied. No token provided.',
                code: 'NO_TOKEN'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                error: 'Invalid token. User not found.',
                code: 'USER_NOT_FOUND'
            });
        }

        if (!user.isActive) {
            return res.status(401).json({
                error: 'Account is deactivated.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }

        req.user = user;
        req.userId = user._id;
        req.userRole = user.role;
        next();
    } catch (error) {
        logger.error('Auth middleware error:', error);

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Token expired.',
                code: 'TOKEN_EXPIRED'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Invalid token.',
                code: 'INVALID_TOKEN'
            });
        }

        res.status(500).json({
            error: 'Server error during authentication.',
            code: 'AUTH_ERROR'
        });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required.',
                code: 'AUTH_REQUIRED'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Insufficient permissions.',
                code: 'INSUFFICIENT_PERMISSIONS',
                required: roles,
                current: req.user.role
            });
        }

        next();
    };
};

// Admin-only middleware
const adminOnly = authorize('admin', 'super_admin');

// Super admin only middleware
const superAdminOnly = authorize('super_admin');

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id).select('-password');

            if (user && user.isActive) {
                req.user = user;
                req.userId = user._id;
                req.userRole = user.role;
            }
        }
    } catch (error) {
        // Silently fail for optional auth
        logger.warn('Optional auth failed:', error.message);
    }

    next();
};

module.exports = {
    authMiddleware,
    authorize,
    adminOnly,
    superAdminOnly,
    optionalAuth
};