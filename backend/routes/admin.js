const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { adminOnly, superAdminOnly } = require('../middleware/auth');
const { requirePartition } = require('../middleware/rbac');
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const BrandRequest = require('../models/BrandRequest');

const router = express.Router();

const ADMIN_PARTITIONS = [
    { id: 'overview', label: 'Overview' },
    { id: 'admins', label: 'Admin Management' },
    { id: 'users', label: 'User Management' },
    { id: 'brands', label: 'Brand Authorizations' },
    { id: 'products', label: 'Products' },
    { id: 'orders', label: 'Orders' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
];

const mapAdminStatus = (user) => {
    // admin-web expects: verified | disabled
    return user?.isActive ? 'verified' : 'disabled';
};

const recordAudit = async ({ userId, action, entity, entityId, metadata }) => {
    await AuditLog.create({
        userId,
        action,
        entity,
        entityId: entityId ? String(entityId) : undefined,
        metadata: metadata || null,
    });
};

// @route   GET /api/admin/partitions
// @access  Private (admin/super_admin)
router.get('/partitions', adminOnly, asyncHandler(async (req, res) => {
    res.json({ partitions: ADMIN_PARTITIONS });
}));

// @route   GET /api/admin/dashboard
// @access  Private (admin/super_admin + overview)
router.get('/dashboard', adminOnly, requirePartition('overview'), asyncHandler(async (req, res) => {
    const lowStockThreshold = Number(req.query?.lowStockThreshold || 10);
    const [usersTotal, productsTotal, ordersTotal, brandPending, brandApproved, lowStockCount] = await Promise.all([
        User.countDocuments({}),
        Product.countDocuments({}),
        Order.countDocuments({}),
        BrandRequest.countDocuments({ status: 'pending' }),
        BrandRequest.countDocuments({ status: 'approved' }),
        Product.countDocuments({ stock: { $lte: lowStockThreshold } }),
    ]);

    const [stockValueAgg, lastOrders, brandRequests, lowStockItems, auditLogs] = await Promise.all([
        Product.aggregate([
            { $project: { stockValue: { $multiply: ['$price', '$stock'] } } },
            { $group: { _id: null, total: { $sum: '$stockValue' } } },
        ]),
        Order.find({}).sort({ createdAt: -1 }).limit(50).lean(),
        BrandRequest.find({}).sort({ createdAt: -1 }).limit(5).lean(),
        Product.find({ stock: { $lte: lowStockThreshold } }).sort({ stock: 1 }).limit(5).lean(),
        AuditLog.find({}).sort({ createdAt: -1 }).limit(6).populate('userId', 'email role').lean(),
    ]);

    const totalStockValue = Number(stockValueAgg?.[0]?.total || 0);
    const orderItemCount = lastOrders.reduce((sum, o) => {
        const items = Array.isArray(o.items) ? o.items : [];
        return sum + items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
    }, 0);
    const stockTurnoverRate = productsTotal > 0 ? Number((orderItemCount / productsTotal).toFixed(2)) : 0;

    const brandStatusCounts = brandRequests.reduce((acc, r) => {
        const status = r.status || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {});

    const formatActivity = (log) => {
        const action = log?.action || 'activity';
        const entity = log?.entity || 'system';
        let type = 'activity';
        if (action.includes('brand')) type = 'brand';
        if (action.includes('inventory') || action.includes('product')) type = 'inventory';
        if (action.includes('approve') || action.includes('reject')) type = 'approval';
        if (action.includes('bulk')) type = 'upload';
        return {
            id: String(log._id),
            type,
            message: `${action.replace(/\./g, ' ')} (${entity})`,
            time: log.createdAt ? new Date(log.createdAt).toLocaleString() : '',
        };
    };

    const dashboard = {
        stats: {
            totalUsers: usersTotal,
            totalProducts: productsTotal,
            pendingAuthorizations: brandPending,
            lowStockItems: lowStockCount,
            totalBrands: brandApproved,
            totalStockValue,
            stockTurnoverRate,
        },
        recentActivity: auditLogs.map(formatActivity),
        brandApplications: brandRequests.map((r) => ({
            id: String(r._id),
            brandName: r.brandName || 'Unknown',
            status: r.status === 'pending' ? 'pending_review' : r.status,
            submittedAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        })),
        inventoryAlerts: lowStockItems.map((p) => ({
            id: String(p._id),
            sku: p.barcode || String(p._id).slice(-6),
            message: `Low stock: ${p.name}`,
            severity: Number(p.stock) <= Math.max(1, lowStockThreshold / 2) ? 'high' : 'medium',
        })),
        charts: {
            brandRequests: [
                { name: 'Pending', value: brandStatusCounts.pending || 0 },
                { name: 'Approved', value: brandStatusCounts.approved || 0 },
                { name: 'Rejected', value: brandStatusCounts.rejected || 0 },
            ],
        },
    };

    res.json({ dashboard });
}));

// @route   GET /api/admin/audit
// @access  Private (admin/super_admin + overview)
router.get('/audit', adminOnly, requirePartition('overview'), asyncHandler(async (req, res) => {
    const logs = await AuditLog.find({})
        .sort({ createdAt: -1 })
        .limit(200)
        .populate('userId', 'email role')
        .lean();

    const events = logs.map((l) => ({
        id: String(l._id),
        at: l.createdAt ? new Date(l.createdAt).toISOString() : null,
        actor: l.userId
            ? { id: String(l.userId._id), email: l.userId.email, role: l.userId.role }
            : null,
        action: l.action || 'unknown',
        target: l.entity ? { type: l.entity, id: l.entityId ? String(l.entityId) : '' } : null,
        meta: l.metadata || null,
    }));

    res.json({ events });
}));

// @route   GET /api/admin/users
// @access  Private (admin/super_admin + users)
router.get('/users', adminOnly, requirePartition('users'), asyncHandler(async (req, res) => {
    const { role } = req.query;
    const query = {};
    if (role) query.role = role;

    const users = await User.find(query).sort({ createdAt: -1 }).limit(500).lean();
    res.json({
        users: users.map((u) => ({
            id: String(u._id),
            email: u.email,
            role: u.role,
            status: u.status,
            firstName: u.firstName,
            lastName: u.lastName,
            partitions: u.partitions || [],
            isActive: u.isActive,
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : null,
        })),
    });
}));

// @route   PUT /api/admin/users/:id/role
// @access  Private (admin/super_admin + users)
router.put('/users/:id/role', adminOnly, requirePartition('users'), asyncHandler(async (req, res) => {
    const { role } = req.body || {};
    const allowed = ['user', 'vendor', 'admin', 'super_admin'];
    if (!allowed.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }

    const updated = await User.findByIdAndUpdate(
        req.params.id,
        { role },
        { new: true }
    ).lean();

    await recordAudit({
        userId: req.userId,
        action: 'user.role.update',
        entity: 'user',
        entityId: req.params.id,
        metadata: { role },
    });

    res.json({
        user: updated
            ? {
                id: String(updated._id),
                email: updated.email,
                role: updated.role,
                partitions: updated.partitions || [],
                status: updated.status,
                isActive: updated.isActive,
            }
            : null,
    });
}));

// @route   GET /api/admin/orders
// @access  Private (admin/super_admin + orders)
router.get('/orders', adminOnly, requirePartition('orders'), asyncHandler(async (req, res) => {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query).sort({ createdAt: -1 }).limit(500).lean();

    const byStatus = {};
    let totalValue = 0;
    orders.forEach((o) => {
        const s = o.status || 'unknown';
        byStatus[s] = (byStatus[s] || 0) + 1;
        const total = Number(o.finalAmount || o.totalAmount || 0);
        totalValue += total;
    });

    res.json({
        orders: orders.map((o) => ({
            id: String(o._id),
            number: o.orderNumber,
            status: o.status,
            createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
            buyerId: o.customer?.id ? String(o.customer.id) : null,
            sellerId: o.items?.[0]?.vendor || null,
            total: Number(o.finalAmount || o.totalAmount || 0),
            itemCount: Array.isArray(o.items) ? o.items.reduce((sum, it) => sum + (Number(it.quantity) || 0), 0) : 0,
        })),
        summary: {
            totalOrders: orders.length,
            totalValue,
            byStatus,
        },
    });
}));

// @route   POST /api/admin/orders/:id/status
// @access  Private (admin/super_admin + orders)
router.post('/orders/:id/status', adminOnly, requirePartition('orders'), asyncHandler(async (req, res) => {
    const { status } = req.body || {};
    if (!status || typeof status !== 'string') {
        return res.status(400).json({ error: 'Status is required' });
    }

    const updated = await Order.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
    ).lean();

    await recordAudit({
        userId: req.userId,
        action: 'order.status.update',
        entity: 'order',
        entityId: req.params.id,
        metadata: { status },
    });

    res.json({ order: updated ? { id: String(updated._id), status: updated.status } : null });
}));

