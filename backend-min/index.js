const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// -------------------------
// Auth + RBAC (in-memory)
// -------------------------
const sessions = new Map(); // token -> { userId, createdAt }

// --- In-memory seed data ---
const users = [
  {
    id: 'user-buyer-1',
    email: 'buyer@wholexale.com',
    password: 'Password123',
    role: 'buyer',
    firstName: 'Buyer',
    lastName: 'Demo',
    phone: '9000000001',
    status: 'verified',
  },
  {
    id: 'user-seller-1',
    email: 'seller@wholexale.com',
    password: 'Password123',
    role: 'seller',
    firstName: 'Seller',
    lastName: 'Demo',
    phone: '9000000002',
    status: 'verified',
  },
  {
    id: 'user-admin-1',
    email: 'admin@wholexale.com',
    password: 'Password123',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Demo',
    phone: '9000000003',
    status: 'verified',
    partitions: ['overview', 'users', 'brands', 'products', 'orders', 'analytics', 'settings'],
  },
  {
    id: 'user-super-admin-1',
    email: 'superadmin@wholexale.com',
    password: 'Password123',
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    phone: '9000000004',
    status: 'verified',
    partitions: ['*'],
  },
];

const ADMIN_PARTITIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'admins', label: 'Admin Management' },
  { id: 'users', label: 'User Management' },
  { id: 'brands', label: 'Brand Authorizations' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'finance', label: 'Finance' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
];

const auditLog = [];

const categories = [
  { id: 'fashion-lifestyle', name: 'Fashion & Lifestyle' },
  { id: 'electronics-mobiles', name: 'Electronics & Mobiles' },
  { id: 'fmcg-food', name: 'FMCG & Food' },
  { id: 'pharma-medical', name: 'Pharma & Medical' },
  { id: 'home-kitchen', name: 'Home & Kitchen' },
  { id: 'automotive', name: 'Automotive' },
  { id: 'industrial', name: 'Industrial' },
  { id: 'books-stationery', name: 'Books & Stationery' },
];

const products = [
  {
    id: 'prod-1',
    name: 'Scramble Fabric Palazzo For Women',
    price: 109,
    category: 'fashion-lifestyle',
    brand: 'Haajra Garments',
    margin: '64%',
    moq: 10,
    image: 'https://via.placeholder.com/300x300.png?text=Product+1',
  },
  {
    id: 'prod-2',
    name: '4/Pocket Scramble Palazzo For Women',
    price: 109,
    category: 'fashion-lifestyle',
    brand: 'Haajra Garments',
    margin: '64%',
    moq: 10,
    image: 'https://via.placeholder.com/300x300.png?text=Product+2',
  },
  {
    id: 'prod-3',
    name: 'Bluetooth Earbuds',
    price: 799,
    category: 'electronics-mobiles',
    brand: 'SoundWave',
    margin: '25%',
    moq: 5,
    image: 'https://via.placeholder.com/300x300.png?text=Product+3',
  },
  {
    id: 'prod-4',
    name: 'Stainless Steel Water Bottle',
    price: 299,
    category: 'home-kitchen',
    brand: 'HomePro',
    margin: '18%',
    moq: 12,
    image: 'https://via.placeholder.com/300x300.png?text=Product+4',
  },
];

function nowIso() {
  return new Date().toISOString();
}

const orders = [
  {
    id: 'ord-1',
    number: 'ORD001',
    status: 'pending',
    createdAt: nowIso(),
    buyerId: 'user-buyer-1',
    sellerId: 'user-seller-1',
    items: [{ productId: 'prod-1', qty: 10, price: 109 }],
    total: 1090,
  },
  {
    id: 'ord-2',
    number: 'ORD002',
    status: 'shipped',
    createdAt: nowIso(),
    buyerId: 'user-buyer-1',
    sellerId: 'user-seller-1',
    items: [{ productId: 'prod-2', qty: 5, price: 109 }],
    total: 545,
  },
  {
    id: 'ord-3',
    number: 'ORD003',
    status: 'delivered',
    createdAt: nowIso(),
    buyerId: 'user-buyer-1',
    sellerId: 'user-seller-1',
    items: [{ productId: 'prod-3', qty: 1, price: 799 }],
    total: 799,
  },
];

