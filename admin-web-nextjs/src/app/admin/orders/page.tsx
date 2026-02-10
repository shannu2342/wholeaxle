"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getApiErrorMessage } from "@/lib/errors"
import { RefreshCw, ShoppingCart } from "lucide-react"

type OrderRow = {
  id: string
  number: string
  status: string
  createdAt: string
  buyerId?: string
  sellerId?: string
  total: number
  itemCount: number
}

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning" | "outline"

type OrdersSummary = {
  totalOrders: number
  totalValue: number
  byStatus: Record<string, number>
}

const statusVariant = (status: string): BadgeVariant => {
  switch (status) {
    case "pending":
      return "warning"
    case "confirmed":
      return "secondary"
    case "shipped":
      return "secondary"
    case "delivered":
      return "success"
    case "cancelled":
    case "refunded":
      return "destructive"
    default:
      return "secondary"
  }
}

const STATUS_OPTIONS = ["pending", "confirmed", "shipped", "delivered", "cancelled", "refunded"] as const

export default function OrdersPage() {
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<string>("all")
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [summary, setSummary] = useState<OrdersSummary | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getOrders(status === "all" ? undefined : { status })
      setOrders((res?.data?.orders || []) as OrderRow[])
      setSummary((res?.data?.summary || null) as OrdersSummary | null)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load orders"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const statusCounts = useMemo(() => {
    return summary?.byStatus || {}
  }, [summary])

  const updateStatus = async (orderId: string, nextStatus: string) => {
    setBusyId(orderId)
    setError(null)
    try {
      await adminApi.updateOrderStatus(orderId, nextStatus)
      await load()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to update status"))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="mt-1 text-sm text-gray-600">Track and manage order status.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalOrders || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{Number(summary?.totalValue || 0).toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <ShoppingCart className="h-4 w-4" />
                Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.keys(statusCounts).length === 0 ? (
                <div className="text-sm text-gray-500">No data</div>
              ) : (
                Object.entries(statusCounts).map(([k, v]) => (
                  <Badge key={k} variant={statusVariant(k)}>
                    {k}: {String(v)}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle>Orders</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Filter:</span>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All</option>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">Order</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Buyer</th>
                    <th className="px-4 py-3">Seller</th>
                    <th className="px-4 py-3 text-right">Items</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-sm text-gray-600">
                        Loading...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-6 text-sm text-gray-600">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => {
                      const busy = busyId === o.id
                      return (
                        <tr key={o.id} className="bg-white">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{o.number}</div>
                            <div className="text-xs text-gray-500">{o.id}</div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{o.buyerId || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{o.sellerId || "-"}</td>
                          <td className="px-4 py-3 text-right text-sm text-gray-700">{o.itemCount ?? 0}</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            ₹{Number(o.total || 0).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <select
                              className="h-9 rounded-md border bg-white px-2 text-sm"
                              value={o.status}
                              onChange={(e) => updateStatus(o.id, e.target.value)}
                              disabled={busy}
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
