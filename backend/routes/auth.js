const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email');
const { sendSMS } = require('../services/sms');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required'),
    body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
    body('businessName').optional().trim().isLength({ max: 100 }),
    body('businessType').optional().isIn(['manufacturer', 'wholesaler', 'distributor', 'retailer', 'service_provider']),
    body('gstNumber').optional().isLength({ min: 15, max: 15 }).withMessage('Please enter a valid GST number')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const {
        email,
        password,
        firstName,
        lastName,
        phone,
        businessName,
        businessType,
        gstNumber,
        businessAddress
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            error: 'User already exists with this email',
            code: 'EMAIL_EXISTS'
        });
    }

    // Create user
    const user = new User({
        email,
        password,
        firstName,
        lastName,
        phone,
        businessName,
        businessType,
        gstNumber,
        businessAddress,
        role: 'user',
        status: 'pending_verification'
    });

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    user.emailVerificationToken = emailVerificationToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    await user.save();

    // Send verification email
    try {
        await sendEmail({
            to: user.email,
            subject: 'Welcome to Wholexale - Verify Your Email',
            template: 'email-verification',
            data: {
                name: user.fullName,
                verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`
            }
        });
    } catch (error) {
        logger.error('Failed to send verification email:', error);
    }

    // Generate JWT token
    const token = user.generateAuthToken();

    logger.info(`New user registered: ${user.email}`);

    res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            status: user.status,
            isVerified: user.isVerified
        }
    });
}));

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
        return res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
        });
    }

    // Check if account is locked
    if (user.isLocked) {
        return res.status(423).json({
            error: 'Account is temporarily locked due to too many failed login attempts',
            code: 'ACCOUNT_LOCKED'
        });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
        await user.incLoginAttempts();
        return res.status(401).json({
            error: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
        });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();

    // Update last login
    await user.updateLastLogin();

    // Generate tokens
    const token = user.generateAuthToken();
    const refreshToken = user.generateRefreshToken();

    logger.info(`User logged in: ${user.email}`);

    res.json({
        message: 'Login successful',
        token,
        refreshToken,
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            role: user.role,
            partitions: user.partitions || [],
            status: user.status,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin
        }
    });
}));

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(401).json({
            error: 'Refresh token is required',
            code: 'NO_REFRESH_TOKEN'
        });
    }

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                error: 'Invalid refresh token',
                code: 'INVALID_REFRESH_TOKEN'
            });
        }

        // Generate new tokens
        const newToken = user.generateAuthToken();
        const newRefreshToken = user.generateRefreshToken();

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        return res.status(401).json({
            error: 'Invalid refresh token',
            code: 'INVALID_REFRESH_TOKEN'
        });
    }
}));

// @route   POST /api/auth/logout
// @desc    Logout user (invalidate token)
// @access  Private
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
    // In a production app, you might want to blacklist the token
    // For now, we'll just log the logout
    logger.info(`User logged out: ${req.user.email}`);

    res.json({
        message: 'Logged out successfully'
    });
}));

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);

    res.json({
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phone: user.phone,
            avatar: user.avatar,
            businessName: user.businessName,
            businessType: user.businessType,
            partitions: user.partitions || [],
            role: user.role,
            status: user.status,
            isVerified: user.isVerified,
            lastLogin: user.lastLogin,
            preferences: user.preferences,
            creditLimit: user.creditLimit,
            availableCredit: user.availableCredit
        }
    });
}));

// @route   POST /api/auth/forgot-password
// @desc    Send password reset email
// @access  Public
router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Don't reveal if user exists or not
        return res.json({
            message: 'If the email exists, a password reset link has been sent'
        });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    try {
        await sendEmail({
            to: user.email,
            subject: 'Wholexale - Password Reset Request',
            template: 'password-reset',
            data: {
                name: user.fullName,
                resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}`
            }
        });
    } catch (error) {
        logger.error('Failed to send password reset email:', error);
        return res.status(500).json({
            error: 'Failed to send password reset email',
            code: 'EMAIL_SEND_FAILED'
        });
    }

    res.json({
        message: 'If the email exists, a password reset link has been sent'
    });
}));

// @route   POST /api/auth/reset-password
// @desc    Reset password with token
// @access  Public
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { token, password } = req.body;

    const user = await User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            error: 'Invalid or expired reset token',
            code: 'INVALID_RESET_TOKEN'
        });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    logger.info(`Password reset for user: ${user.email}`);

    res.json({
        message: 'Password reset successfully'
    });
}));

// @route   POST /api/auth/verify-email
// @desc    Verify email with token
// @access  Public
router.post('/verify-email', [
    body('token').notEmpty().withMessage('Verification token is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { token } = req.body;

    const user = await User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
        return res.status(400).json({
            error: 'Invalid or expired verification token',
            code: 'INVALID_VERIFICATION_TOKEN'
        });
    }

    // Mark email as verified
    user.emailVerified = true;
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.status = 'active';
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
        message: 'Email verified successfully'
    });
}));

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authMiddleware, [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
    body('businessName').optional().trim().isLength({ max: 100 }),
    body('gstNumber').optional().isLength({ min: 15, max: 15 }).withMessage('Please enter a valid GST number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const updates = {};
    const allowedUpdates = [
        'firstName', 'lastName', 'phone', 'avatar', 'businessName',
        'businessType', 'gstNumber', 'businessAddress', 'preferences'
    ];

    // Only allow updates to specified fields
    allowedUpdates.forEach(field => {
        if (req.body[field] !== undefined) {
            updates[field] = req.body[field];
        }
    });

    const user = await User.findByIdAndUpdate(
        req.userId,
        updates,
        { new: true, runValidators: true }
    );

    logger.info(`Profile updated for user: ${user.email}`);

    res.json({
        message: 'Profile updated successfully',
        user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            fullName: user.fullName,
            phone: user.phone,
            avatar: user.avatar,
            businessName: user.businessName,
            businessType: user.businessType,
            preferences: user.preferences
        }
    });
}));

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', authMiddleware, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
        return res.status(400).json({
            error: 'Current password is incorrect',
            code: 'INVALID_CURRENT_PASSWORD'
        });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    logger.info(`Password changed for user: ${user.email}`);

    res.json({
        message: 'Password changed successfully'
    });
}));

module.exports = router;