const makeToken = () => `mock-token-${uuidv4()}`;

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  role: user.role,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  status: user.status,
  partitions: user.partitions || [],
  createdAt: user.createdAt || nowIso(),
  lastLogin: nowIso(),
});

const recordAudit = ({ actor, action, target, meta }) => {
  auditLog.unshift({
    id: `audit-${uuidv4()}`,
    at: nowIso(),
    actor: actor ? { id: actor.id, email: actor.email, role: actor.role } : null,
    action,
    target,
    meta: meta || null,
  });
};

const getTokenFromReq = (req) => {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
};

const getUserFromReq = (req) => {
  const token = getTokenFromReq(req);
  if (!token) return null;
  const session = sessions.get(token);
  if (!session) return null;
  return users.find(u => u.id === session.userId) || null;
};

const requireAuth = (req, res, next) => {
  const user = getUserFromReq(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  req.user = user;
  return next();
};

const requireRole = (roles) => (req, res, next) => {
  const role = req.user?.role;
  if (!role || !roles.includes(role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  return next();
};

const hasPartition = (user, partitionId) => {
  if (!user) return false;
  if (user.role === 'super_admin') return true;
  const parts = Array.isArray(user.partitions) ? user.partitions : [];
  return parts.includes('*') || parts.includes(partitionId);
};

const requirePartition = (partitionId) => (req, res, next) => {
  const user = req.user;
  if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  if (!hasPartition(user, partitionId)) {
    return res.status(403).json({ error: `Missing permission: ${partitionId}` });
  }
  return next();
};

// --- Domain stores (in-memory) ---
const brandRequests = [];

// -------------------------
// Content + Policy stores
// -------------------------
const contentStore = {
  banners: [
    {
      id: 'banner-1',
      title: 'Fashion & Lifestyle Marketplace',
      subtitle: 'Wholesale Fashion for retailers',
      image: 'https://via.placeholder.com/1200x400.png?text=Wholexale+Banner',
    },
  ],
  brands: [
    { id: 'brand-1', name: 'Haajra Garments' },
    { id: 'brand-2', name: 'SoundWave' },
  ],
  faqs: [
    { id: 'faq-1', question: 'How to become a seller?', answer: 'Apply in profile and get approved by admin.' },
  ],
};

const policyStore = {
  terms:
    'Terms and Conditions\\n\\n1. Use of platform is subject to compliance checks.\\n2. Admin may suspend accounts for policy violations.',
  privacy:
    'Privacy Policy\\n\\n1. Buyer and seller data is processed for order fulfillment and compliance.\\n2. Platform logs are retained for security and audit.',
};

// --- Routes ---
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'wholexale-backend-min' });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = makeToken();
  const refreshToken = makeToken();
  sessions.set(token, { userId: user.id, createdAt: Date.now() });
  sessions.set(refreshToken, { userId: user.id, createdAt: Date.now() });
  recordAudit({
    actor: user,
    action: 'auth.login',
    target: { type: 'user', id: user.id },
  });

  return res.json({
    user: publicUser(user),
    token,
    refreshToken,
  });
});

app.post('/api/auth/register', (req, res) => {
  const {
    email,
    password,
    firstName = 'User',
    lastName = 'Demo',
    phone,
    userType,
  } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  if (users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'User already exists' });
  }

  const newUser = {
    id: `user-${uuidv4()}`,
    email,
    password,
    role: userType || 'buyer',
    firstName,
    lastName,
    phone,
    status: 'pending',
  };
  users.push(newUser);

  const token = makeToken();
  sessions.set(token, { userId: newUser.id, createdAt: Date.now() });
  recordAudit({
    actor: newUser,
    action: 'auth.register',
    target: { type: 'user', id: newUser.id },
  });

  return res.json({
    user: {
      ...publicUser(newUser),
      lastLogin: undefined,
    },
    token,
  });
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.get('/api/categories', (req, res) => {
  res.json({ categories });
});

