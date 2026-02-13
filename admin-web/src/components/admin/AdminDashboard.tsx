"use client"

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Activity, Package, Shield, Barcode, Upload, Users, AlertTriangle } from 'lucide-react'
import { adminApi } from '@/lib/api'
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
} from 'recharts'

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline"
type BrandRequestSlice = { name: string; value: number }
type RecentActivity = { id: string; type: string; message: string; time: string }
type BrandApplication = { id: string; brandName: string; status: string; submittedAt: string | null }
type InventoryAlert = { id: string; sku: string; message: string; severity: string }
type ReviewItem = { id: string; productName: string; rating: number; status: string; comment: string; reply?: string | null }
type CouponItem = {
    id: string
    code: string
    type: 'percent' | 'flat'
    amount: number
    minOrder: number
    expiresAt: string
    active: boolean
    createdBy?: string
    createdByRole?: string
}

const emptyDashboardData = {
    stats: {
        totalUsers: 0,
        totalProducts: 0,
        pendingAuthorizations: 0,
        lowStockItems: 0,
        totalBrands: 0,
        totalStockValue: 0,
        stockTurnoverRate: 0,
    },
    recentActivity: [] as RecentActivity[],
    brandApplications: [] as BrandApplication[],
    inventoryAlerts: [] as InventoryAlert[],
    charts: {
        brandRequests: [],
    },
}