// @route   GET /api/admin/inventory
// @access  Private (admin/super_admin + products)
router.get('/inventory', adminOnly, requirePartition('products'), asyncHandler(async (req, res) => {
    const products = await Product.find({}).sort({ createdAt: -1 }).limit(1000).lean();
    res.json({
        products: products.map((p) => {
            const price = Number(p.price || 0);
            const original = Number(p.originalPrice || 0);
            const margin =
                original > 0 && price >= 0 && original > price
                    ? `${Math.round(((original - price) / original) * 100)}%`
                    : null;
            return {
                id: String(p._id),
                name: p.name,
                price,
                category: p.category || null,
                brand: p.vendor?.name || null,
                margin,
                moq: typeof p.moq === 'number' ? p.moq : null,
            };
        }),
    });
}));

// @route   GET /api/admin/inventory/alerts
// @access  Private (admin/super_admin + products)
router.get('/inventory/alerts', adminOnly, requirePartition('products'), asyncHandler(async (req, res) => {
    const threshold = Number(req.query.threshold || 10);
    const items = await Product.find({ stock: { $lte: threshold } })
        .sort({ stock: 1 })
        .limit(200)
        .lean();
    res.json({
        alerts: items.map((p) => ({
            id: String(p._id),
            name: p.name,
            stock: p.stock,
            threshold,
            category: p.category || null,
        })),
    });
}));