app.get('/api/products', (req, res) => {
  const { category, page = 1, limit = 20 } = req.query || {};
  const filtered = category ? products.filter(p => p.category === category) : products;
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.max(parseInt(limit, 10) || 20, 1);
  const start = (pageNum - 1) * lim;
  const end = start + lim;
  const paged = filtered.slice(start, end);
  res.json({
    products: paged,
    pagination: {
      page: pageNum,
      limit: lim,
      total: filtered.length,
      hasMore: end < filtered.length,
    },
  });
});

app.post('/api/products', requireAuth, (req, res) => {
  const actor = req.user;
  if (!['seller', 'admin', 'super_admin'].includes(actor.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const product = req.body || {};
  const newProduct = {
    id: `prod-${uuidv4()}`,
    ...product,
  };
  products.unshift(newProduct);
  recordAudit({
    actor,
    action: 'products.create',
    target: { type: 'product', id: newProduct.id },
  });
  res.json({ product: newProduct });
});

app.post('/api/products/bulk', requireAuth, (req, res) => {
  const actor = req.user;
  if (!['seller', 'admin', 'super_admin'].includes(actor.role)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  const { products: incoming = [] } = req.body || {};
  const created = incoming.map(p => ({ id: `prod-${uuidv4()}`, ...p }));
  products.unshift(...created);
  recordAudit({
    actor,
    action: 'products.bulk_create',
    target: { type: 'product', id: created[0]?.id || null },
    meta: { count: created.length },
  });
  res.json({ inserted: created.length, products: created });
});

// -------------------------
// Brand Authorization Flow
// -------------------------
app.post('/api/brand/requests', requireAuth, (req, res) => {
  const actor = req.user;
  if (actor.role !== 'seller') {
    return res.status(403).json({ error: 'Only sellers can submit brand authorizations' });
  }

  const { brandData, documents } = req.body || {};
  const brandName = brandData?.brandName?.trim();
  if (!brandName) {
    return res.status(400).json({ error: 'brandData.brandName is required' });
  }

  const request = {
    id: `brandreq-${uuidv4()}`,
    brandData: { ...brandData, brandName },
    documents: Array.isArray(documents) ? documents : [],
    status: 'pending_review',
    submittedAt: nowIso(),
    updatedAt: nowIso(),
    submittedBy: { id: actor.id, email: actor.email },
    reviewComments: null,
    reviewedBy: null,
    reviewedAt: null,
  };
  brandRequests.unshift(request);

  recordAudit({
    actor,
    action: 'brands.request_submitted',
    target: { type: 'brand_request', id: request.id },
    meta: { brandName },
  });

  return res.json({ request });
});

app.get('/api/brand/requests', requireAuth, (req, res) => {
  const actor = req.user;
  const { status, page = 1, limit = 20 } = req.query || {};
  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const lim = Math.max(parseInt(limit, 10) || 20, 1);

  let list = brandRequests.slice();

  // Sellers only see their own requests.
  if (actor.role === 'seller') {
    list = list.filter(r => r.submittedBy?.id === actor.id);
  }

  // Buyers have no access.
  if (actor.role === 'buyer') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Admin access is partition-gated.
  if (actor.role === 'admin' && !hasPartition(actor, 'brands')) {
    return res.status(403).json({ error: 'Missing permission: brands' });
  }

  if (status) {
    list = list.filter(r => r.status === status);
  }

  const start = (pageNum - 1) * lim;
  const end = start + lim;
  const paged = list.slice(start, end);

  return res.json({
    requests: paged,
    pagination: {
      page: pageNum,
      limit: lim,
      total: list.length,
      hasMore: end < list.length,
    },
  });
});

app.post('/api/brand/requests/:id/approve', requireAuth, requirePartition('brands'), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const { comments } = req.body || {};
  const reqItem = brandRequests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });
  reqItem.status = 'approved';
  reqItem.reviewComments = comments || null;
  reqItem.reviewedAt = nowIso();
  reqItem.reviewedBy = { id: actor.id, email: actor.email };
  reqItem.updatedAt = nowIso();

  recordAudit({
    actor,
    action: 'brands.request_approved',
    target: { type: 'brand_request', id },
  });

  return res.json({
    status: reqItem.status,
    reviewedAt: reqItem.reviewedAt,
    reviewedBy: reqItem.reviewedBy,
  });
});

