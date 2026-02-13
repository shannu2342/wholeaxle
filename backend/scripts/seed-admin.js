const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

const MONGODB_URI = process.env.MONGODB_URI;

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
    const partitions = value
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
    return partitions.length > 0 ? partitions : DEFAULT_PARTITIONS;
};

const seedAdmin = async () => {
    if (!MONGODB_URI) {
        // eslint-disable-next-line no-console
        console.error('MONGODB_URI not set. Please configure it in backend/.env');
        process.exit(1);
    }

    const adminEmail = String(process.env.ADMIN_SEED_EMAIL || 'admin@wholexale.com').toLowerCase();
    const adminPassword = String(process.env.ADMIN_SEED_PASSWORD || 'Password123');
    const firstName = String(process.env.ADMIN_SEED_FIRST_NAME || 'Admin');
    const lastName = String(process.env.ADMIN_SEED_LAST_NAME || 'Demo');
    const phone = String(process.env.ADMIN_SEED_PHONE || '9000000003');
    const role = String(process.env.ADMIN_SEED_ROLE || 'admin');
    const partitions = parsePartitions(process.env.ADMIN_SEED_PARTITIONS);

    if (!['admin', 'super_admin'].includes(role)) {
        // eslint-disable-next-line no-console
        console.error(`Invalid ADMIN_SEED_ROLE "${role}". Allowed: admin, super_admin`);
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    let user = await User.findOne({ email: adminEmail }).select('+password');
    const payload = {
        email: adminEmail,
        password: adminPassword,
        firstName,
        lastName,
        phone,
        role,
        partitions: role === 'super_admin' ? ['*'] : partitions,
        status: 'active',
        isActive: true,
        isVerified: true,
        emailVerified: true,
    };

    if (!user) {
        user = await User.create(payload);
        // eslint-disable-next-line no-console
        console.log(`Created admin user: ${user.email} (${user.role})`);
    } else {
        user.firstName = payload.firstName;
        user.lastName = payload.lastName;
        user.phone = payload.phone;
        user.role = payload.role;
        user.partitions = payload.partitions;
        user.status = payload.status;
        user.isActive = payload.isActive;
        user.isVerified = payload.isVerified;
        user.emailVerified = payload.emailVerified;
        user.password = payload.password;
        await user.save();
        // eslint-disable-next-line no-console
        console.log(`Updated admin user: ${user.email} (${user.role})`);
    }

    // eslint-disable-next-line no-console
    console.log(`Login email: ${adminEmail}`);
    // eslint-disable-next-line no-console
    console.log(`Login password: ${adminPassword}`);

    await mongoose.disconnect();
};

seedAdmin().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Admin seeding failed:', error);
    process.exit(1);
});
