import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'
import { clone, demoBrandApplications, type DemoBrandApplication } from '@/lib/adminDemoData'

type StatusFilter = 'all' | 'pending_review' | 'approved' | 'rejected'

export default function AdminBrandsPage() {
  const [rows, setRows] = useState<DemoBrandApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await adminApi.getBrandApplications()
      const list = (res?.data?.applications || []) as Array<Record<string, unknown>>
      if (!Array.isArray(list)) throw new Error('Invalid response')
      setRows(
        list.map((r) => ({
          id: String(r.id || ''),
          brandName: String(r.brandName || 'Unknown'),
          businessName: String(r.businessName || 'Unknown'),
          status: (r.status === 'pending' ? 'pending_review' : String(r.status || 'pending_review')) as DemoBrandApplication['status'],
          submittedAt: String(r.submittedAt || r.createdAt || new Date().toISOString()),
          submittedBy: String(r.submittedBy || r.sellerId || ''),
        }))
      )
    } catch {
      setRows(clone(demoBrandApplications))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesStatus = status === 'all' || row.status === status
      const matchesQuery =
        !q ||
        row.brandName.toLowerCase().includes(q) ||
        row.businessName.toLowerCase().includes(q) ||
        (row.submittedBy || '').toLowerCase().includes(q)
      return matchesStatus && matchesQuery
    })
  }, [rows, query, status])

  const act = async (id: string, nextStatus: 'approved' | 'rejected') => {
    setBusyId(id)
    setError('')
    setMessage('')
    try {
      if (nextStatus === 'approved') {
        await adminApi.approveBrand(id)
      } else {
        await adminApi.rejectBrand(id, 'Rejected from dashboard')
      }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)))
      setMessage(`Brand application ${nextStatus}.`)
    } catch (e) {
      // Demo fallback update
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: nextStatus } : r)))
      setMessage(`Updated in demo mode: ${nextStatus}.`)
      if (getApiErrorMessage(e, '').trim()) {
        // keep silent error in demo fallback
      }
    } finally {
      setBusyId(null)
    }
  }

  const badgeVariant = (s: DemoBrandApplication['status']) => {
    if (s === 'approved') return 'success'
    if (s === 'rejected') return 'destructive'
    return 'warning'
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Brands Management</h1>
          <p className="text-sm text-gray-500">Review, approve, and reject brand applications.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search brand, business, email" />
          <select
            className="h-10 rounded-md border px-3 text-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as StatusFilter)}
          >
            <option value="all">All Status</option>
            <option value="pending_review">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <div className="text-sm text-gray-600 flex items-center">Showing {filtered.length} of {rows.length}</div>
        </CardContent>
      </Card>

      {(message || error) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">Brand</th>
                  <th className="py-2">Business</th>
                  <th className="py-2">Submitted By</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-3 font-medium">{row.brandName}</td>
                    <td className="py-3">{row.businessName}</td>
                    <td className="py-3">{row.submittedBy || '-'}</td>
                    <td className="py-3">{new Date(row.submittedAt).toLocaleString()}</td>
                    <td className="py-3">
                      <Badge variant={badgeVariant(row.status)}>{row.status}</Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          disabled={busyId === row.id || row.status === 'approved'}
                          onClick={() => act(row.id, 'approved')}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={busyId === row.id || row.status === 'rejected'}
                          onClick={() => act(row.id, 'rejected')}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && <p className="text-sm text-gray-500 py-4">No applications found.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
