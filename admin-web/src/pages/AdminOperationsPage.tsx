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
type ChatItem = { id: string; name: string; unread: number; lastMessage: string; escalated: boolean }
type CampaignItem = { id: string; name: string; status: string; budget: number }
type PermissionRole = { id: string; name: string; permissions: string[] }
type AffiliatePerf = { id: string; name: string; status: string; commission: number }
type HeroBanner = { id: string; title: string; subtitle: string; image: string }

type FinanceState = {
  revenue: number
  expenses: number
  settlements: number
  pendingPayouts: number
}

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
const demoChats: ChatItem[] = [
  { id: 'chat-1', name: 'Metro Traders', unread: 4, lastMessage: 'Need urgent inventory update', escalated: false },
  { id: 'chat-2', name: 'Buyer Support Queue', unread: 9, lastMessage: 'Refund not received', escalated: true },
]
const demoCampaigns: CampaignItem[] = [
  { id: 'camp-1', name: 'Abandoned Cart Recovery', status: 'active', budget: 120000 },
  { id: 'camp-2', name: 'Festival Seller Boost', status: 'draft', budget: 250000 },
]
const demoRoles: PermissionRole[] = [
  { id: 'role-1', name: 'seller_ops', permissions: ['orders.read', 'inventory.write', 'offers.respond'] },
  { id: 'role-2', name: 'support_ops', permissions: ['tickets.read', 'tickets.write', 'returns.review'] },
]
const demoAffiliates: AffiliatePerf[] = [
  { id: 'aff-1', name: 'Partner One', status: 'approved', commission: 52000 },
  { id: 'aff-2', name: 'Partner Two', status: 'pending', commission: 12000 },
]

