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

    const payload = {
        email: cfg.email,
        password: cfg.password,
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
        await User.create(payload);
        console.log(`Created mongo admin user: ${cfg.email} (${cfg.role})`);
    } else {
        Object.assign(existing, payload);
        await existing.save();
        console.log(`Updated mongo admin user: ${cfg.email} (${cfg.role})`);
    }

    await mongoose.disconnect();
};

const seedMySQLAdmin = async (cfg) => {
    await initializeMySQL();
    const AuthUser = getAuthUserModel();
    const rounds = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);
    const passwordHash = await bcrypt.hash(cfg.password, rounds);

    const payload = {
        email: cfg.email,
        passwordHash,
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
        await AuthUser.create(payload);
        console.log(`Created mysql admin user: ${cfg.email} (${cfg.role})`);
    } else {
        await existing.update(payload);
        console.log(`Updated mysql admin user: ${cfg.email} (${cfg.role})`);
    }

    await getMySQLSequelize().close();
};

const run = async () => {
    const mode = String(process.env.AUTH_DB || 'mongo').toLowerCase();
    const cfg = seedConfig();

    if (mode === 'mysql') {
        await seedMySQLAdmin(cfg);
    } else {
        await seedMongoAdmin(cfg);
    }

    console.log(`Login email: ${cfg.email}`);
    console.log(`Login password: ${cfg.password}`);
};

run().catch((error) => {
    console.error('Admin seed failed:', error.message);
    process.exit(1);
});

