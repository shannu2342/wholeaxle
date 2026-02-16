const express = require('express');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { authMiddleware } = require('../middleware/auth');
const logger = require('../utils/logger');
const { sendEmail } = require('../services/email');
const {
    toSafeUser,
    generateAuthToken,
    generateRefreshToken,
    findUserById,
    findUserByEmail,
    createUser,
    comparePassword,
    isLocked,
    incLoginAttempts,
    resetLoginAttempts,
    updateLastLogin,
    setPasswordReset,
    findByPasswordResetToken,
    setPassword,
    findByEmailVerificationToken,
    verifyEmail,
    updateUserProfile
} = require('../services/authUserService');

const router = express.Router();

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
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const payload = req.body;
    const existingUser = await findUserByEmail(payload.email);
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email', code: 'EMAIL_EXISTS' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const created = await createUser({
        ...payload,
        emailVerificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role: 'user',
        status: 'pending_verification'
    });

    try {
        await sendEmail({
            to: created.email,
            subject: 'Welcome to Wholexale - Verify Your Email',
            template: 'email-verification',
            data: {
                name: `${created.firstName} ${created.lastName}`.trim(),
                verificationUrl: `${process.env.FRONTEND_URL}/verify-email/${emailVerificationToken}`
            }
        });
    } catch (error) {
        logger.error('Failed to send verification email:', error);
    }

    const token = generateAuthToken(created);
    res.status(201).json({
        message: 'User registered successfully',
        token,
        user: toSafeUser(created)
    });
}));

router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { email, password } = req.body;
    const user = await findUserByEmail(email, { includePassword: true });
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    if (isLocked(user)) {
        return res.status(423).json({
            error: 'Account is temporarily locked due to too many failed login attempts',
            code: 'ACCOUNT_LOCKED'
        });
    }

    const valid = await comparePassword(user, password);
    if (!valid) {
        await incLoginAttempts(user);
        return res.status(401).json({ error: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    await resetLoginAttempts(user);
    await updateLastLogin(user);

    const fresh = await findUserById(user.id);
    res.json({
        message: 'Login successful',
        token: generateAuthToken(fresh),
        refreshToken: generateRefreshToken(fresh),
        user: toSafeUser(fresh)
    });
}));

router.post('/refresh', asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token is required', code: 'NO_REFRESH_TOKEN' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        const user = await findUserById(decoded.id);
        if (!user || !user.isActive) return res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
        return res.json({
            token: generateAuthToken(user),
            refreshToken: generateRefreshToken(user)
        });
    } catch {
        return res.status(401).json({ error: 'Invalid refresh token', code: 'INVALID_REFRESH_TOKEN' });
    }
}));

router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
    logger.info(`User logged out: ${req.user.email}`);
    res.json({ message: 'Logged out successfully' });
}));

router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
    const user = await findUserById(req.userId);
    res.json({ user: toSafeUser(user) });
}));

router.post('/forgot-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { email } = req.body;
    const user = await findUserByEmail(email);
    if (!user) return res.json({ message: 'If the email exists, a password reset link has been sent' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    await setPasswordReset(user.id || user._id, resetToken, new Date(Date.now() + 60 * 60 * 1000));

    try {
        await sendEmail({
            to: user.email,
            subject: 'Wholexale - Password Reset Request',
            template: 'password-reset',
            data: { name: `${user.firstName} ${user.lastName}`.trim(), resetUrl: `${process.env.FRONTEND_URL}/reset-password/${resetToken}` }
        });
    } catch (error) {
        logger.error('Failed to send password reset email:', error);
        return res.status(500).json({ error: 'Failed to send password reset email', code: 'EMAIL_SEND_FAILED' });
    }

    return res.json({ message: 'If the email exists, a password reset link has been sent' });
}));

router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    const { token, password } = req.body;
    const user = await findByPasswordResetToken(token);
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token', code: 'INVALID_RESET_TOKEN' });
    await setPassword(user.id || user._id, password);
    return res.json({ message: 'Password reset successfully' });
}));

router.post('/verify-email', [
    body('token').notEmpty().withMessage('Verification token is required')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    const { token } = req.body;
    const user = await findByEmailVerificationToken(token);
    if (!user) return res.status(400).json({ error: 'Invalid or expired verification token', code: 'INVALID_VERIFICATION_TOKEN' });
    await verifyEmail(user.id || user._id);
    return res.json({ message: 'Email verified successfully' });
}));

router.put('/profile', authMiddleware, [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
    body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
    body('phone').optional().isMobilePhone('any').withMessage('Please enter a valid phone number'),
    body('businessName').optional().trim().isLength({ max: 100 }),
    body('gstNumber').optional().isLength({ min: 15, max: 15 }).withMessage('Please enter a valid GST number')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'avatar', 'businessName', 'businessType', 'gstNumber', 'preferences'];
    const updates = {};
    allowedUpdates.forEach((field) => {
        if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await updateUserProfile(req.userId, updates);
    res.json({ message: 'Profile updated successfully', user: toSafeUser(user) });
}));

router.post('/change-password', authMiddleware, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validation failed', details: errors.array() });

    const { currentPassword, newPassword } = req.body;
    const user = await findUserById(req.userId, { includePassword: true });
    const valid = await comparePassword(user, currentPassword);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect', code: 'INVALID_CURRENT_PASSWORD' });
    await setPassword(req.userId, newPassword);
    res.json({ message: 'Password changed successfully' });
}));

module.exports = router;