app.post('/api/brand/requests/:id/reject', requireAuth, requirePartition('brands'), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const { comments } = req.body || {};
  const reqItem = brandRequests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });
  reqItem.status = 'rejected';
  reqItem.reviewComments = comments || null;
  reqItem.reviewedAt = nowIso();
  reqItem.reviewedBy = { id: actor.id, email: actor.email };
  reqItem.updatedAt = nowIso();

  recordAudit({
    actor,
    action: 'brands.request_rejected',
    target: { type: 'brand_request', id },
  });

  return res.json({
    status: reqItem.status,
    reviewedAt: reqItem.reviewedAt,
    reviewedBy: reqItem.reviewedBy,
  });
});

app.post('/api/brand/detect', requireAuth, (req, res) => {
  const { imageUri } = req.body || {};

  // Mock brand detections; deterministically vary by input.
  const seed = String(imageUri || '');
  const candidates = [
    { brandName: 'Nike', confidence: 0.82 },
    { brandName: 'Adidas', confidence: 0.76 },
    { brandName: 'Puma', confidence: 0.64 },
    { brandName: 'Haajra Garments', confidence: 0.61 },
    { brandName: 'SoundWave', confidence: 0.58 },
  ];

  const shift = seed.length % candidates.length;
  const brandDetections = candidates
    .slice(shift)
    .concat(candidates.slice(0, shift))
    .slice(0, 3);

  return res.json({ brandDetections });
});

// -------------------------
// Admin API (super-admin + partition RBAC)
// -------------------------
app.get('/api/admin/partitions', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  return res.json({ partitions: ADMIN_PARTITIONS });
});

app.get('/api/admin/dashboard', requireAuth, requirePartition('overview'), (req, res) => {
  const pendingBrand = brandRequests.filter(r => r.status === 'pending_review').length;
  const approvedBrand = brandRequests.filter(r => r.status === 'approved').length;
  const rejectedBrand = brandRequests.filter(r => r.status === 'rejected').length;

  const dashboard = {
    stats: {
      totalUsers: users.length,
      totalProducts: products.length,
      totalBrands: Math.max(approvedBrand, 0),
      pendingAuthorizations: pendingBrand,
      lowStockItems: 0,
      totalStockValue: 0,
      stockTurnoverRate: 0,
    },
    recentActivity: auditLog.slice(0, 8).map(e => ({
      id: e.id,
      type: e.action.startsWith('brands.') ? 'brand' : e.action.startsWith('products.') ? 'inventory' : 'activity',
      message: `${e.action}${e.meta?.brandName ? ` (${e.meta.brandName})` : ''}`,
      time: e.at,
    })),
    brandApplications: brandRequests.slice(0, 10).map(r => ({
      id: r.id,
      brandName: r.brandData?.brandName,
      status: r.status,
      submittedAt: r.submittedAt,
      submittedBy: r.submittedBy,
    })),
    inventoryAlerts: [],
    charts: {
      brandRequests: [
        { name: 'Pending', value: pendingBrand },
        { name: 'Approved', value: approvedBrand },
        { name: 'Rejected', value: rejectedBrand },
      ],
    },
  };

  return res.json({ dashboard });
});

