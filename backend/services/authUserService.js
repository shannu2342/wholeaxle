const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const User = require('../models/User');
const { getAuthUserModel } = require('../models/AuthUserSql');

const authDbMode = () => (process.env.AUTH_DB || 'mongo').toLowerCase();
const isMysqlAuth = () => authDbMode() === 'mysql';

const normalizeJsonField = (value, fallback = null) => {
    if (value === undefined || value === null || value === '') return fallback;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return fallback;
        }
    }
    return value;
};

const normalizeMysqlUser = (plain) => ({
    ...plain,
    partitions: normalizeJsonField(plain.partitions, []),
    preferences: normalizeJsonField(plain.preferences, null),
    businessAddress: normalizeJsonField(plain.businessAddress, null),
});

const toSafeUser = (user) => ({
    id: String(user.id || user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    phone: user.phone || null,
    avatar: user.avatar || null,
    businessName: user.businessName || null,
    businessType: user.businessType || null,
    role: user.role,
    partitions: Array.isArray(user.partitions) ? user.partitions : [],
    status: user.status,
    isVerified: Boolean(user.isVerified),
    isActive: Boolean(user.isActive),
    lastLogin: user.lastLogin || null,
    preferences: user.preferences || null,
    creditLimit: user.creditLimit || 0,
    availableCredit: user.availableCredit || 0
});

const generateAuthToken = (user) => jwt.sign(
    {
        id: String(user.id || user._id),
        email: user.email,
        role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const generateRefreshToken = (user) => jwt.sign(
    { id: String(user.id || user._id), type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
);

const findUserById = async (id, { includePassword = false } = {}) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const user = await AuthUser.findByPk(id);
        if (!user) return null;
        const plain = normalizeMysqlUser(user.get({ plain: true }));
        if (includePassword) plain.password = plain.passwordHash;
        return plain;
    }

    const query = User.findById(id);
    if (includePassword) query.select('+password');
    return query;
};

const findUserByEmail = async (email, { includePassword = false } = {}) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const user = await AuthUser.findOne({ where: { email: String(email).toLowerCase() } });
        if (!user) return null;
        const plain = normalizeMysqlUser(user.get({ plain: true }));
        if (includePassword) plain.password = plain.passwordHash;
        return plain;
    }

    const query = User.findOne({ email: String(email).toLowerCase() });
    if (includePassword) query.select('+password');
    return query;
};

const createUser = async (payload) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const hashed = await bcrypt.hash(payload.password, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
        const created = await AuthUser.create({
            email: String(payload.email).toLowerCase(),
            passwordHash: hashed,
            firstName: payload.firstName,
            lastName: payload.lastName,
            phone: payload.phone || null,
            businessName: payload.businessName || null,
            businessType: payload.businessType || null,
            gstNumber: payload.gstNumber || null,
            role: payload.role || 'user',
            status: payload.status || 'pending_verification',
            isActive: true,
            isVerified: false,
            emailVerified: false,
            emailVerificationToken: payload.emailVerificationToken || null,
            emailVerificationExpires: payload.emailVerificationExpires || null,
            partitions: payload.partitions || [],
            preferences: payload.preferences || null
        });
        return normalizeMysqlUser(created.get({ plain: true }));
    }

    const user = new User(payload);
    await user.save();
    return user;
};

const comparePassword = async (user, candidatePassword) => {
    if (isMysqlAuth()) return bcrypt.compare(candidatePassword, user.passwordHash || user.password);
    return user.comparePassword(candidatePassword);
};

const isLocked = (user) => Boolean(user.lockUntil && new Date(user.lockUntil).getTime() > Date.now());

const incLoginAttempts = async (user) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const lockExpired = user.lockUntil && new Date(user.lockUntil).getTime() < Date.now();
        const nextAttempts = lockExpired ? 1 : (user.loginAttempts || 0) + 1;
        const updates = {
            loginAttempts: nextAttempts
        };
        if (nextAttempts >= 5) {
            updates.lockUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);
        }
        if (lockExpired) updates.lockUntil = null;
        await AuthUser.update(updates, { where: { id: user.id } });
        return;
    }
    await user.incLoginAttempts();
};

const resetLoginAttempts = async (user) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        await AuthUser.update({ loginAttempts: 0, lockUntil: null }, { where: { id: user.id } });
        return;
    }
    await user.resetLoginAttempts();
};

const updateLastLogin = async (user) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        await AuthUser.update({ lastLogin: new Date() }, { where: { id: user.id } });
        return;
    }
    await user.updateLastLogin();
};

const setPasswordReset = async (userId, token, expiresAt) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        await AuthUser.update(
            { passwordResetToken: token, passwordResetExpires: expiresAt },
            { where: { id: userId } }
        );
        return;
    }
    const user = await User.findById(userId);
    user.passwordResetToken = token;
    user.passwordResetExpires = expiresAt;
    await user.save();
};

const findByPasswordResetToken = async (token) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const user = await AuthUser.findOne({
            where: {
                passwordResetToken: token,
                passwordResetExpires: { [Op.gt]: new Date() }
            }
        });
        return user ? normalizeMysqlUser(user.get({ plain: true })) : null;
    }
    return User.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: Date.now() }
    });
};

const setPassword = async (userId, newPassword) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const hashed = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_ROUNDS || '12', 10));
        await AuthUser.update(
            { passwordHash: hashed, passwordResetToken: null, passwordResetExpires: null },
            { where: { id: userId } }
        );
        return;
    }
    const user = await User.findById(userId);
    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
};

const findByEmailVerificationToken = async (token) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        const user = await AuthUser.findOne({
            where: {
                emailVerificationToken: token,
                emailVerificationExpires: { [Op.gt]: new Date() }
            }
        });
        return user ? normalizeMysqlUser(user.get({ plain: true })) : null;
    }
    return User.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: Date.now() }
    });
};

const verifyEmail = async (userId) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        await AuthUser.update({
            emailVerified: true,
            isVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null,
            status: 'active'
        }, { where: { id: userId } });
        return;
    }
    const user = await User.findById(userId);
    user.emailVerified = true;
    user.isVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    user.status = 'active';
    await user.save();
};

const updateUserProfile = async (userId, updates) => {
    if (isMysqlAuth()) {
        const AuthUser = getAuthUserModel();
        await AuthUser.update(updates, { where: { id: userId } });
        const user = await AuthUser.findByPk(userId);
        return normalizeMysqlUser(user.get({ plain: true }));
    }

    return User.findByIdAndUpdate(userId, updates, { new: true, runValidators: true });
};

module.exports = {
    authDbMode,
    isMysqlAuth,
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
};
