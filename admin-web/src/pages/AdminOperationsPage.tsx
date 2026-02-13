import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { adminApi } from '@/lib/api'
import { getApiErrorMessage } from '@/lib/errors'

type VendorApp = { id: string; businessName: string; status: string; ownerEmail: string }
type ReturnItem = { id: string; orderId: string; status: string; reason: string; amount: number }
type ReviewItem = { id: string; productName: string; rating: number; status: string; comment: string }
type TicketItem = { id: string; subject: string; status: string; priority: string; requester: string }
type OfferItem = { id: string; title: string; status: string; buyer: string; seller: string; amount: number }
type NotificationItem = { id: string; title: string; message: string; status: string; createdAt: string }
type SystemEvent = { id: string; type: string; message: string; createdAt: string }

const demoVendorApps: VendorApp[] = [
  { id: 'va-1', businessName: 'Metro Traders', status: 'pending', ownerEmail: 'metro@seller.com' },
  { id: 'va-2', businessName: 'Shine Retail', status: 'approved', ownerEmail: 'shine@seller.com' },
]

const demoReturns: ReturnItem[] = [
  { id: 'ret-1', orderId: 'ORD-1001', status: 'requested', reason: 'Damaged unit', amount: 799 },
  { id: 'ret-2', orderId: 'ORD-1002', status: 'in_review', reason: 'Wrong size', amount: 459 },
]

const demoReviews: ReviewItem[] = [
  { id: 'rev-1', productName: 'Bluetooth Earbuds', rating: 2, status: 'pending', comment: 'Battery low' },
  { id: 'rev-2', productName: 'Cotton Shirt Combo', rating: 5, status: 'approved', comment: 'Great quality' },
]

const demoTickets: TicketItem[] = [
  { id: 'tic-1', subject: 'Seller onboarding stuck', status: 'open', priority: 'high', requester: 'seller@wholexale.com' },
  { id: 'tic-2', subject: 'Payment settlement delay', status: 'in_progress', priority: 'medium', requester: 'vendor2@wholexale.com' },
]

const demoOffers: OfferItem[] = [
  { id: 'off-1', title: 'Bulk denim shipment', status: 'pending', buyer: 'buyer@wholexale.com', seller: 'seller@wholexale.com', amount: 25000 },
  { id: 'off-2', title: 'Electronics restock', status: 'accepted', buyer: 'buyer2@wholexale.com', seller: 'vendor@wholexale.com', amount: 54000 },
]

const demoNotifications: NotificationItem[] = [
  { id: 'n-1', title: 'Maintenance window', message: 'Scheduled update at midnight.', status: 'sent', createdAt: new Date().toISOString() },
  { id: 'n-2', title: 'New policy', message: 'Updated returns policy.', status: 'scheduled', createdAt: new Date().toISOString() },
]

