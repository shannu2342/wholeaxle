import { FormEvent, useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { ADMIN_PARTITIONS, clone, demoAdmins, type DemoAdmin } from '@/lib/adminDemoData'

type AdminStatus = 'verified' | 'disabled' | 'pending'

export default function AdminAdminsPage() {
  const [rows, setRows] = useState<DemoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('Password123')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedPartitions, setSelectedPartitions] = useState<string[]>(['overview'])

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.listAdmins()
      const list = (res?.data?.admins || []) as Array<Record<string, unknown>>
      setRows(
        list.map((a, idx) => ({
          id: String(a.id || `admin-${idx}`),
          email: String(a.email || ''),
          role: String(a.role || 'admin') as DemoAdmin['role'],
          firstName: String(a.firstName || 'Admin'),
          lastName: String(a.lastName || ''),
          status: String(a.status || 'verified') as DemoAdmin['status'],
          partitions: Array.isArray(a.partitions) ? (a.partitions as string[]) : [],
        }))
      )
    } catch {
      setRows(clone(demoAdmins))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const togglePartition = (id: string) => {
    setSelectedPartitions((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const createAdmin = async (e: FormEvent) => {
    e.preventDefault()
    setMessage('')
    if (!email.trim() || !password.trim()) {
      setMessage('Email and password are required.')
      return
    }

    try {
      const res = await adminApi.createAdmin({ email, password, firstName, lastName, partitions: selectedPartitions })
      const admin = res?.data?.admin
      if (admin) {
        setRows((prev) => [
          {
            id: String(admin.id),
            email: String(admin.email),
            role: String(admin.role) as DemoAdmin['role'],
            firstName: String(admin.firstName || firstName || 'Admin'),
            lastName: String(admin.lastName || lastName || 'User'),
            status: String(admin.status || 'verified') as DemoAdmin['status'],
            partitions: Array.isArray(admin.partitions) ? (admin.partitions as string[]) : selectedPartitions,
          },
          ...prev,
        ])
      }
      setMessage('Admin created.')
    } catch {
      const demo: DemoAdmin = {
        id: `admin-demo-${Date.now()}`,
        email,
        role: 'admin',
        firstName: firstName || 'Admin',
        lastName: lastName || 'User',
        status: 'verified',
        partitions: selectedPartitions,
      }
      setRows((prev) => [demo, ...prev])
      setMessage('Admin created in demo mode.')
    }

    setEmail('')
    setFirstName('')
    setLastName('')
    setSelectedPartitions(['overview'])
  }

  const updateAdmin = async (id: string, payload: { status?: AdminStatus; partitions?: string[] }) => {
    setBusyId(id)
    try {
      await adminApi.updateAdmin(id, payload)
    } catch {
      // demo fallback
    } finally {
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, status: payload.status || r.status, partitions: payload.partitions || r.partitions }
            : r
        )
      )
      setBusyId(null)
    }
  }

  const stats = useMemo(() => {
    return {
      total: rows.length,
      verified: rows.filter((r) => r.status === 'verified').length,
      disabled: rows.filter((r) => r.status === 'disabled').length,
    }
  }, [rows])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-sm text-gray-500">Create admin accounts and control partition access.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm">Total Admins</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.total}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Verified</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.verified}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Disabled</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.disabled}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Create Admin</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={createAdmin} className="grid gap-3 md:grid-cols-2">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin2@wholexale.com" />
            <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" />
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" />
            <div className="md:col-span-2 rounded-md border p-3">
              <p className="mb-2 text-sm font-medium">Partitions</p>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {ADMIN_PARTITIONS.map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={selectedPartitions.includes(p.id)} onChange={() => togglePartition(p.id)} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-2">
              <Button type="submit">Create Admin</Button>
              {message && <span className="text-sm text-gray-600">{message}</span>}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Admin Accounts</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">Admin</th>
                  <th className="py-2">Role</th>
                  <th className="py-2">Status</th>
                  <th className="py-2">Partitions</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((a) => (
                  <tr key={a.id} className="border-b align-top">
                    <td className="py-3">
                      <div className="font-medium">{a.firstName} {a.lastName}</div>
                      <div className="text-xs text-gray-500">{a.email}</div>
                    </td>
                    <td className="py-3"><Badge variant="secondary">{a.role}</Badge></td>
                    <td className="py-3"><Badge variant={a.status === 'verified' ? 'success' : a.status === 'disabled' ? 'destructive' : 'warning'}>{a.status}</Badge></td>
                    <td className="py-3 text-xs text-gray-600">{a.partitions.length ? a.partitions.join(', ') : '-'}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" disabled={busyId === a.id} onClick={() => updateAdmin(a.id, { status: 'verified' })}>Enable</Button>
                        <Button size="sm" variant="destructive" disabled={busyId === a.id} onClick={() => updateAdmin(a.id, { status: 'disabled' })}>Disable</Button>
                      </div>
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
