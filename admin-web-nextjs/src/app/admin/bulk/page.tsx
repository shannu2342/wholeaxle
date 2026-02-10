"use client"

import { useMemo, useState } from "react"
import AdminLayout from "@/components/admin/AdminLayout"
import { adminApi } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Upload, Barcode, PackagePlus } from "lucide-react"
import { getApiErrorMessage } from "@/lib/errors"

type BulkResult = {
  ok: boolean
  created: Array<Record<string, unknown>>
  rejected: Array<{ index: number; reason: string; product: unknown }>
}

function parseCsv(text: string): Array<Record<string, unknown>> {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim())
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim())
    const obj: Record<string, string> = {}
    headers.forEach((h, i) => {
      obj[h] = cols[i]
    })
    return obj
  })

  // Normalize common fields (name, price, category, brand, moq, margin, image, id)
  return rows.map((r) => {
    const price = r.price !== undefined ? Number(r.price) : undefined
    const moq = r.moq !== undefined ? Number(r.moq) : undefined
    return {
      id: r.id || undefined,
      name: r.name || r.productName || r.title || "",
      price: Number.isFinite(price) ? price : r.price,
      category: r.category || undefined,
      brand: r.brand || undefined,
      margin: r.margin || undefined,
      moq: Number.isFinite(moq) ? moq : undefined,
      image: r.image || r.imageUrl || undefined,
    }
  })
}

export default function BulkOpsPage() {
  const [barcodeCount, setBarcodeCount] = useState(20)
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [barcodeLoading, setBarcodeLoading] = useState(false)

  const [jsonText, setJsonText] = useState<string>("[]")
  const [csvFileName, setCsvFileName] = useState<string | null>(null)
  const [csvProducts, setCsvProducts] = useState<Array<Record<string, unknown>>>([])

  const [bulkLoading, setBulkLoading] = useState(false)
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const jsonPreviewCount = useMemo(() => {
    try {
      const parsed = JSON.parse(jsonText)
      return Array.isArray(parsed) ? parsed.length : 0
    } catch {
      return 0
    }
  }, [jsonText])

  const generate = async () => {
    setBarcodeLoading(true)
    setError(null)
    try {
      const res = await adminApi.generateBarcodes(Math.max(1, Math.min(500, Number(barcodeCount) || 20)))
      setBarcodes((res?.data?.barcodes || []) as string[])
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Failed to generate barcodes"))
    } finally {
      setBarcodeLoading(false)
    }
  }

  const submitProducts = async (products: Array<Record<string, unknown>>) => {
    setBulkLoading(true)
    setError(null)
    setBulkResult(null)
    try {
      const res = await adminApi.bulkCreateProducts(products)
      setBulkResult(res?.data as BulkResult)
    } catch (e: unknown) {
      setError(getApiErrorMessage(e, "Bulk create failed"))
    } finally {
      setBulkLoading(false)
    }
  }

  const submitJson = async () => {
    try {
      const parsed = JSON.parse(jsonText)
      if (!Array.isArray(parsed)) {
        setError("JSON must be an array of products")
        return
      }
      const cleaned = parsed
        .filter((p) => p && typeof p === "object" && !Array.isArray(p))
        .map((p) => p as Record<string, unknown>)
      await submitProducts(cleaned)
    } catch {
      setError("Invalid JSON")
    }
  }

  const onCsvUpload = async (file: File | null) => {
    setError(null)
    setBulkResult(null)
    setCsvFileName(file ? file.name : null)
    setCsvProducts([])
    if (!file) return

    const text = await file.text()
    const rows = parseCsv(text)
    setCsvProducts(rows)
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bulk Operations</h1>
          <p className="mt-1 text-sm text-gray-600">Generate barcodes and bulk-create products.</p>
        </div>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Barcode className="h-5 w-5" />
                Barcode Generator
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="barcodeCount">Count (1-500)</Label>
                <div className="flex gap-2">
                  <Input
                    id="barcodeCount"
                    type="number"
                    value={barcodeCount}
                    onChange={(e) => setBarcodeCount(Number(e.target.value))}
                    min={1}
                    max={500}
                  />
                  <Button onClick={generate} disabled={barcodeLoading}>
                    {barcodeLoading ? "Generating..." : "Generate"}
                  </Button>
                </div>
              </div>

              {barcodes.length ? (
                <div className="rounded-md border bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-900">Generated</div>
                    <Badge variant="secondary">{barcodes.length}</Badge>
                  </div>
                  <div className="max-h-56 overflow-auto text-xs text-gray-700">
                    <pre className="whitespace-pre-wrap">{barcodes.join("\n")}</pre>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-500">No barcodes generated yet.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5" />
                Bulk Product Create
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Tabs defaultValue="json">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="json">Paste JSON</TabsTrigger>
                  <TabsTrigger value="csv">Upload CSV</TabsTrigger>
                </TabsList>

                <TabsContent value="json" className="mt-4">
                  <div className="flex flex-col gap-2">
                    <Label>Products JSON array</Label>
                    <textarea
                      className="min-h-[220px] w-full rounded-md border bg-white p-3 font-mono text-xs"
                      value={jsonText}
                      onChange={(e) => setJsonText(e.target.value)}
                      placeholder='[{"name":"Item","price":123,"category":"fashion-lifestyle","brand":"Acme","moq":10}]'
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Preview count: {jsonPreviewCount}</div>
                      <Button onClick={submitJson} disabled={bulkLoading}>
                        {bulkLoading ? "Submitting..." : "Create Products"}
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="csv" className="mt-4">
                  <div className="flex flex-col gap-3">
                    <Label htmlFor="csv">CSV file</Label>
                    <Input
                      id="csv"
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => onCsvUpload(e.target.files?.[0] || null)}
                    />
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        {csvFileName ? `${csvFileName} (${csvProducts.length} rows)` : "Expected headers: name, price, category, brand, moq, margin, image"}
                      </div>
                      <Button onClick={() => submitProducts(csvProducts)} disabled={bulkLoading || csvProducts.length === 0}>
                        <Upload className="mr-2 h-4 w-4" />
                        {bulkLoading ? "Submitting..." : "Create Products"}
                      </Button>
                    </div>
                    {csvProducts.length ? (
                      <div className="rounded-md border bg-white p-3 text-xs text-gray-700">
                        <div className="mb-2 font-medium text-gray-900">Preview (first 3)</div>
                        <pre className="whitespace-pre-wrap">{JSON.stringify(csvProducts.slice(0, 3), null, 2)}</pre>
                      </div>
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>

              {bulkResult ? (
                <div className="rounded-md border bg-white p-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <Badge variant="success">Created: {bulkResult.created?.length || 0}</Badge>
                    <Badge variant="destructive">Rejected: {bulkResult.rejected?.length || 0}</Badge>
                  </div>
                  {bulkResult.rejected?.length ? (
                    <div className="mt-3 text-xs text-gray-700">
                      <div className="mb-1 font-medium text-gray-900">Rejected items</div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap">
                        {JSON.stringify(bulkResult.rejected.slice(0, 20), null, 2)}
                      </pre>
                      {bulkResult.rejected.length > 20 ? (
                        <div className="mt-2 text-xs text-gray-500">Showing first 20 rejections.</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
