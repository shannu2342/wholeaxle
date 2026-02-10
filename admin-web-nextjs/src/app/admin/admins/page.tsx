"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"
import AdminLayout, { useAdmin } from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiErrorMessage } from "@/lib/errors"
import { RefreshCw, ShieldCheck } from "lucide-react"

type Partition = { id: string; label: string }
type AdminRow = {
  id: string
  email: string
  role: string
  status: string
  firstName?: string
  lastName?: string
  partitions?: string[]
}

function AdminsInner() {
  const { user } = useAdmin()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [partitions, setPartitions] = useState<Partition[]>([])

  const [creating, setCreating] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [createParts, setCreateParts] = useState<Set<string>>(new Set())

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editParts, setEditParts] = useState<Set<string>>(new Set())
  const [editStatus, setEditStatus] = useState<string>("verified")
  const [busyId, setBusyId] = useState<string | null>(null)

  const canManage = user.role === "super_admin"

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listAdmins()
      setAdmins((res?.data?.admins || []) as AdminRow[])
      setPartitions((res?.data?.partitions || []) as Partition[])
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load admins"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const allowedPartitionIds = useMemo(() => partitions.map((p) => p.id), [partitions])

  const toggleCreatePartition = (id: string) => {
    setCreateParts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const startEdit = (a: AdminRow) => {
    setEditingId(a.id)
    setEditStatus(a.status || "verified")
    setEditParts(new Set(Array.isArray(a.partitions) ? a.partitions : []))
  }

  const toggleEditPartition = (id: string) => {
    setEditParts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const create = async (e: FormEvent) => {
    e.preventDefault()
    if (!canManage) return

    setCreating(true)
    setError(null)
    try {
      const payload = {
        email: email.trim(),
        password,
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
        partitions: Array.from(createParts).filter((p) => allowedPartitionIds.includes(p)),
      }
      await adminApi.createAdmin(payload)
      setEmail("")
      setPassword("")
      setFirstName("")
      setLastName("")
      setCreateParts(new Set())
      await load()
    } catch (e2: unknown) {
      setError(getApiErrorMessage(e2, "Failed to create admin"))
    } finally {
      setCreating(false)
    }
  }

  const saveEdit = async () => {
    if (!canManage || !editingId) return
    setBusyId(editingId)
    setError(null)
    try {
      await adminApi.updateAdmin(editingId, {
        status: editStatus,
        partitions: Array.from(editParts).filter((p) => allowedPartitionIds.includes(p)),
      })
      setEditingId(null)
      await load()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to update admin"))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admins</h1>
            <p className="mt-1 text-sm text-gray-600">Super admin can create admins and assign partitions.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {!canManage ? (
          <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
            This page is only available to `super_admin`.
          </div>
        ) : null}

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        {canManage ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5" />
                Create Admin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={create} className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="newadmin@wholexale.com" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>Password</Label>
                    <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password123" required />
                  </div>
                  <div className="grid gap-2">
                    <Label>First name</Label>
                    <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Admin" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Last name</Label>
                    <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="User" />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>Partitions</Label>
                  <div className="grid gap-2 md:grid-cols-3">
                    {partitions.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                        <input
                          type="checkbox"
                          checked={createParts.has(p.id)}
                          onChange={() => toggleCreatePartition(p.id)}
                        />
                        <span className="text-gray-800">{p.label}</span>
                        <span className="ml-auto text-xs text-gray-500">{p.id}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Admin"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Admin Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">Admin</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Partitions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-gray-600">
                        Loading...
                      </td>
                    </tr>
                  ) : admins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-gray-600">
                        No admins found.
                      </td>
                    </tr>
                  ) : (
                    admins.map((a) => {
                      const isEditing = editingId === a.id
                      const isBusy = busyId === a.id
                      const parts = Array.isArray(a.partitions) ? a.partitions : []
                      return (
                        <tr key={a.id} className="bg-white align-top">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{a.email}</div>
                            <div className="text-xs text-gray-500">{a.id}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{a.role}</td>
                          <td className="px-4 py-3">
                            <Badge variant={a.status === "disabled" ? "destructive" : a.status === "verified" ? "success" : "secondary"}>
                              {a.status || "unknown"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {parts.length ? parts.slice(0, 10).map((p) => <Badge key={p} variant="secondary">{p}</Badge>) : <span className="text-sm text-gray-500">-</span>}
                              {parts.length > 10 ? <span className="text-xs text-gray-500">+{parts.length - 10} more</span> : null}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {canManage ? (
                              <div className="flex justify-end gap-2">
                                {!isEditing ? (
                                  <Button size="sm" variant="outline" onClick={() => startEdit(a)}>
                                    Edit
                                  </Button>
                                ) : (
                                  <>
                                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)} disabled={isBusy}>
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={saveEdit} disabled={isBusy}>
                                      {isBusy ? "Saving..." : "Save"}
                                    </Button>
                                  </>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {canManage && editingId ? (
              <div className="mt-6 rounded-md border bg-white p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-gray-900">Edit Admin</div>
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Status</Label>
                      <select
                        className="h-9 rounded-md border bg-white px-2 text-sm"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                      >
                        <option value="verified">verified</option>
                        <option value="pending">pending</option>
                        <option value="disabled">disabled</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Partitions</Label>
                    <div className="grid gap-2 md:grid-cols-3">
                      {partitions.map((p) => (
                        <label key={p.id} className="flex items-center gap-2 rounded-md border bg-white px-3 py-2 text-sm">
                          <input type="checkbox" checked={editParts.has(p.id)} onChange={() => toggleEditPartition(p.id)} />
                          <span className="text-gray-800">{p.label}</span>
                          <span className="ml-auto text-xs text-gray-500">{p.id}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveEdit} disabled={busyId === editingId}>
                      {busyId === editingId ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
    </div>
  )
}

export default function AdminsPage() {
  return (
    <AdminLayout>
      <AdminsInner />
    </AdminLayout>
  )
}