app.get('/api/admin/audit', requireAuth, requirePartition('overview'), (req, res) => {
  return res.json({ events: auditLog.slice(0, 200) });
});

app.get('/api/admin/users', requireAuth, requirePartition('users'), (req, res) => {
  const { role } = req.query || {};
  let list = users.slice().map(u => ({
    id: u.id,
    email: u.email,
    role: u.role,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    status: u.status,
  }));
  if (role) list = list.filter(u => u.role === role);
  return res.json({ users: list });
});

app.put('/api/admin/users/:id/role', requireAuth, requirePartition('users'), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const { role } = req.body || {};
  const target = users.find(u => u.id === id);
  if (!target) return res.status(404).json({ error: 'User not found' });
  if (!role || !['buyer', 'seller', 'admin', 'super_admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  target.role = role;
  recordAudit({
    actor,
    action: 'users.role_updated',
    target: { type: 'user', id: target.id },
    meta: { role },
  });
  return res.json({ ok: true, user: { id: target.id, email: target.email, role: target.role } });
});

// Brands (admin alias endpoints expected by admin-web)
app.get('/api/admin/brands/applications', requireAuth, requirePartition('brands'), (req, res) => {
  const list = brandRequests.slice().map(r => ({
    id: r.id,
    brandName: r.brandData?.brandName,
    status: r.status,
    submittedAt: r.submittedAt,
    submittedBy: r.submittedBy,
  }));
  return res.json({ applications: list });
});

app.post('/api/admin/brands/:id/approve', requireAuth, requirePartition('brands'), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const reqItem = brandRequests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });
  reqItem.status = 'approved';
  reqItem.reviewedAt = nowIso();
  reqItem.reviewedBy = { id: actor.id, email: actor.email };
  reqItem.updatedAt = nowIso();
  recordAudit({ actor, action: 'brands.request_approved', target: { type: 'brand_request', id } });
  return res.json({ ok: true, request: reqItem });
});

app.post('/api/admin/brands/:id/reject', requireAuth, requirePartition('brands'), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const { reason } = req.body || {};
  const reqItem = brandRequests.find(r => r.id === id);
  if (!reqItem) return res.status(404).json({ error: 'Request not found' });
  reqItem.status = 'rejected';
  reqItem.reviewComments = reason || null;
  reqItem.reviewedAt = nowIso();
  reqItem.reviewedBy = { id: actor.id, email: actor.email };
  reqItem.updatedAt = nowIso();
  recordAudit({ actor, action: 'brands.request_rejected', target: { type: 'brand_request', id } });
  return res.json({ ok: true, request: reqItem });
});

// Inventory (admin alias endpoints expected by admin-web)
app.get('/api/admin/inventory', requireAuth, requirePartition('products'), (req, res) => {
  return res.json({ products });
});

app.get('/api/admin/inventory/alerts', requireAuth, requirePartition('products'), (req, res) => {
  return res.json({ alerts: [] });
});

app.post('/api/admin/bulk/barcodes', requireAuth, requirePartition('products'), (req, res) => {
  const { count = 10 } = req.body || {};
  const n = Math.max(Math.min(parseInt(count, 10) || 10, 500), 1);
  const barcodes = Array.from({ length: n }).map(() => `SKU-${uuidv4().slice(0, 8).toUpperCase()}`);
  return res.json({ count: n, barcodes });
});

