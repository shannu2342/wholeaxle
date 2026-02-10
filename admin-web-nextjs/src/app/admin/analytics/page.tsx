"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getApiErrorMessage } from "@/lib/errors"
import { LineChart, RefreshCw } from "lucide-react"
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"

type AnalyticsPayload = {
  usersByRole: Record<string, number>
  ordersByStatus: Record<string, number>
  productsByCategory: Record<string, number>
  brandRequestsByStatus: Record<string, number>
  totals: { users: number; products: number; orders: number; brandRequests: number }
}

const COLORS = ["#2563EB", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#14B8A6", "#0EA5E9", "#F97316"]

const kvToArray = (obj: Record<string, number> | undefined) => {
  if (!obj) return []
  return Object.entries(obj)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsPayload | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getAnalytics()
      setAnalytics((res?.data?.analytics || null) as AnalyticsPayload | null)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load analytics"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const usersByRole = useMemo(() => kvToArray(analytics?.usersByRole), [analytics])
  const ordersByStatus = useMemo(() => kvToArray(analytics?.ordersByStatus), [analytics])
  const productsByCategory = useMemo(() => kvToArray(analytics?.productsByCategory), [analytics])
  const brandByStatus = useMemo(() => kvToArray(analytics?.brandRequestsByStatus), [analytics])

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="mt-1 text-sm text-gray-600">High-level metrics and trends.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totals?.users ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totals?.products ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totals?.orders ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Brand Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics?.totals?.brandRequests ?? 0}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Orders By Status
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : ordersByStatus.length === 0 ? (
                <div className="text-sm text-gray-600">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie dataKey="value" data={ordersByStatus} innerRadius={55} outerRadius={90} paddingAngle={2}>
                      {ordersByStatus.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Users By Role</CardTitle>
            </CardHeader>
            <CardContent className="h-[320px]">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : usersByRole.length === 0 ? (
                <div className="text-sm text-gray-600">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={usersByRole}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#2563EB" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Products By Category</CardTitle>
            </CardHeader>
            <CardContent className="h-[360px]">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : productsByCategory.length === 0 ? (
                <div className="text-sm text-gray-600">No data.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={productsByCategory.slice(0, 8)} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10B981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
              {productsByCategory.length > 8 ? (
                <div className="mt-2 text-xs text-gray-500">Showing top 8 categories.</div>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Requests By Status</CardTitle>
            </CardHeader>
            <CardContent className="flex h-[360px] flex-col">
              {loading ? (
                <div className="text-sm text-gray-600">Loading...</div>
              ) : brandByStatus.length === 0 ? (
                <div className="text-sm text-gray-600">No data.</div>
              ) : (
                <div className="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie dataKey="value" data={brandByStatus} innerRadius={50} outerRadius={90} paddingAngle={2}>
                          {brandByStatus.map((_, idx) => (
                            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-col gap-2">
                    {brandByStatus.map((r, idx) => (
                      <div key={r.name} className="flex items-center justify-between rounded-md border bg-white px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[idx % COLORS.length] }} />
                          <span className="text-sm text-gray-700">{r.name}</span>
                        </div>
                        <Badge variant="secondary">{r.value}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
