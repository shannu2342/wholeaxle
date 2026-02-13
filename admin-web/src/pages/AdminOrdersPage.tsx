import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { adminApi } from '@/lib/api'
import { clone, demoOrders, type DemoOrder } from '@/lib/adminDemoData'

const ORDER_STATUSES: DemoOrder['status'][] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded']

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<DemoOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | DemoOrder['status']>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getOrders(statusFilter === 'all' ? undefined : { status: statusFilter })
      const list = (res?.data?.orders || []) as Array<Record<string, unknown>>
      setRows(
        list.map((o, idx) => ({
          id: String(o.id || `ord-${idx}`),
          number: String(o.number || `ORD-${idx}`),
          status: String(o.status || 'pending') as DemoOrder['status'],
          createdAt: String(o.createdAt || new Date().toISOString()),
          buyerId: String(o.buyerId || 'n/a'),
          sellerId: String(o.sellerId || 'n/a'),
          total: Number(o.total || 0),
          itemCount: Number(o.itemCount || 0),
        }))
      )
    } catch {
      setRows(clone(demoOrders).filter((o) => (statusFilter === 'all' ? true : o.status === statusFilter)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [statusFilter])

  const summary = useMemo(() => {
    const byStatus = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1
      return acc
    }, {})
    const totalValue = rows.reduce((n, row) => n + row.total, 0)
    return { count: rows.length, totalValue, byStatus }
  }, [rows])

  const updateStatus = async (id: string, next: DemoOrder['status']) => {
    setBusyId(id)
    try {
      await adminApi.updateOrderStatus(id, next)
    } catch {
      // demo fallback
    } finally {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)))
      setBusyId(null)
    }
  }

  const badge = (s: DemoOrder['status']) => {
    if (s === 'delivered') return 'success'
    if (s === 'cancelled' || s === 'refunded') return 'destructive'
    if (s === 'pending') return 'warning'
    return 'secondary'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-sm text-gray-500">Track orders, update status, and review order value distribution.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Orders</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{summary.count}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Total Value</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">INR {summary.totalValue.toLocaleString()}</div></CardContent></Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Filter</CardTitle></CardHeader>
          <CardContent>
            <select className="h-10 w-full rounded-md border px-3 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | DemoOrder['status'])}>
              <option value="all">All Status</option>
              {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Orders</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">Order</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Buyer</th>
                  <th className="py-2">Items</th>
                  <th className="py-2">Total</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Update</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-3 font-medium">{row.number}</td>
                    <td className="py-3">{new Date(row.createdAt).toLocaleString()}</td>
                    <td className="py-3">{row.buyerId}</td>
                    <td className="py-3">{row.itemCount}</td>
                    <td className="py-3">INR {row.total.toLocaleString()}</td>
                    <td className="py-3"><Badge variant={badge(row.status)}>{row.status}</Badge></td>
                    <td className="py-3">
                      <select
                        className="h-8 rounded-md border px-2 text-xs"
                        value={row.status}
                        disabled={busyId === row.id}
                        onChange={(e) => updateStatus(row.id, e.target.value as DemoOrder['status'])}
                      >
                        {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
