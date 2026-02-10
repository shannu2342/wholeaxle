"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RefreshCw, Shield, CheckCircle2, XCircle, Search } from "lucide-react"
import { getApiErrorMessage } from "@/lib/errors"

type BrandRequest = {
  id: string
  brandData?: { brandName?: string }
  status: "pending" | "approved" | "rejected" | string
  submittedAt?: string
  updatedAt?: string
  submittedBy?: { id: string; email: string }
  reviewComments?: string | null
  reviewedBy?: { id: string; email: string } | null
  reviewedAt?: string | null
}

const statusBadgeVariant = (status: string): "warning" | "success" | "destructive" | "secondary" => {
  switch (status) {
    case "pending":
      return "warning"
    case "approved":
      return "success"
    case "rejected":
      return "destructive"
    default:
      return "secondary"
  }
}

const statusLabel = (status: string) => {
  switch (status) {
    case "pending":
      return "Pending Review"
    case "approved":
      return "Approved"
    case "rejected":
      return "Rejected"
    default:
      return status || "Unknown"
  }
}

export default function BrandsPage() {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState<BrandRequest[]>([])
  const [status, setStatus] = useState<string>("pending")
  const [q, setQ] = useState("")
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.listBrandRequests({ status: status === "all" ? undefined : status })
      setRequests((res?.data?.requests || []) as BrandRequest[])
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load brand requests"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return requests
    return requests.filter((r) => {
      const name = r.brandData?.brandName || ""
      const by = r.submittedBy?.email || ""
      return name.toLowerCase().includes(query) || by.toLowerCase().includes(query) || r.id.toLowerCase().includes(query)
    })
  }, [requests, q])

  const approve = async (id: string) => {
    setActionBusyId(id)
    try {
      const comments = window.prompt("Approval comments (optional):", "") || undefined
      await adminApi.approveBrandRequest(id, comments)
      await load()
    } catch (e: unknown) {
      window.alert(getApiErrorMessage(e, "Failed to approve request"))
    } finally {
      setActionBusyId(null)
    }
  }

  const reject = async (id: string) => {
    const comments = window.prompt("Rejection reason/comments:", "")
    if (!comments?.trim()) return
    setActionBusyId(id)
    try {
      await adminApi.rejectBrandRequest(id, comments.trim())
      await load()
    } catch (e: unknown) {
      window.alert(getApiErrorMessage(e, "Failed to reject request"))
    } finally {
      setActionBusyId(null)
    }
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Brand Authorizations</h1>
            <p className="mt-1 text-sm text-gray-600">Review seller brand authorization submissions.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Requests
            </CardTitle>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search brand, email, or id" className="pl-9" />
              </div>
              <select
                className="h-10 rounded-md border bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="all">All</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[860px] table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Submitted By</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Reviewed</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>
                        Loading...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-sm text-gray-600" colSpan={6}>
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((r) => {
                      const busy = actionBusyId === r.id
                      const brandName = r.brandData?.brandName || "Unknown"
                      return (
                        <tr key={r.id} className="bg-white">
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">{brandName}</div>
                            <div className="text-xs text-gray-500">{r.id}</div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">{r.submittedBy?.email || "-"}</td>
                          <td className="px-4 py-3">
                            <Badge variant={statusBadgeVariant(r.status)}>{statusLabel(r.status)}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {r.reviewedAt ? new Date(r.reviewedAt).toLocaleString() : "-"}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => approve(r.id)}
                                disabled={busy || r.status === "approved"}
                              >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => reject(r.id)}
                                disabled={busy || r.status === "rejected"}
                              >
                                <XCircle className="mr-2 h-4 w-4" />
                                Reject
                              </Button>
                            </div>
                            {r.reviewComments ? (
                              <div className="mt-2 text-xs text-gray-500">Comment: {r.reviewComments}</div>
                            ) : null}
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