// Bulk: create products (JSON-based to keep backend-min simple; no multipart/multer).
app.post('/api/admin/bulk/products', requireAuth, requirePartition('products'), (req, res) => {
  const actor = req.user;
  const { products: incoming } = req.body || {};

  if (!Array.isArray(incoming) || incoming.length === 0) {
    return res.status(400).json({ error: 'products[] is required' });
  }

  const created = [];
  const rejected = [];

  incoming.slice(0, 500).forEach((p, idx) => {
    const name = typeof p?.name === 'string' ? p.name.trim() : '';
    const price = Number(p?.price);
    if (!name || !Number.isFinite(price)) {
      rejected.push({ index: idx, reason: 'Invalid product (name/price)', product: p });
      return;
    }

    const next = {
      id: p?.id || `prod-${uuidv4()}`,
      name,
      price,
      category: typeof p?.category === 'string' ? p.category : undefined,
      brand: typeof p?.brand === 'string' ? p.brand : undefined,
      margin: typeof p?.margin === 'string' ? p.margin : undefined,
      moq: typeof p?.moq === 'number' ? p.moq : undefined,
      image: typeof p?.image === 'string' ? p.image : 'https://via.placeholder.com/300x300.png?text=Product',
    };
    products.push(next);
    created.push(next);
  });

  recordAudit({
    actor,
    action: 'products.bulk_created',
    target: { type: 'products', id: 'bulk' },
    meta: { created: created.length, rejected: rejected.length },
  });

  return res.json({ ok: true, created, rejected });
});

// Orders
app.get('/api/admin/orders', requireAuth, requirePartition('orders'), (req, res) => {
  const { status } = req.query || {};
  const list = orders
    .slice()
    .filter(o => (status ? o.status === status : true))
    .map(o => ({
      id: o.id,
      number: o.number,
      status: o.status,
      createdAt: o.createdAt,
      buyerId: o.buyerId,
      sellerId: o.sellerId,
      total: o.total,
      itemCount: Array.isArray(o.items) ? o.items.reduce((n, it) => n + (it.qty || 0), 0) : 0,
    }));

  const summary = list.reduce((acc, o) => {
    acc.totalOrders += 1;
    acc.totalValue += o.total || 0;
    acc.byStatus[o.status] = (acc.byStatus[o.status] || 0) + 1;
    return acc;
  }, { totalOrders: 0, totalValue: 0, byStatus: {} });

  return res.json({ orders: list, summary });
});

app.post('/api/admin/orders/:id/status', requireAuth, requirePartition('orders'), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const { status } = req.body || {};

  const allowed = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const order = orders.find(o => o.id === id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  order.status = status;
  recordAudit({
    actor,
    action: 'orders.status_updated',
    target: { type: 'order', id: order.id },
    meta: { status },
  });

  return res.json({ ok: true, order: { id: order.id, status: order.status } });
});

// Analytics
app.get('/api/admin/analytics', requireAuth, requirePartition('analytics'), (req, res) => {
  const usersByRole = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {});

  const ordersByStatus = orders.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const productsByCategory = products.reduce((acc, p) => {
    const key = p.category || 'uncategorized';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const brandByStatus = brandRequests.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return res.json({
    analytics: {
      usersByRole,
      ordersByStatus,
      productsByCategory,
      brandRequestsByStatus: brandByStatus,
      totals: {
        users: users.length,
        products: products.length,
        orders: orders.length,
        brandRequests: brandRequests.length,
      },
    },
  });
});

// Settings (simple info endpoint)
app.get('/api/admin/settings', requireAuth, requirePartition('settings'), (req, res) => {
  const user = req.user;
  return res.json({
    settings: {
      apiVersion: 'backend-min',
      serverTime: nowIso(),
      role: user.role,
      partitions: user.partitions || [],
    },
  });
});

// Super admin: create/manage admins
app.get('/api/admin/admins', requireAuth, requireRole(['super_admin']), (req, res) => {
  const admins = users
    .filter(u => u.role === 'admin' || u.role === 'super_admin')
    .map(u => ({
      id: u.id,
      email: u.email,
      role: u.role,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      status: u.status,
      partitions: u.partitions || [],
    }));
  return res.json({ admins, partitions: ADMIN_PARTITIONS });
});

app.post('/api/admin/admins', requireAuth, requireRole(['super_admin']), (req, res) => {
  const actor = req.user;
  const { email, password, firstName = 'Admin', lastName = 'User', partitions = [] } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });
  if (users.find(u => u.email === email)) return res.status(409).json({ error: 'User already exists' });

  const allowed = ADMIN_PARTITIONS.map(p => p.id);
  const cleaned = Array.isArray(partitions)
    ? partitions.filter(p => allowed.includes(p))
    : [];

  const newAdmin = {
    id: `user-admin-${uuidv4()}`,
    email,
    password,
    role: 'admin',
    firstName,
    lastName,
    phone: null,
    status: 'verified',
    partitions: cleaned,
    createdAt: nowIso(),
  };
  users.push(newAdmin);
  recordAudit({
    actor,
    action: 'admins.created',
    target: { type: 'user', id: newAdmin.id },
    meta: { email, partitions: cleaned },
  });

  return res.json({
    admin: {
      id: newAdmin.id,
      email: newAdmin.email,
      role: newAdmin.role,
      firstName: newAdmin.firstName,
      lastName: newAdmin.lastName,
      status: newAdmin.status,
      partitions: newAdmin.partitions,
    },
  });
});