const demoReviews: ReviewItem[] = [
    { id: 'rev-1', productName: 'Bluetooth Earbuds', rating: 2, status: 'pending', comment: 'Battery drain issue' },
    { id: 'rev-2', productName: 'Cotton Shirt Combo', rating: 5, status: 'approved', comment: 'Great quality' },
]

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [activeTab, setActiveTab] = useState('overview')
    const [heroIndex, setHeroIndex] = useState(0)
    const [dashboardData, setDashboardData] = useState(emptyDashboardData)
    const [loading, setLoading] = useState(true)
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)
    const [coupons, setCoupons] = useState<CouponItem[]>([])
    const [reviews, setReviews] = useState<ReviewItem[]>(demoReviews)
    const [reviewReplies, setReviewReplies] = useState<Record<string, string>>({})
    const [couponForm, setCouponForm] = useState({
        code: '',
        type: 'percent' as CouponItem['type'],
        amount: '',
        minOrder: '',
        expiresAt: '',
    })

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                const response = await adminApi.getDashboard()

                const dashboard = (response?.data?.dashboard || null) as
                    | (Partial<typeof emptyDashboardData> & {
                        stats?: Partial<typeof emptyDashboardData.stats>
                        charts?: Partial<typeof emptyDashboardData.charts>
                    })
                    | null
                if (dashboard) {
                    setDashboardData({
                        ...emptyDashboardData,
                        ...dashboard,
                        stats: { ...emptyDashboardData.stats, ...(dashboard.stats || {}) },
                        charts: { ...emptyDashboardData.charts, ...(dashboard.charts || {}) },
                    })
                    setLastUpdatedAt(new Date().toISOString())
                } else {
                    setDashboardData(emptyDashboardData)
                    setLastUpdatedAt(new Date().toISOString())
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
                setDashboardData(emptyDashboardData)
                setLastUpdatedAt(new Date().toISOString())
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

    useEffect(() => {
        const timer = window.setInterval(() => setHeroIndex((p) => (p + 1) % 3), 5000)
        return () => window.clearInterval(timer)
    }, [])

    useEffect(() => {
        const loadCoupons = async () => {
            try {
                const res = await adminApi.getCoupons()
                const list = (res?.data?.coupons || res?.data || []) as Array<Record<string, unknown>>
                const normalized = list.map((c, i) => ({
                    id: String(c.id || `cp-${i}`),
                    code: String(c.code || 'COUPON'),
                    type: c.type === 'flat' ? 'flat' : 'percent',
                    amount: Number(c.amount || 0),
                    minOrder: Number(c.minOrder || 0),
                    expiresAt: String(c.expiresAt || ''),
                    active: Boolean(c.active ?? true),
                    createdBy: c.createdBy ? String(c.createdBy) : undefined,
                    createdByRole: c.createdByRole ? String(c.createdByRole) : undefined,
                })) as CouponItem[]
                setCoupons(normalized)
                if (typeof window !== 'undefined') {
                    window.localStorage.setItem('adminCoupons', JSON.stringify(normalized))
                }
            } catch {
                if (typeof window === 'undefined') return
                const stored = window.localStorage.getItem('adminCoupons')
                if (stored) {
                    try {
                        const parsed = JSON.parse(stored) as CouponItem[]
                        if (Array.isArray(parsed)) setCoupons(parsed)
                    } catch {
                        // ignore malformed storage
                    }
                }
            }
        }

        loadCoupons()
    }, [])

    useEffect(() => {
        const loadReviews = async () => {
            try {
                const res = await adminApi.getReviews()
                const list = (res?.data?.reviews || res?.data || []) as Array<Record<string, unknown>>
                setReviews(list.map((x, i) => ({
                    id: String(x.id || x._id || i),
                    productName: String(x.productName || x.product || 'Unknown Product'),
                    rating: Number(x.rating || 0),
                    status: String(x.status || 'pending'),
                    comment: String(x.comment || ''),
                    reply: typeof x.reply === 'string' ? x.reply : null,
                })))
            } catch {
                setReviews(demoReviews)
            }
        }

        loadReviews()
    }, [])

    const persistCoupons = (next: CouponItem[]) => {
        setCoupons(next)
        if (typeof window !== 'undefined') {
            window.localStorage.setItem('adminCoupons', JSON.stringify(next))
        }
    }

    const createCoupon = () => {
        const code = couponForm.code.trim().toUpperCase()
        const amount = Number(couponForm.amount)
        const minOrder = Number(couponForm.minOrder)
        if (!code || !Number.isFinite(amount) || amount <= 0) return
        const newCoupon: CouponItem = {
            id: `cp-${Date.now()}`,
            code,
            type: couponForm.type,
            amount,
            minOrder: Number.isFinite(minOrder) ? minOrder : 0,
            expiresAt: couponForm.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
            active: true,
        }
        adminApi.createCoupon(newCoupon).catch(() => null)
        persistCoupons([newCoupon, ...coupons])
        setCouponForm({ code: '', type: couponForm.type, amount: '', minOrder: '', expiresAt: '' })
    }

    const toggleCoupon = (id: string) => {
        const next = coupons.map((c) => (c.id === id ? { ...c, active: !c.active } : c))
        const updated = next.find((c) => c.id === id)
        if (updated) adminApi.updateCoupon(id, { active: updated.active }).catch(() => null)
        persistCoupons(next)
    }

    const deleteCoupon = (id: string) => {
        adminApi.deleteCoupon(id).catch(() => null)
        persistCoupons(coupons.filter((c) => c.id !== id))
    }

    const replyToReview = async (id: string) => {
        const reply = (reviewReplies[id] || '').trim()
        if (!reply) return
        try {
            await adminApi.replyReview(id, reply)
        } catch {
            // demo fallback
        }
        setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply } : r)))
        setReviewReplies((prev) => ({ ...prev, [id]: '' }))
    }

    const heroSlides = [
        {
            title: 'Unified Marketplace Governance',
            subtitle: 'Monitor buyer and seller lifecycles from onboarding to payout.',
            image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1800&q=80',
            actionLabel: 'Open Operations',
            actionPath: '/admin/operations',
        },
        {
            title: 'Trust, Compliance, and Risk Controls',
            subtitle: 'Handle reviews, returns, disputes, and policy enforcement fast.',
            image: 'https://images.unsplash.com/photo-1556155092-490a1ba16284?auto=format&fit=crop&w=1800&q=80',
            actionLabel: 'Open Audit',
            actionPath: '/admin/audit',
        },
        {
            title: 'Growth Intelligence for Sellers',
            subtitle: 'Track inventory, orders, campaigns, and revenue signals in one place.',
            image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1800&q=80',
            actionLabel: 'Open Analytics',
            actionPath: '/admin/analytics',
        },
    ]

    const getStatusBadgeVariant = (status: string): BadgeVariant => {
        switch (status) {
            case 'approved':
                return 'success'
            case 'pending_review':
                return 'warning'
            case 'rejected':
                return 'destructive'
            default:
                return 'secondary'
        }
    }

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'brand':
                return <Shield className="h-4 w-4" />
            case 'inventory':
                return <AlertTriangle className="h-4 w-4" />
            case 'approval':
                return <Activity className="h-4 w-4" />
            case 'upload':
                return <Upload className="h-4 w-4" />
            default:
                return <Activity className="h-4 w-4" />
        }
    }

    const getAlertColor = (severity: string) => {
        switch (severity) {
            case 'high':
                return 'bg-red-100 text-red-800'
            case 'medium':
                return 'bg-yellow-100 text-yellow-800'
            case 'low':
                return 'bg-blue-100 text-blue-800'
            default:
                return 'bg-gray-100 text-gray-800'
        }
    }

    if (loading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-gray-600">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    {lastUpdatedAt && (
                        <p className="mt-1 text-xs text-gray-500">
                            Last updated: {new Date(lastUpdatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                    <Activity className="mr-2 h-4 w-4" />
                    Refresh
                </Button>
            </div>

            <Card className="overflow-hidden border-none text-white shadow-sm">
                <CardContent className="relative p-0">
                    {heroSlides.map((slide, idx) => (
                        <div
                            key={slide.title}
                            className={`absolute inset-0 transition-opacity duration-700 ${
                                idx === heroIndex ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <img src={slide.image} alt={slide.title} className="h-full w-full object-cover" />
                        </div>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900/85 via-blue-900/75 to-slate-900/80" />
                    <div className="relative z-10 p-6 md:p-8">
                        <h2 className="text-2xl font-semibold">{heroSlides[heroIndex].title}</h2>
                        <p className="mt-2 max-w-2xl text-sm text-white/90">{heroSlides[heroIndex].subtitle}</p>
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <Button onClick={() => navigate(heroSlides[heroIndex].actionPath)}>
                                {heroSlides[heroIndex].actionLabel}
                            </Button>
                            <Button variant="outline" className="bg-white/10 text-white hover:bg-white/20" onClick={() => navigate('/admin/operations')}>
                                Manage Buyer/Seller Ops
                            </Button>
                            <div className="ml-auto flex gap-2">
                                {heroSlides.map((_, idx) => (
                                    <button
                                        key={idx}
                                        type="button"
                                        aria-label={`Select dashboard hero ${idx + 1}`}
                                        className={`h-2.5 rounded-full transition-all ${idx === heroIndex ? 'w-7 bg-white' : 'w-2.5 bg-white/60'}`}
                                        onClick={() => setHeroIndex(idx)}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="h-56 md:h-48" />
                </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.stats.totalUsers}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.stats.totalProducts}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.stats.pendingAuthorizations}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardData.stats.lowStockItems}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
                <TabsList className="grid grid-cols-4 md:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="brands">Brands</TabsTrigger>
                    <TabsTrigger value="inventory">Inventory</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Ops</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4">
                    <div className="grid gap-6">
                        {/* Quick Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-20 justify-center items-center gap-2"
                                        onClick={() => navigate('/admin/brands')}
                                    >
                                        <Shield className="h-6 w-6" />
                                        <span className="text-sm">Review Brands</span>
                                        <Badge variant="destructive" className="text-xs">
                                            {dashboardData.stats.pendingAuthorizations} pending
                                        </Badge>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-20 justify-center items-center gap-2"
                                        onClick={() => navigate('/admin/inventory')}
                                    >
                                        <Barcode className="h-6 w-6" />
                                        <span className="text-sm">Inventory</span>
                                        <Badge variant="destructive" className="text-xs">
                                            {dashboardData.stats.lowStockItems} alerts
                                        </Badge>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-20 justify-center items-center gap-2"
                                        onClick={() => navigate('/admin/bulk')}
                                    >
                                        <Upload className="h-6 w-6" />
                                        <span className="text-sm">Bulk Upload</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-20 justify-center items-center gap-2"
                                        onClick={() => navigate('/admin/users')}
                                    >
                                        <Users className="h-6 w-6" />
                                        <span className="text-sm">User Management</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-20 justify-center items-center gap-2"
                                        onClick={() => document.getElementById('coupon-manager')?.scrollIntoView({ behavior: 'smooth' })}
                                    >
                                        <Activity className="h-6 w-6" />
                                        <span className="text-sm">Create Coupon</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        <Card id="coupon-manager">
                            <CardHeader>
                                <CardTitle>Create Coupon</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-3 md:grid-cols-5">
                                    <Input
                                        value={couponForm.code}
                                        onChange={(e) => setCouponForm((prev) => ({ ...prev, code: e.target.value }))}
                                        placeholder="CODE10"
                                    />
                                    <select
                                        className="h-10 rounded-md border px-3 text-sm"
                                        value={couponForm.type}
                                        onChange={(e) => setCouponForm((prev) => ({ ...prev, type: e.target.value as CouponItem['type'] }))}
                                    >
                                        <option value="percent">Percent</option>
                                        <option value="flat">Flat</option>
                                    </select>
                                    <Input
                                        value={couponForm.amount}
                                        onChange={(e) => setCouponForm((prev) => ({ ...prev, amount: e.target.value }))}
                                        placeholder={couponForm.type === 'percent' ? 'Discount %' : 'Discount amount'}
                                    />
                                    <Input
                                        value={couponForm.minOrder}
                                        onChange={(e) => setCouponForm((prev) => ({ ...prev, minOrder: e.target.value }))}
                                        placeholder="Min order"
                                    />
                                    <Input
                                        type="date"
                                        value={couponForm.expiresAt}
                                        onChange={(e) => setCouponForm((prev) => ({ ...prev, expiresAt: e.target.value }))}
                                    />
                                </div>
                                <Button onClick={createCoupon}>Create Coupon</Button>
                                <div className="space-y-2">
                                    {coupons.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">No coupons created yet.</p>
                                    ) : (
                                        coupons.map((coupon) => (
                                            <div key={coupon.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
                                                <div>
                                                    <div className="font-medium">{coupon.code}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {coupon.type === 'percent' ? `${coupon.amount}% off` : `₹${coupon.amount} off`} •
                                                        Min order ₹{coupon.minOrder.toLocaleString()} • Expires {coupon.expiresAt}
                                                    </div>
                                                    {coupon.createdByRole && (
                                                        <div className="text-xs text-muted-foreground">
                                                            Created by {coupon.createdByRole}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant={coupon.active ? 'success' : 'secondary'}>
                                                        {coupon.active ? 'active' : 'inactive'}
                                                    </Badge>
                                                    <Button size="sm" variant="outline" onClick={() => toggleCoupon(coupon.id)}>
                                                        {coupon.active ? 'Disable' : 'Enable'}
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => deleteCoupon(coupon.id)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Brand Requests Chart */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Brand Authorization Status</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => navigate('/admin/brands')}>
                                    <Shield className="mr-2 h-4 w-4" />
                                    Manage
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="h-60 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={(dashboardData.charts?.brandRequests || []) as BrandRequestSlice[]}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    innerRadius={55}
                                                    outerRadius={85}
                                                    paddingAngle={2}
                                                >
                                                    {(dashboardData.charts?.brandRequests || []).map((_, idx: number) => (
                                                        <Cell
                                                            key={`cell-${idx}`}
                                                            fill={['#F59E0B', '#10B981', '#EF4444'][idx % 3]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="space-y-3">
                                        {(dashboardData.charts?.brandRequests || []).map((row: BrandRequestSlice) => (
                                            <div key={row.name} className="flex items-center justify-between rounded-lg border bg-white px-4 py-3">
                                                <div className="text-sm font-medium text-gray-900">{row.name}</div>
                                                <div className="text-sm text-gray-600">{row.value}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recent Activity */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Recent Activity</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {dashboardData.recentActivity.map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                                                {getActivityIcon(activity.type)}
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium">{activity.message}</p>
                                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Review Replies</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {reviews.map((review) => (
                                    <div key={review.id} className="space-y-2 rounded-lg border p-3">
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <div>
                                                <div className="font-medium">{review.productName} • {review.rating}/5</div>
                                                <div className="text-xs text-muted-foreground">{review.comment}</div>
                                            </div>
                                            <Badge variant={review.status === 'approved' ? 'success' : review.status === 'rejected' ? 'destructive' : 'warning'}>
                                                {review.status}
                                            </Badge>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Input
                                                value={reviewReplies[review.id] || ''}
                                                onChange={(e) => setReviewReplies((prev) => ({ ...prev, [review.id]: e.target.value }))}
                                                placeholder={review.reply ? `Reply sent: ${review.reply}` : 'Reply to review...'}
                                            />
                                            <Button size="sm" variant="outline" onClick={() => replyToReview(review.id)}>
                                                Reply
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Brands Tab */}
                <TabsContent value="brands" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Brand Management</CardTitle>
                            <Button size="sm" onClick={() => navigate('/admin/brands')}>
                                <Shield className="mr-2 h-4 w-4" />
                                Review All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {dashboardData.brandApplications.map((app) => (
                                    <div key={app.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <h3 className="font-medium">{app.brandName}</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Submitted: {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}
                                            </p>
                                        </div>
                                        <Badge variant={getStatusBadgeVariant(app.status)}>
                                            {app.status.replace('_', ' ').toUpperCase()}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inventory Tab */}
                <TabsContent value="inventory" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Inventory Overview</CardTitle>
                            <Button size="sm" variant="outline">
                                <Barcode className="mr-2 h-4 w-4" />
                                View All
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Stock Value</h4>
                                    <p className="text-2xl font-bold">₹{(dashboardData.stats.totalStockValue / 100000).toFixed(1)}L</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium">Turnover Rate</h4>
                                    <p className="text-2xl font-bold">{dashboardData.stats.stockTurnoverRate}</p>
                                </div>
                            </div>

                            <div className="mt-6 space-y-4">
                                <h4 className="font-medium">Active Alerts</h4>
                                {dashboardData.inventoryAlerts.length > 0 ? (
                                    <div className="space-y-3">
                                        {dashboardData.inventoryAlerts.map((alert) => (
                                            <div key={alert.id} className={`flex items-center gap-3 p-3 rounded-lg ${getAlertColor(alert.severity)}`}>
                                                <AlertTriangle className="h-5 w-5" />
                                                <div>
                                                    <p className="font-medium">{alert.message}</p>
                                                    <p className="text-sm">SKU: {alert.sku}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted-foreground">No active alerts</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bulk Operations Tab */}
                <TabsContent value="bulk" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulk Operations</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <Button variant="outline" className="flex flex-col h-24 justify-center items-center gap-2">
                                    <Upload className="h-8 w-8 text-primary" />
                                    <span className="text-sm font-medium">Bulk Upload</span>
                                    <span className="text-xs text-muted-foreground">Upload multiple products</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-24 justify-center items-center gap-2">
                                    <Activity className="h-8 w-8 text-secondary" />
                                    <span className="text-sm font-medium">Bulk Edit</span>
                                    <span className="text-xs text-muted-foreground">Update existing products</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-24 justify-center items-center gap-2">
                                    <Barcode className="h-8 w-8 text-warning" />
                                    <span className="text-sm font-medium">Generate Codes</span>
                                    <span className="text-xs text-muted-foreground">SKU & Barcode generation</span>
                                </Button>
                                <Button variant="outline" className="flex flex-col h-24 justify-center items-center gap-2">
                                    <Activity className="h-8 w-8 text-purple-500" />
                                    <span className="text-sm font-medium">Export Data</span>
                                    <span className="text-xs text-muted-foreground">Download reports</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