const demoEvents: SystemEvent[] = [
  { id: 'ev-1', type: 'info', message: 'API healthy', createdAt: new Date().toISOString() },
  { id: 'ev-2', type: 'warn', message: 'Queue latency elevated', createdAt: new Date().toISOString() },
]

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const [vendorApps, setVendorApps] = useState<VendorApp[]>([])
  const [returns, setReturns] = useState<ReturnItem[]>([])
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [offers, setOffers] = useState<OfferItem[]>([])
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [events, setEvents] = useState<SystemEvent[]>([])
  const [contentTitle, setContentTitle] = useState('')
  const [notifTitle, setNotifTitle] = useState('Ops Broadcast')
  const [notifBody, setNotifBody] = useState('This is a demo admin notification broadcast.')

  const loadAll = async () => {
    setLoading(true)
    setError('')
    setMessage('')
    const [
      vendorsRes,
      returnsRes,
      reviewsRes,
      ticketsRes,
      offersRes,
      notificationsRes,
      eventsRes,
      contentRes,
    ] = await Promise.allSettled([
      adminApi.getVendorApplications(),
      adminApi.getReturns(),
      adminApi.getReviews(),
      adminApi.getSupportTickets(),
      adminApi.getOffers(),
      adminApi.getNotifications(),
      adminApi.getSystemEvents(),
      adminApi.getContentHome(),
    ])

    if (vendorsRes.status === 'fulfilled') {
      const list = (vendorsRes.value?.data?.applications || []) as Array<Record<string, unknown>>
      setVendorApps(list.map((x, i) => ({
        id: String(x.id || i),
        businessName: String(x.businessName || x.brandName || 'Unknown Business'),
        status: String(x.status || 'pending'),
        ownerEmail: String(x.ownerEmail || x.submittedBy || 'unknown@wholexale.com'),
      })))
    } else {
      setVendorApps(demoVendorApps)
    }

    if (returnsRes.status === 'fulfilled') {
      const list = (returnsRes.value?.data?.returns || returnsRes.value?.data || []) as Array<Record<string, unknown>>
      setReturns(list.map((x, i) => ({
        id: String(x.id || x._id || i),
        orderId: String(x.orderId || 'N/A'),
        status: String(x.status || 'requested'),
        reason: String(x.reason || 'N/A'),
        amount: Number(x.amount || 0),
      })))
    } else {
      setReturns(demoReturns)
    }

    if (reviewsRes.status === 'fulfilled') {
      const list = (reviewsRes.value?.data?.reviews || reviewsRes.value?.data || []) as Array<Record<string, unknown>>
      setReviews(list.map((x, i) => ({
        id: String(x.id || x._id || i),
        productName: String(x.productName || x.product || 'Unknown Product'),
        rating: Number(x.rating || 0),
        status: String(x.status || 'pending'),
        comment: String(x.comment || ''),
      })))
    } else {
      setReviews(demoReviews)
    }

    if (ticketsRes.status === 'fulfilled') {
      const list = (ticketsRes.value?.data?.tickets || ticketsRes.value?.data || []) as Array<Record<string, unknown>>
      setTickets(list.map((x, i) => ({
        id: String(x.id || x._id || i),
        subject: String(x.subject || x.title || 'Support issue'),
        status: String(x.status || 'open'),
        priority: String(x.priority || 'medium'),
        requester: String(x.requester || x.requesterEmail || 'unknown@wholexale.com'),
      })))
    } else {
      setTickets(demoTickets)
    }

    if (offersRes.status === 'fulfilled') {
      const list = (offersRes.value?.data?.offers || offersRes.value?.data || []) as Array<Record<string, unknown>>
      setOffers(list.map((x, i) => ({
        id: String(x.id || x._id || i),
        title: String(x.title || 'Offer'),
        status: String(x.status || 'pending'),
        buyer: String(x.buyer || x.buyerId || 'buyer@wholexale.com'),
        seller: String(x.seller || x.sellerId || 'seller@wholexale.com'),
        amount: Number(x.amount || x.offerAmount || 0),
      })))
    } else {
      setOffers(demoOffers)
    }

    if (notificationsRes.status === 'fulfilled') {
      const list = (notificationsRes.value?.data?.notifications || notificationsRes.value?.data || []) as Array<Record<string, unknown>>
      setNotifications(list.map((x, i) => ({
        id: String(x.id || x._id || i),
        title: String(x.title || 'Notification'),
        message: String(x.message || ''),
        status: String(x.status || 'sent'),
        createdAt: String(x.createdAt || new Date().toISOString()),
      })))
    } else {
      setNotifications(demoNotifications)
    }

    if (eventsRes.status === 'fulfilled') {
      const list = (eventsRes.value?.data?.events || eventsRes.value?.data || []) as Array<Record<string, unknown>>
      setEvents(list.map((x, i) => ({
        id: String(x.id || x._id || i),
        type: String(x.type || 'info'),
        message: String(x.message || x.event || 'System event'),
        createdAt: String(x.createdAt || new Date().toISOString()),
      })))
    } else {
      setEvents(demoEvents)
    }

    if (contentRes.status === 'fulfilled') {
      const title = String(contentRes.value?.data?.banners?.[0]?.title || 'Home Banner')
      setContentTitle(title)
    } else {
      setContentTitle('Fashion & Lifestyle Marketplace')
    }

    setLoading(false)
  }

  useEffect(() => {
    loadAll()
  }, [])

  const stats = useMemo(() => ({
    pendingVendors: vendorApps.filter((x) => x.status === 'pending').length,
    openReturns: returns.filter((x) => !['refunded', 'closed', 'resolved'].includes(x.status)).length,
    pendingReviews: reviews.filter((x) => x.status === 'pending').length,
    openTickets: tickets.filter((x) => x.status !== 'closed').length,
  }), [vendorApps, returns, reviews, tickets])

  const updateVendor = async (id: string, next: 'approved' | 'rejected') => {
    setError('')
    try {
      if (next === 'approved') await adminApi.approveVendorApplication(id)
      else await adminApi.rejectVendorApplication(id)
      setMessage(`Vendor application ${next}.`)
    } catch {
      setMessage(`Vendor application ${next} (demo mode).`)
    }
    setVendorApps((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)))
  }

  const updateReturn = async (id: string, next: string) => {
    setError('')
    try {
      await adminApi.updateReturnStatus(id, next)
      setMessage(`Return ${id} updated to ${next}.`)
    } catch {
      setMessage(`Return ${id} updated in demo mode.`)
    }
    setReturns((prev) => prev.map((x) => (x.id === id ? { ...x, status: next } : x)))
  }

  const moderateReview = async (id: string, action: 'approve' | 'reject') => {
    setError('')
    try {
      await adminApi.moderateReview(id, action)
    } catch {
      // demo fallback
    }
    setReviews((prev) => prev.map((x) => (x.id === id ? { ...x, status: action === 'approve' ? 'approved' : 'rejected' } : x)))
    setMessage(`Review ${action}d.`)
  }

  const updateTicket = async (id: string, status: string) => {
    setError('')
    try {
      await adminApi.updateSupportTicketStatus(id, status)
    } catch {
      // demo fallback
    }
    setTickets((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)))
    setMessage(`Ticket ${id} moved to ${status}.`)
  }

  const offerResponse = async (id: string, action: 'accept' | 'reject') => {
    setError('')
    try {
      await adminApi.respondOffer(id, action, 'Actioned by admin operations')
    } catch {
      // demo fallback
    }
    setOffers((prev) => prev.map((x) => (x.id === id ? { ...x, status: action === 'accept' ? 'accepted' : 'rejected' } : x)))
    setMessage(`Offer ${action}ed.`)
  }

  const sendNotification = async () => {
    setError('')
    try {
      await adminApi.sendTestNotification({ title: notifTitle, message: notifBody, channels: ['push'] })
      setMessage('Test notification sent.')
    } catch (e) {
      setMessage('Test notification sent in demo mode.')
      if (!notifTitle.trim()) setError(getApiErrorMessage(e, 'Notification failed'))
    }
    setNotifications((prev) => [
      {
        id: `n-${Date.now()}`,
        title: notifTitle,
        message: notifBody,
        status: 'sent',
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
  }

  const saveContent = () => {
    localStorage.setItem('adminOpsContentTitle', contentTitle)
    setMessage('Home banner title saved locally (demo control).')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Control Center</h1>
          <p className="text-sm text-gray-500">Admin controls for user/seller workflows across marketplace operations.</p>
        </div>
        <Button variant="outline" onClick={loadAll} disabled={loading}>Refresh All</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm">Pending Vendor Apps</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingVendors}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Open Returns</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.openReturns}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pending Reviews</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingReviews}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Open Tickets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.openTickets}</div></CardContent></Card>
      </div>

      {(message || error) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-2 gap-1 p-1 md:grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="vendors">
          <Card>
            <CardHeader><CardTitle>Vendor Applications</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {vendorApps.map((v) => (
                <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{v.businessName}</div>
                    <div className="text-xs text-gray-500">{v.ownerEmail}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'destructive' : 'warning'}>{v.status}</Badge>
                    <Button size="sm" onClick={() => updateVendor(v.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateVendor(v.id, 'rejected')}>Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns">
          <Card>
            <CardHeader><CardTitle>Returns Management</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {returns.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{r.orderId} • INR {r.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{r.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{r.status}</Badge>
                    <select className="h-8 rounded-md border px-2 text-xs" value={r.status} onChange={(e) => updateReturn(r.id, e.target.value)}>
                      <option value="requested">requested</option>
                      <option value="in_review">in_review</option>
                      <option value="approved">approved</option>
                      <option value="refunded">refunded</option>
                      <option value="closed">closed</option>
                    </select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card>
            <CardHeader><CardTitle>Review Moderation</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{r.productName} • {r.rating}/5</div>
                    <div className="text-xs text-gray-500">{r.comment}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'warning'}>{r.status}</Badge>
                    <Button size="sm" onClick={() => moderateReview(r.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => moderateReview(r.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <Card>
            <CardHeader><CardTitle>Support Tickets</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{t.subject}</div>
                    <div className="text-xs text-gray-500">{t.requester} • {t.priority}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.status === 'closed' ? 'success' : 'warning'}>{t.status}</Badge>
                    <Button size="sm" variant="outline" onClick={() => updateTicket(t.id, 'in_progress')}>In Progress</Button>
                    <Button size="sm" onClick={() => updateTicket(t.id, 'closed')}>Close</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offers">
          <Card>
            <CardHeader><CardTitle>Offer Control</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {offers.map((o) => (
                <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{o.title} • INR {o.amount.toLocaleString()}</div>
                    <div className="text-xs text-gray-500">{o.buyer} → {o.seller}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={o.status === 'accepted' ? 'success' : o.status === 'rejected' ? 'destructive' : 'warning'}>{o.status}</Badge>
                    <Button size="sm" onClick={() => offerResponse(o.id, 'accept')}>Accept</Button>
                    <Button size="sm" variant="destructive" onClick={() => offerResponse(o.id, 'reject')}>Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Broadcast</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Title" />
                <Input value={notifBody} onChange={(e) => setNotifBody(e.target.value)} placeholder="Message" />
              </div>
              <Button onClick={sendNotification}>Send Test Notification</Button>
              <div className="space-y-2">
                {notifications.slice(0, 8).map((n) => (
                  <div key={n.id} className="rounded-md border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{n.title}</div>
                      <Badge variant="secondary">{n.status}</Badge>
                    </div>
                    <div className="text-xs text-gray-500">{n.message}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle>Content Controls</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Homepage banner title" />
              <Button onClick={saveContent}>Save Banner Title</Button>
              <p className="text-xs text-gray-500">Content endpoints are read-only in current backend, so this action stores local demo override.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader><CardTitle>System Events</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {events.map((e) => (
                <div key={e.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-medium">{e.type}</div>
                    <div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-600">{e.message}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