app.patch('/api/admin/admins/:id', requireAuth, requireRole(['super_admin']), (req, res) => {
  const actor = req.user;
  const { id } = req.params;
  const target = users.find(u => u.id === id);
  if (!target) return res.status(404).json({ error: 'Admin not found' });
  if (!['admin', 'super_admin'].includes(target.role)) return res.status(400).json({ error: 'Target is not an admin' });

  const { partitions, status } = req.body || {};
  const allowed = ADMIN_PARTITIONS.map(p => p.id);
  if (Array.isArray(partitions)) {
    target.partitions = partitions.filter(p => allowed.includes(p));
  }
  if (status && ['verified', 'pending', 'disabled'].includes(status)) {
    target.status = status;
  }

  recordAudit({
    actor,
    action: 'admins.updated',
    target: { type: 'user', id: target.id },
    meta: { partitions: target.partitions, status: target.status },
  });

  return res.json({
    admin: {
      id: target.id,
      email: target.email,
      role: target.role,
      firstName: target.firstName,
      lastName: target.lastName,
      status: target.status,
      partitions: target.partitions || [],
    },
  });
});

app.get('/api/content/home', (req, res) => {
  res.json(contentStore);
});

app.get('/api/content/policies', (req, res) => {
  res.json({ policies: policyStore });
});

// Admin editable content (hero/banner) for buyer/seller apps
app.get('/api/admin/content/home', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  res.json(contentStore);
});

app.put('/api/admin/content/home', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  const { banners, brands, faqs } = req.body || {};
  if (Array.isArray(banners)) contentStore.banners = banners;
  if (Array.isArray(brands)) contentStore.brands = brands;
  if (Array.isArray(faqs)) contentStore.faqs = faqs;

  recordAudit({
    actor: req.user,
    action: 'content.home.updated',
    target: { type: 'content', id: 'home' },
    meta: { banners: contentStore.banners.length, brands: contentStore.brands.length, faqs: contentStore.faqs.length },
  });

  res.json({ ok: true, content: contentStore });
});

// Admin editable legal policies
app.get('/api/admin/content/policies', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  res.json({ policies: policyStore });
});

app.put('/api/admin/content/policies', requireAuth, requireRole(['admin', 'super_admin']), (req, res) => {
  const { terms, privacy } = req.body || {};
  if (typeof terms === 'string') policyStore.terms = terms;
  if (typeof privacy === 'string') policyStore.privacy = privacy;

  recordAudit({
    actor: req.user,
    action: 'content.policies.updated',
    target: { type: 'content', id: 'policies' },
    meta: { termsLength: policyStore.terms.length, privacyLength: policyStore.privacy.length },
  });

  res.json({ ok: true, policies: policyStore });
});

app.get('/api/chat/conversations', (req, res) => {
  res.json({ conversations: [] });
});

app.get('/api/chat/messages', (req, res) => {
  res.json({ messages: [] });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`backend-min listening on http://0.0.0.0:${PORT}`);
});