// @route   POST /api/admin/bulk/barcodes
// @access  Private (admin/super_admin + products)
router.post('/bulk/barcodes', adminOnly, requirePartition('products'), asyncHandler(async (req, res) => {
    const count = Math.max(1, Math.min(5000, Number(req.body?.count || 0)));
    if (!Number.isFinite(count) || count <= 0) {
        return res.status(400).json({ error: 'Invalid count' });
    }

    const barcodes = Array.from({ length: count }).map((_, i) => {
        // Keep deterministic-ish and easy to read, but unique enough for demos.
        return `WHX-${Date.now()}-${i + 1}`;
    });

    await recordAudit({
        userId: req.userId,
        action: 'bulk.barcodes.generate',
        entity: 'barcode',
        entityId: null,
        metadata: { count },
    });

    res.json({ barcodes });
}));

// @route   POST /api/admin/bulk/products
// @access  Private (admin/super_admin + products)
router.post('/bulk/products', adminOnly, requirePartition('products'), asyncHandler(async (req, res) => {
    const products = Array.isArray(req.body?.products) ? req.body.products : [];
    if (!products.length) {
        return res.status(400).json({ error: 'No products provided' });
    }

    const docs = products.map((p) => ({
        ...p,
        vendor: {
            id: req.userId,
            name: req.user?.fullName || req.user?.email,
        },
    }));

    const created = await Product.insertMany(docs, { ordered: false });

    await recordAudit({
        userId: req.userId,
        action: 'bulk.products.create',
        entity: 'product',
        entityId: null,
        metadata: { requested: products.length, created: created.length },
    });

    res.status(201).json({
        jobId: `bulk_${Date.now()}`,
        totalProducts: products.length,
        successful: created.length,
        failed: products.length - created.length,
        errors: [],
        status: 'completed',
    });
}));

// @route   GET /api/admin/analytics
// @access  Private (admin/super_admin + analytics)
router.get('/analytics', adminOnly, requirePartition('analytics'), asyncHandler(async (req, res) => {
    const [users, products, orders, brandRequests] = await Promise.all([
        User.find({}).select('role').lean(),
        Product.find({}).select('category').lean(),
        Order.find({}).select('status').lean(),
        BrandRequest.find({}).select('status').lean(),
    ]);

    const countBy = (arr, key) => {
        const out = {};
        arr.forEach((x) => {
            const v = x?.[key] || 'unknown';
            out[v] = (out[v] || 0) + 1;
        });
        return out;
    };

    const analytics = {
        usersByRole: countBy(users, 'role'),
        ordersByStatus: countBy(orders, 'status'),
        productsByCategory: countBy(products, 'category'),
        brandRequestsByStatus: countBy(brandRequests, 'status'),
        totals: {
            users: users.length,
            products: products.length,
            orders: orders.length,
            brandRequests: brandRequests.length,
        },
    };

    res.json({ analytics });
}));

// @route   GET /api/admin/settings
// @access  Private (admin/super_admin + settings)
router.get('/settings', adminOnly, requirePartition('settings'), asyncHandler(async (req, res) => {
    res.json({
        settings: {
            apiVersion: process.env.API_VERSION || 'v1',
            serverTime: new Date().toISOString(),
            role: req.user?.role || 'admin',
            partitions: req.user?.partitions || [],
            environment: process.env.NODE_ENV || 'development',
            supportEmail: process.env.SUPPORT_EMAIL || 'support@wholexale.com',
            brandAutoApprove: false,
        },
    });
}));

