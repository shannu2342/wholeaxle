export type DemoBrandApplication = {
  id: string
  brandName: string
  businessName: string
  status: 'pending_review' | 'approved' | 'rejected'
  submittedAt: string
  submittedBy?: string
}

export type DemoInventoryItem = {
  id: string
  name: string
  category: string
  brand: string
  price: number
  moq: number
  stock: number
  sku: string
}

export type DemoOrder = {
  id: string
  number: string
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  createdAt: string
  buyerId: string
  sellerId: string
  total: number
  itemCount: number
}

export type DemoUser = {
  id: string
  email: string
  role: 'user' | 'vendor' | 'admin' | 'super_admin'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  firstName: string
  lastName: string
  partitions: string[]
  isActive: boolean
  createdAt: string
}

export type DemoAuditEvent = {
  id: string
  at: string
  actor: { id: string; email: string; role: string } | null
  action: string
  target: { type: string; id: string } | null
  meta: Record<string, unknown> | null
}

export type DemoAdmin = {
  id: string
  email: string
  role: 'admin' | 'super_admin'
  firstName: string
  lastName: string
  status: 'verified' | 'disabled' | 'pending'
  partitions: string[]
}

export const ADMIN_PARTITIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'admins', label: 'Admin Management' },
  { id: 'users', label: 'User Management' },
  { id: 'brands', label: 'Brand Authorizations' },
  { id: 'products', label: 'Products' },
  { id: 'orders', label: 'Orders' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'settings', label: 'Settings' },
]

export const demoBrandApplications: DemoBrandApplication[] = [
  {
    id: 'brand-req-1',
    brandName: 'Urban Weave',
    businessName: 'Urban Weave Retail Pvt Ltd',
    status: 'pending_review',
    submittedAt: new Date(Date.now() - 86400000).toISOString(),
    submittedBy: 'seller@wholexale.com',
  },
  {
    id: 'brand-req-2',
    brandName: 'SoundWave Pro',
    businessName: 'SoundWave Electronics',
    status: 'approved',
    submittedAt: new Date(Date.now() - 172800000).toISOString(),
    submittedBy: 'owner@soundwave.com',
  },
  {
    id: 'brand-req-3',
    brandName: 'Kitchenory',
    businessName: 'Kitchenory Supplies',
    status: 'rejected',
    submittedAt: new Date(Date.now() - 259200000).toISOString(),
    submittedBy: 'admin@kitchenory.com',
  },
]

export const demoInventory: DemoInventoryItem[] = [
  { id: 'prod-1', name: 'Scramble Palazzo', category: 'Fashion', brand: 'Urban Weave', price: 109, moq: 10, stock: 8, sku: 'SKU-URBW-001' },
  { id: 'prod-2', name: 'Bluetooth Earbuds', category: 'Electronics', brand: 'SoundWave Pro', price: 799, moq: 5, stock: 41, sku: 'SKU-SNDP-002' },
  { id: 'prod-3', name: 'Steel Bottle 1L', category: 'Home', brand: 'Kitchenory', price: 299, moq: 12, stock: 6, sku: 'SKU-KITC-003' },
  { id: 'prod-4', name: 'Cotton Shirt Combo', category: 'Fashion', brand: 'Urban Weave', price: 459, moq: 20, stock: 55, sku: 'SKU-URBW-004' },
]

export const demoOrders: DemoOrder[] = [
  {
    id: 'ord-1',
    number: 'ORD-1001',
    status: 'pending',
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    buyerId: 'buyer-1',
    sellerId: 'seller-1',
    total: 1090,
    itemCount: 10,
  },
  {
    id: 'ord-2',
    number: 'ORD-1002',
    status: 'shipped',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    buyerId: 'buyer-2',
    sellerId: 'seller-1',
    total: 545,
    itemCount: 5,
  },
  {
    id: 'ord-3',
    number: 'ORD-1003',
    status: 'delivered',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    buyerId: 'buyer-3',
    sellerId: 'seller-2',
    total: 799,
    itemCount: 1,
  },
]

export const demoUsers: DemoUser[] = [
  {
    id: 'user-1',
    email: 'buyer@wholexale.com',
    role: 'user',
    status: 'active',
    firstName: 'Buyer',
    lastName: 'Demo',
    partitions: [],
    isActive: true,
    createdAt: new Date(Date.now() - 259200000).toISOString(),
  },
  {
    id: 'user-2',
    email: 'seller@wholexale.com',
    role: 'vendor',
    status: 'active',
    firstName: 'Seller',
    lastName: 'Demo',
    partitions: [],
    isActive: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
  },
  {
    id: 'user-3',
    email: 'admin@wholexale.com',
    role: 'admin',
    status: 'active',
    firstName: 'Admin',
    lastName: 'Demo',
    partitions: ['overview', 'users', 'brands', 'products', 'orders', 'analytics', 'settings'],
    isActive: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
]

export const demoAudit: DemoAuditEvent[] = [
  {
    id: 'audit-1',
    at: new Date(Date.now() - 3600000).toISOString(),
    actor: { id: 'user-3', email: 'admin@wholexale.com', role: 'admin' },
    action: 'brands.request_approved',
    target: { type: 'brand_request', id: 'brand-req-1' },
    meta: { note: 'KYC verified' },
  },
  {
    id: 'audit-2',
    at: new Date(Date.now() - 7200000).toISOString(),
    actor: { id: 'user-3', email: 'admin@wholexale.com', role: 'admin' },
    action: 'orders.status_updated',
    target: { type: 'order', id: 'ord-1' },
    meta: { status: 'confirmed' },
  },
  {
    id: 'audit-3',
    at: new Date(Date.now() - 10800000).toISOString(),
    actor: { id: 'user-3', email: 'admin@wholexale.com', role: 'admin' },
    action: 'products.bulk_created',
    target: { type: 'products', id: 'bulk' },
    meta: { created: 12, rejected: 1 },
  },
]

export const demoAdmins: DemoAdmin[] = [
  {
    id: 'admin-1',
    email: 'admin@wholexale.com',
    role: 'admin',
    firstName: 'Admin',
    lastName: 'Demo',
    status: 'verified',
    partitions: ['overview', 'users', 'brands', 'products', 'orders', 'analytics', 'settings'],
  },
  {
    id: 'admin-2',
    email: 'superadmin@wholexale.com',
    role: 'super_admin',
    firstName: 'Super',
    lastName: 'Admin',
    status: 'verified',
    partitions: ['*'],
  },
]

export const demoSettings = {
  marketplaceName: 'Wholexale',
  supportEmail: 'support@wholexale.com',
  lowStockThreshold: 10,
  autoApproveBrands: false,
  maintenanceMode: false,
  timezone: 'Asia/Kolkata',
  currency: 'INR',
}

export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

export const toRecordList = (obj: Record<string, number>) =>
  Object.entries(obj).map(([name, value]) => ({ name, value }))
