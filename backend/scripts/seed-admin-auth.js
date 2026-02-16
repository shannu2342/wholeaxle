require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const { initializeMySQL, getMySQLSequelize } = require('../config/mysql');
const { getAuthUserModel } = require('../models/AuthUserSql');

const DEFAULT_PARTITIONS = [
    'overview',
    'admins',
    'users',
    'brands',
    'products',
    'orders',
    'analytics',
    'settings',
];

const parsePartitions = (value) => {
    if (!value || typeof value !== 'string') return DEFAULT_PARTITIONS;
    const partitions = value.split(',').map((p) => p.trim()).filter(Boolean);
    return partitions.length > 0 ? partitions : DEFAULT_PARTITIONS;
};

const parseBoolean = (value, defaultValue = false) => {
    if (value === undefined || value === null || value === '') return defaultValue;
    const normalized = String(value).trim().toLowerCase();
    return ['1', 'true', 'yes', 'y', 'on'].includes(normalized);
};

const seedConfig = () => {
    const role = String(process.env.ADMIN_SEED_ROLE || 'admin').toLowerCase();
    if (!['admin', 'super_admin'].includes(role)) {
        throw new Error(`Invalid ADMIN_SEED_ROLE "${role}". Allowed: admin, super_admin`);
    }

    return {
        email: String(process.env.ADMIN_SEED_EMAIL || 'admin@wholexale.com').toLowerCase(),
        password: String(process.env.ADMIN_SEED_PASSWORD || 'Password123'),
        firstName: String(process.env.ADMIN_SEED_FIRST_NAME || 'Admin'),
        lastName: String(process.env.ADMIN_SEED_LAST_NAME || 'Demo'),
        phone: String(process.env.ADMIN_SEED_PHONE || '9000000003'),
        role,
        partitions: role === 'super_admin' ? ['*'] : parsePartitions(process.env.ADMIN_SEED_PARTITIONS),
        resetPassword: parseBoolean(process.env.ADMIN_SEED_RESET_PASSWORD, false),
    };
};

const seedMongoAdmin = async (cfg) => {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI not set. Required for mongo auth seeding.');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    const basePayload = {
        email: cfg.email,
        firstName: cfg.firstName,
        lastName: cfg.lastName,
        phone: cfg.phone,
        role: cfg.role,
        partitions: cfg.partitions,
        status: 'active',
        isActive: true,
        isVerified: true,
        emailVerified: true,
    };

    const existing = await User.findOne({ email: cfg.email }).select('+password');
    if (!existing) {
        await User.create({
            ...basePayload,
            password: cfg.password,
        });
        console.log(`Created mongo admin user: ${cfg.email} (${cfg.role})`);
        await mongoose.disconnect();
        return { created: true, passwordReset: true };
    } else {
        const updatePayload = { ...basePayload };
        if (cfg.resetPassword) {
            updatePayload.password = cfg.password;
        }

        Object.assign(existing, updatePayload);
        await existing.save();
        if (cfg.resetPassword) {
            console.log(`Updated mongo admin user: ${cfg.email} (${cfg.role}) with password reset`);
        } else {
            console.log(`Updated mongo admin user profile: ${cfg.email} (${cfg.role}); password unchanged`);
        }
    }

    await mongoose.disconnect();
    return { created: false, passwordReset: cfg.resetPassword };
};

const seedMySQLAdmin = async (cfg) => {
    await initializeMySQL();
    const AuthUser = getAuthUserModel();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(cfg.password, rounds);

    const payload = {
        email: cfg.email,
        firstName: cfg.firstName,
        lastName: cfg.lastName,
        phone: cfg.phone,
        role: cfg.role,
        partitions: cfg.partitions,
        status: 'active',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        loginAttempts: 0,
        lockUntil: null,
    };

    const existing = await AuthUser.findOne({ where: { email: cfg.email } });
    if (!existing) {
        await AuthUser.create({
            ...payload,
            passwordHash,
        });
        console.log(`Created mysql admin user: ${cfg.email} (${cfg.role})`);
        await getMySQLSequelize().close();
        return { created: true, passwordReset: true };
    } else {
        const updatePayload = {
            ...payload,
            ...(cfg.resetPassword ? { passwordHash } : {}),
        };
        await existing.update(updatePayload);
        if (cfg.resetPassword) {
            console.log(`Updated mysql admin user: ${cfg.email} (${cfg.role}) with password reset`);
        } else {
            console.log(`Updated mysql admin user profile: ${cfg.email} (${cfg.role}); password unchanged`);
        }
    }

    await getMySQLSequelize().close();
    return { created: false, passwordReset: cfg.resetPassword };
};

const run = async () => {
    const mode = String(process.env.AUTH_DB || 'mongo').toLowerCase();
    const cfg = seedConfig();

    const result = mode === 'mysql'
        ? await seedMySQLAdmin(cfg)
        : await seedMongoAdmin(cfg);

    console.log(`Login email: ${cfg.email}`);
    if (result.created || result.passwordReset) {
        console.log(`Login password: ${cfg.password}`);
    } else {
        console.log('Login password: unchanged (set ADMIN_SEED_RESET_PASSWORD=true to rotate)');
    }
};

run().catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
});
