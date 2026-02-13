import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { clone, demoSettings } from '@/lib/adminDemoData'

type SettingsState = typeof demoSettings

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(clone(demoSettings))
  const [serverInfo, setServerInfo] = useState({ apiVersion: 'demo', serverTime: '', role: 'admin' })
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getSettings()
      const s = (res?.data?.settings || {}) as Record<string, unknown>
      setServerInfo({
        apiVersion: String(s.apiVersion || 'v1'),
        serverTime: String(s.serverTime || new Date().toISOString()),
        role: String(s.role || 'admin'),
      })
      setSettings((prev) => ({
        ...prev,
        supportEmail: String(s.supportEmail || prev.supportEmail),
        autoApproveBrands: Boolean(s.brandAutoApprove ?? prev.autoApproveBrands),
      }))
    } catch {
      setServerInfo({ apiVersion: 'demo', serverTime: new Date().toISOString(), role: 'admin' })
      setSettings(clone(demoSettings))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const save = () => {
    // Local-only save for demo/admin UI settings.
    localStorage.setItem('adminDashboardSettings', JSON.stringify(settings))
    setMessage(`Saved locally at ${new Date().toLocaleTimeString()}`)
  }

  const reset = () => {
    setSettings(clone(demoSettings))
    setMessage('Settings reset to defaults.')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-sm text-gray-500">Configure marketplace defaults and operational controls.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Reload</Button>
      </div>

      {message && <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">{message}</div>}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>General</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">Marketplace Name</label>
              <Input value={settings.marketplaceName} onChange={(e) => setSettings({ ...settings, marketplaceName: e.target.value })} />
            </div>
            <div>
              <label className="mb-1 block text-sm">Support Email</label>
              <Input value={settings.supportEmail} onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm">Timezone</label>
                <Input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-sm">Currency</label>
                <Input value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Operations</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="mb-1 block text-sm">Low Stock Threshold</label>
              <Input
                type="number"
                value={settings.lowStockThreshold}
                onChange={(e) => setSettings({ ...settings, lowStockThreshold: Number(e.target.value || 0) })}
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.autoApproveBrands}
                onChange={(e) => setSettings({ ...settings, autoApproveBrands: e.target.checked })}
              />
              Auto-approve brand requests
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
              />
              Maintenance mode
            </label>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Runtime Info</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm text-gray-600 md:grid-cols-3">
          <div>API Version: <strong>{serverInfo.apiVersion}</strong></div>
          <div>Server Time: <strong>{new Date(serverInfo.serverTime).toLocaleString()}</strong></div>
          <div>Role: <strong>{serverInfo.role}</strong></div>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button onClick={save}>Save Settings</Button>
        <Button variant="outline" onClick={reset}>Reset</Button>
      </div>
    </div>
  )
}
