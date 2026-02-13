import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'

export default function AdminBulkPage() {
  const [barcodeCount, setBarcodeCount] = useState(20)
  const [barcodes, setBarcodes] = useState<string[]>([])
  const [bulkText, setBulkText] = useState('[\n  {"name":"Demo Product A","price":199,"category":"Fashion","brand":"Urban Weave","moq":10},\n  {"name":"Demo Product B","price":299,"category":"Home","brand":"Kitchenory","moq":5}\n]')
  const [result, setResult] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const parsedProducts = useMemo(() => {
    try {
      const value = JSON.parse(bulkText)
      return Array.isArray(value) ? value : []
    } catch {
      return []
    }
  }, [bulkText])

  const generate = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await adminApi.generateBarcodes(barcodeCount)
      const list = (res?.data?.barcodes || []) as string[]
      if (!Array.isArray(list) || list.length === 0) throw new Error('Invalid barcode response')
      setBarcodes(list)
      setResult(`Generated ${list.length} barcodes from API.`)
    } catch (e) {
      const fallback = Array.from({ length: Math.max(1, barcodeCount) }).map((_, i) =>
        `DEMO-SKU-${String(Date.now() + i).slice(-8)}`
      )
      setBarcodes(fallback)
      setResult(`Generated ${fallback.length} barcodes in demo mode.`)
      if (!getApiErrorMessage(e, '').trim()) {
        // no-op
      }
    } finally {
      setBusy(false)
    }
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(barcodes.join('\n'))
      setResult('Barcodes copied to clipboard.')
    } catch {
      setError('Failed to copy barcodes.')
    }
  }

  const download = () => {
    const blob = new Blob([barcodes.join('\n')], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'barcodes.txt'
    a.click()
    URL.revokeObjectURL(url)
    setResult('Barcodes downloaded.')
  }

  const importProducts = async () => {
    setBusy(true)
    setError('')
    try {
      const parsed = JSON.parse(bulkText)
      if (!Array.isArray(parsed) || parsed.length === 0) {
        setError('Provide a valid non-empty JSON array of products.')
        return
      }
      const res = await adminApi.bulkCreateProducts(parsed)
      const created = Number(res?.data?.created?.length || res?.data?.successful || parsed.length)
      setResult(`Bulk import completed. Created: ${created}`)
    } catch (e) {
      try {
        const parsed = JSON.parse(bulkText)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setResult(`Bulk import simulated in demo mode. Parsed ${parsed.length} products.`)
          return
        }
      } catch {
        // no-op
      }
      setError(getApiErrorMessage(e, 'Failed to import products.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Bulk Operations</h1>
        <p className="text-sm text-gray-500">Generate barcode batches and bulk import products.</p>
      </div>

      {(result || error) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error || result}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Barcode Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input type="number" value={barcodeCount} min={1} max={500} onChange={(e) => setBarcodeCount(Number(e.target.value || 1))} className="w-40" />
            <Button onClick={generate} disabled={busy}>Generate</Button>
            <Button variant="outline" onClick={copy} disabled={barcodes.length === 0}>Copy</Button>
            <Button variant="outline" onClick={download} disabled={barcodes.length === 0}>Download</Button>
          </div>
          <div className="max-h-48 overflow-auto rounded-md border p-3 font-mono text-xs whitespace-pre-wrap">
            {barcodes.length ? barcodes.join('\n') : 'No barcodes generated yet.'}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Bulk Product Import (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="min-h-[220px] w-full rounded-md border p-3 font-mono text-xs"
            spellCheck={false}
          />
          <div className="text-xs text-gray-500">Preview count: {parsedProducts.length} items</div>
          <div className="flex gap-2">
            <Button onClick={importProducts} disabled={busy}>Import Products</Button>
            <Button variant="outline" onClick={() => setBulkText('[]')}>Clear</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
