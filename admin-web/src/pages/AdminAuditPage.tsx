import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { adminApi } from '@/lib/api'
import { clone, demoAudit, type DemoAuditEvent } from '@/lib/adminDemoData'

export default function AdminAuditPage() {
  const [rows, setRows] = useState<DemoAuditEvent[]>([])
  const [query, setQuery] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getAuditLog()
      const list = (res?.data?.events || []) as Array<Record<string, unknown>>
      setRows(
        list.map((x, idx) => ({
          id: String(x.id || `audit-${idx}`),
          at: String(x.at || new Date().toISOString()),
          actor: (x.actor as DemoAuditEvent['actor']) || null,
          action: String(x.action || 'unknown'),
          target: (x.target as DemoAuditEvent['target']) || null,
          meta: (x.meta as DemoAuditEvent['meta']) || null,
        }))
      )
    } catch {
      setRows(clone(demoAudit))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const actionOptions = useMemo(
    () => ['all', ...Array.from(new Set(rows.map((r) => r.action)))],
    [rows]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((r) => {
      const matchesAction = actionFilter === 'all' || r.action === actionFilter
      const hay = `${r.action} ${r.actor?.email || ''} ${r.target?.type || ''} ${r.target?.id || ''}`.toLowerCase()
      return matchesAction && (!q || hay.includes(q))
    })
  }, [rows, query, actionFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Log</h1>
          <p className="text-sm text-gray-500">Trace administrative actions for operational compliance.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search actor, action, target" />
          <select className="h-10 rounded-md border px-3 text-sm" value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            {actionOptions.map((a) => <option key={a} value={a}>{a === 'all' ? 'All Actions' : a}</option>)}
          </select>
          <div className="text-sm text-gray-600 flex items-center">Events: {filtered.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Events</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {filtered.map((event) => (
            <div key={event.id} className="rounded-lg border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{event.action}</div>
                <div className="text-xs text-gray-500">{new Date(event.at).toLocaleString()}</div>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Actor: {event.actor?.email || 'system'} | Target: {event.target?.type || '-'} {event.target?.id || ''}
              </div>
              {event.meta && <pre className="mt-2 overflow-auto rounded bg-gray-50 p-2 text-xs">{JSON.stringify(event.meta, null, 2)}</pre>}
            </div>
          ))}
          {!loading && filtered.length === 0 && <p className="text-sm text-gray-500">No audit events found.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
