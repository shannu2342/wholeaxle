"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Users } from "lucide-react"
import { getApiErrorMessage } from "@/lib/errors"

type UserRow = {
  id: string
  email: string
  role: string
  firstName?: string
  lastName?: string
  phone?: string
  status?: string
}

const ROLE_OPTIONS = ["buyer", "seller", "admin", "super_admin"] as const

export default function UsersPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getUsers()
      setUsers((res?.data?.users || []) as UserRow[])
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load users"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const updateRole = async (userId: string, role: string) => {
    setBusyId(userId)
    setError(null)
    try {
      await adminApi.updateUserRole(userId, role)
      await load()
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to update role"))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="mt-1 text-sm text-gray-600">Manage user roles and access.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User List
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">User</th>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3 text-right">Update</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-600">
                        Loading...
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-sm text-gray-600">
                        No users found.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => {
                      const busy = busyId === u.id
                      return (
                        <tr key={u.id} className="bg-white">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{u.email}</div>
                            <div className="text-xs text-gray-500">{u.id}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {[u.firstName, u.lastName].filter(Boolean).join(" ") || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{u.phone || "-"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={u.status === "verified" ? "success" : "secondary"}>
                              {u.status || "unknown"}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{u.role}</td>
                          <td className="px-4 py-3 text-right">
                            <select
                              className="h-9 rounded-md border bg-white px-2 text-sm"
                              value={u.role}
                              onChange={(e) => updateRole(u.id, e.target.value)}
                              disabled={busy}
                            >
                              {ROLE_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
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
