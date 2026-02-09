"use client"

import { useEffect, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getApiErrorMessage } from "@/lib/errors"
import { RefreshCw, Settings } from "lucide-react"

type SettingsPayload = {
  apiVersion: string
  serverTime: string
  role: string
  partitions: string[]
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<SettingsPayload | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getSettings()
      setSettings((res?.data?.settings || null) as SettingsPayload | null)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load settings"))
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
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">Environment and access information.</p>
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
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <Settings className="h-4 w-4" />
                API Version
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{settings?.apiVersion || "-"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Server Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium text-gray-900">
                {settings?.serverTime ? new Date(settings.serverTime).toLocaleString() : "-"}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Role</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={settings?.role === "super_admin" ? "success" : "secondary"}>{settings?.role || "-"}</Badge>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Partitions</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-gray-600">Loading...</div>
            ) : settings?.partitions?.length ? (
              <div className="flex flex-wrap gap-2">
                {settings.partitions.map((p) => (
                  <Badge key={p} variant="secondary">
                    {p}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-600">No partitions returned.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
