"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RefreshCw, Activity } from "lucide-react"
import { getApiErrorMessage } from "@/lib/errors"

type AuditEvent = {
  id: string
  at: string
  actor: { id: string; email: string; role: string } | null
  action: string
  target: { type: string; id: string } | null
  meta: unknown
}

export default function AuditPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [events, setEvents] = useState<AuditEvent[]>([])

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getAuditLog()
      setEvents((res?.data?.events || []) as AuditEvent[])
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load audit log"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="mt-1 text-sm text-gray-600">Security and operational events.</p>
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
              <Activity className="h-5 w-5" />
              Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">Time</th>
                    <th className="px-4 py-3">Actor</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Target</th>
                    <th className="px-4 py-3">Meta</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-gray-600">
                        Loading...
                      </td>
                    </tr>
                  ) : events.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-sm text-gray-600">
                        No events.
                      </td>
                    </tr>
                  ) : (
                    events.map((e) => (
                      <tr key={e.id} className="bg-white align-top">
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {e.at ? new Date(e.at).toLocaleString() : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {e.actor ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{e.actor.email}</span>
                              <span className="text-xs text-gray-500">
                                {e.actor.role} / {e.actor.id}
                              </span>
                            </div>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{e.action}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {e.target ? (
                            <span className="text-gray-900">
                              {e.target.type}:{e.target.id}
                            </span>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {e.meta ? (
                            <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded-md border bg-gray-50 p-2">
                              {JSON.stringify(e.meta, null, 2)}
                            </pre>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    ))
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
