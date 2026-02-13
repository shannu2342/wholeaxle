import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { clone, demoInventory, type DemoInventoryItem } from '@/lib/adminDemoData'

type SortKey = 'name' | 'stock' | 'price'

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<DemoInventoryItem[]>([])
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [sortKey, setSortKey] = useState<SortKey>('stock')
  const [loading, setLoading] = useState(true)
  const [threshold, setThreshold] = useState(10)

  const load = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getInventory()
      const list = (res?.data?.products || []) as Array<Record<string, unknown>>
      setRows(
        list.map((p, idx) => ({
          id: String(p.id || `prod-${idx}`),
          name: String(p.name || 'Unknown'),
          category: String(p.category || 'Uncategorized'),
          brand: String(p.brand || 'N/A'),
          price: Number(p.price || 0),
          moq: Number(p.moq || 0),
          stock: Number(p.stock || Math.floor(Math.random() * 60)),
          sku: String(p.sku || `SKU-${String(p.id || idx).slice(-6).toUpperCase()}`),
        }))
      )
    } catch {
      setRows(clone(demoInventory))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const categories = useMemo(() => ['all', ...Array.from(new Set(rows.map((r) => r.category)))], [rows])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const next = rows.filter((r) => {
      const matchesCategory = category === 'all' || r.category === category
      const matchesQuery =
        !q || r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.brand.toLowerCase().includes(q)
      return matchesCategory && matchesQuery
    })
    return [...next].sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name)
      if (sortKey === 'price') return b.price - a.price
      return a.stock - b.stock
    })
  }, [rows, query, category, sortKey])

  const adjustStock = (id: string, delta: number) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, stock: Math.max(0, r.stock + delta) } : r)))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory Management</h1>
          <p className="text-sm text-gray-500">Search products, track stock alerts, and adjust quantities.</p>
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>Refresh</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Controls</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product / SKU / brand" />
          <select className="h-10 rounded-md border px-3 text-sm" value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => <option key={c} value={c}>{c === 'all' ? 'All Categories' : c}</option>)}
          </select>
          <select className="h-10 rounded-md border px-3 text-sm" value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
            <option value="stock">Sort by Stock (Low First)</option>
            <option value="price">Sort by Price (High First)</option>
            <option value="name">Sort by Name</option>
          </select>
          <Input type="number" value={threshold} onChange={(e) => setThreshold(Number(e.target.value || 0))} placeholder="Low stock threshold" />
          <div className="text-sm text-gray-600 flex items-center">Visible: {filtered.length}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-600">
                  <th className="py-2">SKU</th>
                  <th className="py-2">Product</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">Price</th>
                  <th className="py-2">MOQ</th>
                  <th className="py-2">Stock</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-b">
                    <td className="py-3 font-mono text-xs">{row.sku}</td>
                    <td className="py-3">
                      <div className="font-medium">{row.name}</div>
                      <div className="text-xs text-gray-500">{row.brand}</div>
                    </td>
                    <td className="py-3">{row.category}</td>
                    <td className="py-3">INR {row.price.toLocaleString()}</td>
                    <td className="py-3">{row.moq}</td>
                    <td className="py-3">
                      <Badge variant={row.stock <= threshold ? 'destructive' : 'success'}>
                        {row.stock <= threshold ? `Low (${row.stock})` : row.stock}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => adjustStock(row.id, -1)}>-1</Button>
                        <Button size="sm" onClick={() => adjustStock(row.id, 1)}>+1</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && filtered.length === 0 && <p className="py-4 text-sm text-gray-500">No products found.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