// -------------------------
// Brand Applications (compat)
// -------------------------
router.get('/brands/applications', adminOnly, requirePartition('brands'), asyncHandler(async (req, res) => {
    const items = await BrandRequest.find({}).sort({ createdAt: -1 }).limit(200).lean();
    res.json({
        applications: items.map((r) => ({
            id: String(r._id),
            status: r.status,
            brandName: r.brandName,
            businessName: r.businessName,
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
            sellerId: String(r.sellerId),
            payload: r.payload || {},
        })),
    });
}));

router.post('/brands/:id/approve', adminOnly, requirePartition('brands'), asyncHandler(async (req, res) => {
    const updated = await BrandRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'approved', reviewedBy: req.userId, reviewedAt: new Date(), comments: req.body?.comments || '' },
        { new: true }
    ).lean();

    await recordAudit({
        userId: req.userId,
        action: 'brand_request.approve',
        entity: 'brand_request',
        entityId: req.params.id,
        metadata: { comments: req.body?.comments || '' },
    });

    res.json({ application: updated ? { id: String(updated._id), status: updated.status } : null });
}));

router.post('/brands/:id/reject', adminOnly, requirePartition('brands'), asyncHandler(async (req, res) => {
    const updated = await BrandRequest.findByIdAndUpdate(
        req.params.id,
        { status: 'rejected', reviewedBy: req.userId, reviewedAt: new Date(), comments: req.body?.reason || req.body?.comments || '' },
        { new: true }
    ).lean();

    await recordAudit({
        userId: req.userId,
        action: 'brand_request.reject',
        entity: 'brand_request',
        entityId: req.params.id,
        metadata: { comments: req.body?.reason || req.body?.comments || '' },
    });

    res.json({ application: updated ? { id: String(updated._id), status: updated.status } : null });
}));

// -------------------------
// Super admin: admin accounts
// -------------------------
router.get('/admins', superAdminOnly, asyncHandler(async (req, res) => {
    const admins = await User.find({ role: { $in: ['admin', 'super_admin'] } })
        .sort({ createdAt: -1 })
        .lean();

    res.json({
        admins: admins.map((u) => ({
            id: String(u._id),
            email: u.email,
            role: u.role,
            status: mapAdminStatus(u),
            firstName: u.firstName,
            lastName: u.lastName,
            partitions: u.partitions || [],
        })),
        partitions: ADMIN_PARTITIONS,
    });
}));

router.post('/admins', superAdminOnly, asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName, partitions } = req.body || {};
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    const existing = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (existing) {
        return res.status(400).json({ error: 'User already exists' });
    }

    const allowedPartitionIds = new Set(ADMIN_PARTITIONS.map((p) => p.id));
    const nextPartitions = Array.isArray(partitions)
        ? partitions.filter((p) => allowedPartitionIds.has(p))
        : [];

    const created = await User.create({
        email: String(email).toLowerCase(),
        password: String(password),
        firstName: firstName ? String(firstName) : 'Admin',
        lastName: lastName ? String(lastName) : 'User',
        role: 'admin',
        partitions: nextPartitions,
        status: 'active',
        isActive: true,
        isVerified: true,
        emailVerified: true,
        phoneVerified: true,
        businessVerified: true,
    });

    await recordAudit({
        userId: req.userId,
        action: 'admin.create',
        entity: 'user',
        entityId: created._id,
        metadata: { email: created.email, partitions: nextPartitions },
    });

    res.status(201).json({
        admin: {
            id: String(created._id),
            email: created.email,
            role: created.role,
            status: mapAdminStatus(created),
            firstName: created.firstName,
            lastName: created.lastName,
            partitions: created.partitions || [],
        },
    });
}));

router.patch('/admins/:id', superAdminOnly, asyncHandler(async (req, res) => {
    const { partitions, status } = req.body || {};
    const update = {};

    if (typeof status === 'string') {
        if (status === 'disabled') update.isActive = false;
        if (status === 'verified') update.isActive = true;
    }

    if (Array.isArray(partitions)) {
        const allowedPartitionIds = new Set(ADMIN_PARTITIONS.map((p) => p.id));
        update.partitions = partitions.filter((p) => allowedPartitionIds.has(p));
    }

    const updated = await User.findByIdAndUpdate(req.params.id, update, { new: true }).lean();

    await recordAudit({
        userId: req.userId,
        action: 'admin.update',
        entity: 'user',
        entityId: req.params.id,
        metadata: update,
    });

    res.json({
        admin: updated
            ? {
                id: String(updated._id),
                email: updated.email,
                role: updated.role,
                status: mapAdminStatus(updated),
                firstName: updated.firstName,
                lastName: updated.lastName,
                partitions: updated.partitions || [],
            }
            : null,
    });
}));

module.exports = router;
