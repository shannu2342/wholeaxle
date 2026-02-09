"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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

// Mock data - will be replaced with API calls
const mockDashboardData = {
    stats: {
        totalUsers: 320,
        totalProducts: 1250,
        pendingAuthorizations: 5,
        lowStockItems: 23,
        totalBrands: 15,
        totalStockValue: 500000,
        stockTurnoverRate: 2.5,
    },
    recentActivity: [
        { id: 1, type: 'brand', message: 'New brand authorization submitted', time: '2 hours ago' },
        { id: 2, type: 'inventory', message: 'Low stock alert for Cotton Palazzo', time: '4 hours ago' },
        { id: 3, type: 'approval', message: 'Brand authorization approved: Nike', time: '1 day ago' },
        { id: 4, type: 'upload', message: 'Bulk upload completed: 150 products', time: '2 days ago' },
    ],
    brandApplications: [
        { id: 1, brandName: 'Nike', status: 'pending_review', submittedAt: '2024-01-15' },
        { id: 2, brandName: 'Adidas', status: 'approved', submittedAt: '2024-01-10' },
        { id: 3, brandName: 'Puma', status: 'rejected', submittedAt: '2024-01-05' },
    ],
    inventoryAlerts: [
        { id: 1, sku: 'WP-001', message: 'Low stock: Cotton Palazzo', severity: 'high' },
        { id: 2, sku: 'WP-002', message: 'Stock threshold reached: Denim Jeans', severity: 'medium' },
    ],
    charts: {
        brandRequests: [
            { name: 'Pending', value: 5 },
            { name: 'Approved', value: 15 },
            { name: 'Rejected', value: 2 },
        ],
    },
}

export default function AdminDashboard() {
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('overview')
    const [dashboardData, setDashboardData] = useState(mockDashboardData)
    const [loading, setLoading] = useState(true)
    const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null)

    // Fetch dashboard data from API
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true)
                const response = await adminApi.getDashboard()

                const dashboard = (response?.data?.dashboard || null) as
                    | (Partial<typeof mockDashboardData> & {
                        stats?: Partial<typeof mockDashboardData.stats>
                        charts?: Partial<typeof mockDashboardData.charts>
                    })
                    | null
                if (dashboard) {
                    setDashboardData({
                        ...mockDashboardData,
                        ...dashboard,
                        stats: { ...mockDashboardData.stats, ...(dashboard.stats || {}) },
                        charts: { ...mockDashboardData.charts, ...(dashboard.charts || {}) },
                    })
                    setLastUpdatedAt(new Date().toISOString())
                } else {
                    setDashboardData(mockDashboardData)
                    setLastUpdatedAt(new Date().toISOString())
                }
            } catch (error) {
                console.error('Failed to fetch dashboard data:', error)
                setDashboardData(mockDashboardData)
                setLastUpdatedAt(new Date().toISOString())
            } finally {
                setLoading(false)
            }
        }

        fetchDashboardData()
    }, [])

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
                                        onClick={() => router.push('/admin/brands')}
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
                                        onClick={() => router.push('/admin/inventory')}
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
                                        onClick={() => router.push('/admin/bulk')}
                                    >
                                        <Upload className="h-6 w-6" />
                                        <span className="text-sm">Bulk Upload</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="flex flex-col h-20 justify-center items-center gap-2"
                                        onClick={() => router.push('/admin/users')}
                                    >
                                        <Users className="h-6 w-6" />
                                        <span className="text-sm">User Management</span>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Brand Requests Chart */}
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <CardTitle>Brand Authorization Status</CardTitle>
                                <Button size="sm" variant="outline" onClick={() => router.push('/admin/brands')}>
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
                    </div>
                </TabsContent>

                {/* Brands Tab */}
                <TabsContent value="brands" className="mt-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Brand Management</CardTitle>
                            <Button size="sm" onClick={() => router.push('/admin/brands')}>
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
                                                Submitted: {new Date(app.submittedAt).toLocaleDateString()}
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
