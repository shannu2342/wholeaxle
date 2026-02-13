import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/lib/api'
import { demoBrandApplications, demoInventory, demoOrders, demoUsers, toRecordList } from '@/lib/adminDemoData'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'

type AnalyticsPayload = {
  usersByRole: Record<string, number>
  ordersByStatus: Record<string, number>
  productsByCategory: Record<string, number>
  brandRequestsByStatus: Record<string, number>
  totals: { users: number; products: number; orders: number; brandRequests: number }
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsPayload | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAnalytics()
      const analytics = (res?.data?.analytics || null) as AnalyticsPayload | null
      if (!analytics) throw new Error('No analytics')
      setData(analytics)
    } catch {
      const usersByRole = demoUsers.reduce<Record<string, number>>((a, u) => {
        a[u.role] = (a[u.role] || 0) + 1
        return a
      }, {})
      const ordersByStatus = demoOrders.reduce<Record<string, number>>((a, o) => {
        a[o.status] = (a[o.status] || 0) + 1
        return a
      }, {})
      const productsByCategory = demoInventory.reduce<Record<string, number>>((a, p) => {
        a[p.category] = (a[p.category] || 0) + 1
        return a
      }, {})
      const brandRequestsByStatus = demoBrandApplications.reduce<Record<string, number>>((a, b) => {
        a[b.status] = (a[b.status] || 0) + 1
        return a
      }, {})
      setData({
        usersByRole,
        ordersByStatus,
        productsByCategory,
        brandRequestsByStatus,
        totals: {
          users: demoUsers.length,
          products: demoInventory.length,
          orders: demoOrders.length,
          brandRequests: demoBrandApplications.length,
        },
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const charts = useMemo(() => {
    if (!data) return null
    return {
      users: toRecordList(data.usersByRole),
      orders: toRecordList(data.ordersByStatus),
      products: toRecordList(data.productsByCategory),
      brands: toRecordList(data.brandRequestsByStatus),
    }
  }, [data])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-sm text-gray-500">Platform-level distribution metrics across users, orders, and catalog.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      {data && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card><CardHeader><CardTitle className="text-sm">Users</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.totals.users}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Products</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.totals.products}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Orders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.totals.orders}</div></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-sm">Brand Requests</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{data.totals.brandRequests}</div></CardContent></Card>
        </div>
      )}

      {charts && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Users By Role</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.users} dataKey="value" nameKey="name" outerRadius={100}>
                    {charts.users.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Order Status Mix</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.orders}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Products By Category</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.products}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Brand Review Outcomes</CardTitle></CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={charts.brands} dataKey="value" nameKey="name" outerRadius={100}>
                    {charts.brands.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