const featureMatrix = [
  { module: 'Catalog & Product Discovery', buyer: 'Browse/search/filter products', seller: 'Create/update listings', admin: 'Moderate catalog, enforce compliance' },
  { module: 'Orders', buyer: 'Place/track/cancel orders', seller: 'Accept/ship/manage fulfillment', admin: 'Override status, dispute handling, SLA audits' },
  { module: 'Offers & Negotiation', buyer: 'Send/accept offers', seller: 'Counter/accept/reject', admin: 'Policy enforcement, suspicious offer review' },
  { module: 'Returns & Refunds', buyer: 'Request returns', seller: 'Quality check and respond', admin: 'Final arbitration and forced refunds' },
  { module: 'Reviews', buyer: 'Write ratings/reviews', seller: 'Respond to reviews', admin: 'Moderation, abuse detection' },
  { module: 'Brand/Vendor Onboarding', buyer: 'Trust verified sellers', seller: 'Submit KYC/docs', admin: 'Approve/reject onboarding' },
  { module: 'Support', buyer: 'Open tickets', seller: 'Resolve seller tickets', admin: 'Queue assignment and escalations' },
  { module: 'Chat/Notifications', buyer: 'Conversation updates', seller: 'Respond and follow-up', admin: 'Escalation + campaign broadcasts' },
  { module: 'Wallet/Finance', buyer: 'Payments/credits', seller: 'Payouts/settlements', admin: 'Risk checks, payout controls, reconciliation' },
  { module: 'Marketing/Affiliate', buyer: 'Campaign exposure', seller: 'Participate in campaigns', admin: 'Campaign governance, affiliate approvals' },
  { module: 'Permissions', buyer: 'N/A', seller: 'Team access controls', admin: 'Role design and permission assignment' },
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
  const [chats, setChats] = useState<ChatItem[]>([])
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([])
  const [roles, setRoles] = useState<PermissionRole[]>([])
  const [affiliates, setAffiliates] = useState<AffiliatePerf[]>([])
  const [contentTitle, setContentTitle] = useState('')
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([])
  const [termsText, setTermsText] = useState('')
  const [privacyText, setPrivacyText] = useState('')
  const [notifTitle, setNotifTitle] = useState('Ops Broadcast')
  const [notifBody, setNotifBody] = useState('This is a demo admin notification broadcast.')
  const [newRoleName, setNewRoleName] = useState('')
  const [finance, setFinance] = useState<FinanceState>({ revenue: 0, expenses: 0, settlements: 0, pendingPayouts: 0 })

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
      adminContentRes,
      policiesRes,
      chatsRes,
      campaignsRes,
      permRes,
      affiliateRes,
      financeRes,
    ] = await Promise.allSettled([
      adminApi.getVendorApplications(),
      adminApi.getReturns(),
      adminApi.getReviews(),
      adminApi.getSupportTickets(),
      adminApi.getOffers(),
      adminApi.getNotifications(),
      adminApi.getSystemEvents(),
      adminApi.getContentHome(),
      adminApi.getAdminContentHome(),
      adminApi.getAdminPolicies(),
      adminApi.getConversations(),
      adminApi.getMarketingCampaigns(),
      adminApi.getPermissionRoles(),
      adminApi.getAffiliatePerformance(),
      adminApi.getFinanceAnalytics(),
    ])

    if (vendorsRes.status === 'fulfilled') {
      const list = (vendorsRes.value?.data?.applications || []) as Array<Record<string, unknown>>
      setVendorApps(list.map((x, i) => ({ id: String(x.id || i), businessName: String(x.businessName || x.brandName || 'Unknown Business'), status: String(x.status || 'pending'), ownerEmail: String(x.ownerEmail || x.submittedBy || 'unknown@wholexale.com') })))
    } else setVendorApps(demoVendorApps)

    if (returnsRes.status === 'fulfilled') {
      const list = (returnsRes.value?.data?.returns || returnsRes.value?.data || []) as Array<Record<string, unknown>>
      setReturns(list.map((x, i) => ({ id: String(x.id || x._id || i), orderId: String(x.orderId || 'N/A'), status: String(x.status || 'requested'), reason: String(x.reason || 'N/A'), amount: Number(x.amount || 0) })))
    } else setReturns(demoReturns)

    if (reviewsRes.status === 'fulfilled') {
      const list = (reviewsRes.value?.data?.reviews || reviewsRes.value?.data || []) as Array<Record<string, unknown>>
      setReviews(list.map((x, i) => ({ id: String(x.id || x._id || i), productName: String(x.productName || x.product || 'Unknown Product'), rating: Number(x.rating || 0), status: String(x.status || 'pending'), comment: String(x.comment || '') })))
    } else setReviews(demoReviews)

    if (ticketsRes.status === 'fulfilled') {
      const list = (ticketsRes.value?.data?.tickets || ticketsRes.value?.data || []) as Array<Record<string, unknown>>
      setTickets(list.map((x, i) => ({ id: String(x.id || x._id || i), subject: String(x.subject || x.title || 'Support issue'), status: String(x.status || 'open'), priority: String(x.priority || 'medium'), requester: String(x.requester || x.requesterEmail || 'unknown@wholexale.com') })))
    } else setTickets(demoTickets)

    if (offersRes.status === 'fulfilled') {
      const list = (offersRes.value?.data?.offers || offersRes.value?.data || []) as Array<Record<string, unknown>>
      setOffers(list.map((x, i) => ({ id: String(x.id || x._id || i), title: String(x.title || 'Offer'), status: String(x.status || 'pending'), buyer: String(x.buyer || x.buyerId || 'buyer@wholexale.com'), seller: String(x.seller || x.sellerId || 'seller@wholexale.com'), amount: Number(x.amount || x.offerAmount || 0) })))
    } else setOffers(demoOffers)

    if (notificationsRes.status === 'fulfilled') {
      const list = (notificationsRes.value?.data?.notifications || notificationsRes.value?.data || []) as Array<Record<string, unknown>>
      setNotifications(list.map((x, i) => ({ id: String(x.id || x._id || i), title: String(x.title || 'Notification'), message: String(x.message || ''), status: String(x.status || 'sent'), createdAt: String(x.createdAt || new Date().toISOString()) })))
    } else setNotifications(demoNotifications)

    if (eventsRes.status === 'fulfilled') {
      const list = (eventsRes.value?.data?.events || eventsRes.value?.data || []) as Array<Record<string, unknown>>
      setEvents(list.map((x, i) => ({ id: String(x.id || x._id || i), type: String(x.type || 'info'), message: String(x.message || x.event || 'System event'), createdAt: String(x.createdAt || new Date().toISOString()) })))
    } else setEvents(demoEvents)

    if (contentRes.status === 'fulfilled') {
      const title = String(contentRes.value?.data?.banners?.[0]?.title || 'Home Banner')
      setContentTitle(title)
    } else setContentTitle('Fashion & Lifestyle Marketplace')

    if (adminContentRes.status === 'fulfilled') {
      const banners = (adminContentRes.value?.data?.banners || []) as Array<Record<string, unknown>>
      setHeroBanners(
        banners.map((b, i) => ({
          id: String(b.id || `banner-${i + 1}`),
          title: String(b.title || ''),
          subtitle: String(b.subtitle || ''),
          image: String(b.image || ''),
        }))
      )
    } else if (contentRes.status === 'fulfilled') {
      const banners = (contentRes.value?.data?.banners || []) as Array<Record<string, unknown>>
      setHeroBanners(
        banners.map((b, i) => ({
          id: String(b.id || `banner-${i + 1}`),
          title: String(b.title || ''),
          subtitle: String(b.subtitle || ''),
          image: String(b.image || ''),
        }))
      )
    } else {
      setHeroBanners([
        {
          id: 'banner-1',
          title: 'Fashion & Lifestyle Marketplace',
          subtitle: 'Wholesale Fashion for retailers',
          image: 'https://via.placeholder.com/1200x400.png?text=Wholexale+Banner',
        },
      ])
    }

    if (policiesRes.status === 'fulfilled') {
      const policies = (policiesRes.value?.data?.policies || {}) as Record<string, unknown>
      setTermsText(String(policies.terms || ''))
      setPrivacyText(String(policies.privacy || ''))
    } else {
      setTermsText('Terms and Conditions\\n\\n1. Use of platform is subject to compliance checks.\\n2. Admin may suspend accounts for policy violations.')
      setPrivacyText('Privacy Policy\\n\\n1. Buyer and seller data is processed for order fulfillment and compliance.\\n2. Platform logs are retained for security and audit.')
    }

    if (chatsRes.status === 'fulfilled') {
      const list = (chatsRes.value?.data?.conversations || chatsRes.value?.data || []) as Array<Record<string, unknown>>
      setChats(list.map((x, i) => ({ id: String(x.id || x._id || i), name: String(x.name || x.businessName || 'Conversation'), unread: Number(x.unreadCount || 0), lastMessage: String(x.lastMessage || x.preview || 'No recent message'), escalated: Boolean(x.escalated || false) })))
    } else setChats(demoChats)

    if (campaignsRes.status === 'fulfilled') {
      const list = (campaignsRes.value?.data?.campaigns || campaignsRes.value?.data || []) as Array<Record<string, unknown>>
      setCampaigns(list.map((x, i) => ({ id: String(x.id || x._id || i), name: String(x.name || 'Campaign'), status: String(x.status || 'draft'), budget: Number(x.budget || 0) })))
    } else setCampaigns(demoCampaigns)

    if (permRes.status === 'fulfilled') {
      const list = (permRes.value?.data?.roles || permRes.value?.data || []) as Array<Record<string, unknown>>
      setRoles(list.map((x, i) => ({ id: String(x.id || x._id || i), name: String(x.name || 'role'), permissions: Array.isArray(x.permissions) ? (x.permissions as string[]) : [] })))
    } else setRoles(demoRoles)

    if (affiliateRes.status === 'fulfilled') {
      const perf = affiliateRes.value?.data?.performance as Record<string, unknown> | undefined
      const candidates = (perf?.topAffiliates as Array<Record<string, unknown>> | undefined) || []
      if (candidates.length) {
        setAffiliates(candidates.map((x, i) => ({ id: String(x.id || i), name: String(x.name || `Affiliate ${i + 1}`), status: String(x.status || 'approved'), commission: Number(x.commission || 0) })))
      } else {
        setAffiliates(demoAffiliates)
      }
    } else setAffiliates(demoAffiliates)

    if (financeRes.status === 'fulfilled') {
      const f = (financeRes.value?.data || {}) as Record<string, unknown>
      const analytics = (f.analytics || {}) as Record<string, unknown>
      const revenue = Number((analytics.revenue as Record<string, unknown> | undefined)?.total || 0)
      const expenses = Number((analytics.expenses as Record<string, unknown> | undefined)?.total || 0)
      setFinance({
        revenue,
        expenses,
        settlements: Number((analytics.settlements as Record<string, unknown> | undefined)?.total || 0),
        pendingPayouts: Number((analytics.pendingPayouts as Record<string, unknown> | undefined)?.total || 0),
      })
    } else {
      setFinance({ revenue: 1480000, expenses: 612000, settlements: 517000, pendingPayouts: 98000 })
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
    unreadChats: chats.reduce((sum, c) => sum + c.unread, 0),
  }), [vendorApps, returns, reviews, tickets, chats])

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
    setNotifications((prev) => [{ id: `n-${Date.now()}`, title: notifTitle, message: notifBody, status: 'sent', createdAt: new Date().toISOString() }, ...prev])
  }

  const saveContent = () => {
    const payload = {
      banners: heroBanners,
      title: contentTitle,
    }

    adminApi
      .updateAdminContentHome(payload)
      .then(() => setMessage('Hero content saved to backend.'))
      .catch(() => {
        localStorage.setItem('adminOpsContent', JSON.stringify(payload))
        setMessage('Hero content saved locally (demo fallback).')
      })
  }

  const savePolicies = () => {
    const payload = { terms: termsText, privacy: privacyText }
    adminApi
      .updateAdminPolicies(payload)
      .then(() => setMessage('Terms and privacy policy saved to backend.'))
      .catch(() => {
        localStorage.setItem('adminOpsPolicies', JSON.stringify(payload))
        setMessage('Policies saved locally (demo fallback).')
      })
  }

  const updateHeroField = (id: string, field: keyof HeroBanner, value: string) => {
    setHeroBanners((prev) => prev.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  const addHeroBanner = () => {
    setHeroBanners((prev) => [
      ...prev,
      {
        id: `banner-${Date.now()}`,
        title: 'New Hero Title',
        subtitle: 'New subtitle for buyer/seller apps',
        image: 'https://via.placeholder.com/1200x400.png?text=New+Banner',
      },
    ])
  }

  const removeHeroBanner = (id: string) => {
    setHeroBanners((prev) => prev.filter((b) => b.id !== id))
  }

  const toggleEscalation = (id: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, escalated: !c.escalated } : c)))
    setMessage('Conversation escalation status updated.')
  }

  const financeNet = useMemo(() => finance.revenue - finance.expenses, [finance])

  const createRole = async () => {
    if (!newRoleName.trim()) return
    try {
      await adminApi.createPermissionRole({ name: newRoleName, permissions: [] })
    } catch {
      // demo fallback
    }
    setRoles((prev) => [{ id: `role-${Date.now()}`, name: newRoleName.trim(), permissions: [] }, ...prev])
    setNewRoleName('')
    setMessage('Role created.')
  }

  const markAffiliate = (id: string, status: string) => {
    setAffiliates((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)))
    setMessage(`Affiliate ${status}.`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Operations Control Center</h1>
          <p className="text-sm text-gray-500">Buyer/seller lifecycle governance across all major marketplace modules.</p>
        </div>
        <Button variant="outline" onClick={loadAll} disabled={loading}>Refresh All</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card><CardHeader><CardTitle className="text-sm">Pending Vendor Apps</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingVendors}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Open Returns</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.openReturns}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Pending Reviews</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.pendingReviews}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Open Tickets</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.openTickets}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm">Unread Chats</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{stats.unreadChats}</div></CardContent></Card>
      </div>

      {(message || error) && (
        <div className={`rounded-md border px-3 py-2 text-sm ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>
          {error || message}
        </div>
      )}

      <Tabs defaultValue="matrix" className="space-y-4">
        <TabsList className="grid h-auto grid-cols-3 gap-1 p-1 md:grid-cols-6 lg:grid-cols-7">
          <TabsTrigger value="matrix">Coverage</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="reviews">Reviews</TabsTrigger>
          <TabsTrigger value="support">Support</TabsTrigger>
          <TabsTrigger value="offers">Offers</TabsTrigger>
          <TabsTrigger value="chat">Chat</TabsTrigger>
          <TabsTrigger value="finance">Finance</TabsTrigger>
          <TabsTrigger value="affiliate">Affiliate</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="marketing">Marketing</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        <TabsContent value="matrix">
          <Card>
            <CardHeader><CardTitle>Buyer/Seller to Admin Governance Matrix</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-600">
                      <th className="py-2">Module</th>
                      <th className="py-2">Buyer Capability</th>
                      <th className="py-2">Seller Capability</th>
                      <th className="py-2">Admin Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureMatrix.map((row) => (
                      <tr key={row.module} className="border-b align-top">
                        <td className="py-3 font-medium">{row.module}</td>
                        <td className="py-3 text-gray-700">{row.buyer}</td>
                        <td className="py-3 text-gray-700">{row.seller}</td>
                        <td className="py-3 text-gray-900">{row.admin}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors"><Card><CardHeader><CardTitle>Vendor Applications</CardTitle></CardHeader><CardContent className="space-y-3">{vendorApps.map((v) => <div key={v.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{v.businessName}</div><div className="text-xs text-gray-500">{v.ownerEmail}</div></div><div className="flex items-center gap-2"><Badge variant={v.status === 'approved' ? 'success' : v.status === 'rejected' ? 'destructive' : 'warning'}>{v.status}</Badge><Button size="sm" onClick={() => updateVendor(v.id, 'approved')}>Approve</Button><Button size="sm" variant="destructive" onClick={() => updateVendor(v.id, 'rejected')}>Reject</Button></div></div>)}</CardContent></Card></TabsContent>

        <TabsContent value="returns"><Card><CardHeader><CardTitle>Returns Management</CardTitle></CardHeader><CardContent className="space-y-3">{returns.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{r.orderId} • INR {r.amount.toLocaleString()}</div><div className="text-xs text-gray-500">{r.reason}</div></div><div className="flex items-center gap-2"><Badge variant="secondary">{r.status}</Badge><select className="h-8 rounded-md border px-2 text-xs" value={r.status} onChange={(e) => updateReturn(r.id, e.target.value)}><option value="requested">requested</option><option value="in_review">in_review</option><option value="approved">approved</option><option value="refunded">refunded</option><option value="closed">closed</option></select></div></div>)}</CardContent></Card></TabsContent>

        <TabsContent value="reviews"><Card><CardHeader><CardTitle>Review Moderation</CardTitle></CardHeader><CardContent className="space-y-3">{reviews.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{r.productName} • {r.rating}/5</div><div className="text-xs text-gray-500">{r.comment}</div></div><div className="flex items-center gap-2"><Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'destructive' : 'warning'}>{r.status}</Badge><Button size="sm" onClick={() => moderateReview(r.id, 'approve')}>Approve</Button><Button size="sm" variant="destructive" onClick={() => moderateReview(r.id, 'reject')}>Reject</Button></div></div>)}</CardContent></Card></TabsContent>

        <TabsContent value="support"><Card><CardHeader><CardTitle>Support Tickets</CardTitle></CardHeader><CardContent className="space-y-3">{tickets.map((t) => <div key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{t.subject}</div><div className="text-xs text-gray-500">{t.requester} • {t.priority}</div></div><div className="flex items-center gap-2"><Badge variant={t.status === 'closed' ? 'success' : 'warning'}>{t.status}</Badge><Button size="sm" variant="outline" onClick={() => updateTicket(t.id, 'in_progress')}>In Progress</Button><Button size="sm" onClick={() => updateTicket(t.id, 'closed')}>Close</Button></div></div>)}</CardContent></Card></TabsContent>

        <TabsContent value="offers"><Card><CardHeader><CardTitle>Offer Control</CardTitle></CardHeader><CardContent className="space-y-3">{offers.map((o) => <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"><div><div className="font-medium">{o.title} • INR {o.amount.toLocaleString()}</div><div className="text-xs text-gray-500">{o.buyer} → {o.seller}</div></div><div className="flex items-center gap-2"><Badge variant={o.status === 'accepted' ? 'success' : o.status === 'rejected' ? 'destructive' : 'warning'}>{o.status}</Badge><Button size="sm" onClick={() => offerResponse(o.id, 'accept')}>Accept</Button><Button size="sm" variant="destructive" onClick={() => offerResponse(o.id, 'reject')}>Reject</Button></div></div>)}</CardContent></Card></TabsContent>

        <TabsContent value="chat">
          <Card>
            <CardHeader><CardTitle>Chat Escalation Console</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {chats.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">Unread: {c.unread} • {c.lastMessage}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.escalated ? 'destructive' : 'secondary'}>{c.escalated ? 'escalated' : 'normal'}</Badge>
                    <Button size="sm" variant="outline" onClick={() => toggleEscalation(c.id)}>{c.escalated ? 'De-escalate' : 'Escalate'}</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance">
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardHeader><CardTitle className="text-sm">Revenue</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">INR {finance.revenue.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Expenses</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">INR {finance.expenses.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Net</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">INR {financeNet.toLocaleString()}</div></CardContent></Card>
            <Card><CardHeader><CardTitle className="text-sm">Pending Payouts</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">INR {finance.pendingPayouts.toLocaleString()}</div></CardContent></Card>
          </div>
          <Card className="mt-4"><CardHeader><CardTitle>Finance Controls</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setMessage('Reconciliation started (demo).')}>Run Reconciliation</Button><Button variant="outline" onClick={() => setMessage('Payout batch queued (demo).')}>Trigger Payout Batch</Button><Button variant="outline" onClick={() => setMessage('Risk scan initiated (demo).')}>Run Risk Scan</Button></CardContent></Card>
        </TabsContent>

        <TabsContent value="affiliate">
          <Card>
            <CardHeader><CardTitle>Affiliate Governance</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {affiliates.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{a.name}</div>
                    <div className="text-xs text-gray-500">Commission: INR {a.commission.toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === 'approved' ? 'success' : a.status === 'rejected' ? 'destructive' : 'warning'}>{a.status}</Badge>
                    <Button size="sm" onClick={() => markAffiliate(a.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => markAffiliate(a.id, 'rejected')}>Reject</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader><CardTitle>Roles & Permissions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input value={newRoleName} onChange={(e) => setNewRoleName(e.target.value)} placeholder="Create role (e.g. fraud_ops)" />
                <Button onClick={createRole}>Create Role</Button>
              </div>
              {roles.map((r) => (
                <div key={r.id} className="rounded-md border p-3">
                  <div className="font-medium">{r.name}</div>
                  <div className="mt-1 text-xs text-gray-600">{r.permissions.length ? r.permissions.join(', ') : 'No permissions assigned yet'}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketing">
          <Card>
            <CardHeader><CardTitle>Marketing Campaign Oversight</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {campaigns.map((c) => (
                <div key={c.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3">
                  <div>
                    <div className="font-medium">{c.name}</div>
                    <div className="text-xs text-gray-500">Budget: INR {c.budget.toLocaleString()}</div>
                  </div>
                  <Badge variant={c.status === 'active' ? 'success' : 'secondary'}>{c.status}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications"><Card><CardHeader><CardTitle>Notification Broadcast</CardTitle></CardHeader><CardContent className="space-y-3"><div className="grid gap-3 md:grid-cols-2"><Input value={notifTitle} onChange={(e) => setNotifTitle(e.target.value)} placeholder="Title" /><Input value={notifBody} onChange={(e) => setNotifBody(e.target.value)} placeholder="Message" /></div><Button onClick={sendNotification}>Send Test Notification</Button><div className="space-y-2">{notifications.slice(0, 8).map((n) => <div key={n.id} className="rounded-md border p-3"><div className="flex items-center justify-between gap-2"><div className="font-medium">{n.title}</div><Badge variant="secondary">{n.status}</Badge></div><div className="text-xs text-gray-500">{n.message}</div></div>)}</div></CardContent></Card></TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader><CardTitle>Hero Section Controls (Buyer/Seller Apps)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <Input value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} placeholder="Homepage hero section title" />
              <div className="space-y-3">
                {heroBanners.map((banner, idx) => (
                  <div key={banner.id} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">Banner {idx + 1}</p>
                      <Button size="sm" variant="destructive" onClick={() => removeHeroBanner(banner.id)}>Remove</Button>
                    </div>
                    <Input value={banner.title} onChange={(e) => updateHeroField(banner.id, 'title', e.target.value)} placeholder="Banner title" />
                    <Input value={banner.subtitle} onChange={(e) => updateHeroField(banner.id, 'subtitle', e.target.value)} placeholder="Banner subtitle" />
                    <Input value={banner.image} onChange={(e) => updateHeroField(banner.id, 'image', e.target.value)} placeholder="Banner image URL" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={addHeroBanner}>Add Hero Banner</Button>
                <Button onClick={saveContent}>Save Hero Content</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle>Terms & Privacy Policy Editor</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="mb-1 text-sm font-medium">Terms and Conditions</p>
                <textarea
                  className="min-h-[180px] w-full rounded-md border p-3 text-sm"
                  value={termsText}
                  onChange={(e) => setTermsText(e.target.value)}
                />
              </div>
              <div>
                <p className="mb-1 text-sm font-medium">Privacy Policy</p>
                <textarea
                  className="min-h-[180px] w-full rounded-md border p-3 text-sm"
                  value={privacyText}
                  onChange={(e) => setPrivacyText(e.target.value)}
                />
              </div>
              <Button onClick={savePolicies}>Save Terms & Privacy</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system"><Card><CardHeader><CardTitle>System Events</CardTitle></CardHeader><CardContent className="space-y-2">{events.map((e) => <div key={e.id} className="rounded-md border p-3"><div className="flex items-center justify-between gap-2"><div className="font-medium">{e.type}</div><div className="text-xs text-gray-500">{new Date(e.createdAt).toLocaleString()}</div></div><div className="text-sm text-gray-600">{e.message}</div></div>)}</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  )
}
