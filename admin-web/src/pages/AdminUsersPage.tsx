import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { clone, demoUsers, type DemoUser } from '@/lib/adminDemoData'

const ROLES: DemoUser['role'][] = ['user', 'vendor', 'admin', 'super_admin']

export default function AdminUsersPage() {
  const [rows, setRows] = useState<DemoUser[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | DemoUser['role']>('all')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listUsers(roleFilter === 'all' ? undefined : { role: roleFilter })
      const list = (res?.data?.users || []) as Array<Record<string, unknown>>
      setRows(
        list.map((u, idx) => ({
          id: String(u.id || `user-${idx}`),
          email: String(u.email || ''),
          role: String(u.role || 'user') as DemoUser['role'],
          status: String(u.status || 'active') as DemoUser['status'],
          firstName: String(u.firstName || 'User'),
          lastName: String(u.lastName || ''),
          partitions: Array.isArray(u.partitions) ? (u.partitions as string[]) : [],
          isActive: Boolean(u.isActive ?? true),
          createdAt: String(u.createdAt || new Date().toISOString()),
        }))
      )
    } catch {
      setRows(clone(demoUsers).filter((u) => (roleFilter === 'all' ? true : u.role === roleFilter)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [roleFilter])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rows.filter((u) => {
      if (!q) return true
      return (
        u.email.toLowerCase().includes(q) ||
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
      )
    })
  }, [rows, query])

  const updateRole = async (id: string, role: DemoUser['role']) => {
    setBusyId(id)
    try {
      await adminApi.updateUserRole(id, role)
    } catch {
      // demo fallback
    } finally {
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Users Management</h1>
          <p className="text-sm text-gray-500">Manage account roles and monitor account state.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <Card>
        <CardHeader><CardTitle>Filters</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email / name" />
          <select className="h-10 rounded-md border px-3 text-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as 'all' | DemoUser['role'])}>
            <option value="all">All Roles</option>
            {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <div className="text-sm text-gray-600 flex items-center">Total: {filtered.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>User Directory</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">User</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Partitions</th>
                  <th className="py-2">Created</th>
                  <th className="py-2">Update Role</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-3">
                      <div className="font-medium">{u.firstName} {u.lastName}</div>
                      <div className="text-xs text-gray-500">{u.email}</div>
                    </td>
                    <td className="py-3"><Badge variant="secondary">{u.role}</Badge></td>
                    <td className="py-3"><Badge variant={u.isActive ? 'success' : 'destructive'}>{u.status}</Badge></td>
                    <td className="py-3 text-xs text-gray-600">{u.partitions.length ? u.partitions.join(', ') : '-'}</td>
                    <td className="py-3">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="py-3">
                      <select
                        className="h-8 rounded-md border px-2 text-xs"
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => updateRole(u.id, e.target.value as DemoUser['role'])}
                      >
                        {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
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
