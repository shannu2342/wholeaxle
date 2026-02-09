"use client"

import { useEffect, useMemo, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getApiErrorMessage } from "@/lib/errors"
import { Barcode, RefreshCw, Search } from "lucide-react"

type Product = {
  id: string
  name: string
  price: number
  category?: string
  brand?: string
  margin?: string
  moq?: number
}

export default function InventoryPage() {
  const [loading, setLoading] = useState(true)
  const [products, setProducts] = useState<Product[]>([])
  const [q, setQ] = useState("")
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await adminApi.getInventory()
      setProducts((res?.data?.products || []) as Product[])
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to load inventory"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return products
    return products.filter((p) => {
      return (
        p.name?.toLowerCase().includes(query) ||
        p.brand?.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.id?.toLowerCase().includes(query)
      )
    })
  }, [products, q])

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
            <p className="mt-1 text-sm text-gray-600">Products available in the marketplace.</p>
          </div>
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <Card>
          <CardHeader className="gap-3 md:flex-row md:items-center md:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Barcode className="h-5 w-5" />
              Products
            </CardTitle>
            <div className="relative w-full md:w-96">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="pl-9" />
            </div>
          </CardHeader>
          <CardContent>
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            ) : null}

            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[980px] table-auto border-collapse">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Brand</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">MOQ</th>
                    <th className="px-4 py-3">Margin</th>
                    <th className="px-4 py-3 text-right">Price</th>
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
                        No products found.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id} className="bg-white">
                        <td className="px-4 py-3">
                          <div className="text-sm font-medium text-gray-900">{p.name}</div>
                          <div className="text-xs text-gray-500">{p.id}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.brand || "-"}</td>
                        <td className="px-4 py-3">
                          {p.category ? (
                            <Badge variant="secondary">{p.category}</Badge>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{typeof p.moq === "number" ? p.moq : "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{p.margin || "-"}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          ₹{Number.isFinite(p.price) ? p.price.toLocaleString() : "0"}
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
