import { useEffect, useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { adminApi } from '@/lib/api'

type Conversation = {
  id: string
  name: string
  unreadCount: number
  lastMessage: string
  updatedAt: string
  status: 'open' | 'pending' | 'escalated' | 'resolved'
}

type Message = {
  id: string
  sender: string
  content: string
  at: string
}

const demoConversations: Conversation[] = [
  {
    id: 'conv-1',
    name: 'Metro Traders',
    unreadCount: 4,
    lastMessage: 'Need urgent stock update for SKU-URBW-001',
    updatedAt: new Date(Date.now() - 120000).toISOString(),
    status: 'open',
  },
  {
    id: 'conv-2',
    name: 'Buyer Support Queue',
    unreadCount: 9,
    lastMessage: 'Refund still not credited to wallet',
    updatedAt: new Date(Date.now() - 240000).toISOString(),
    status: 'escalated',
  },
]

const demoMessages: Record<string, Message[]> = {
  'conv-1': [
    { id: 'm-1', sender: 'seller@metro.com', content: 'Can you expedite catalog review?', at: new Date(Date.now() - 900000).toISOString() },
    { id: 'm-2', sender: 'admin@wholexale.com', content: 'Yes, assigned to brand desk.', at: new Date(Date.now() - 600000).toISOString() },
    { id: 'm-3', sender: 'seller@metro.com', content: 'Need urgent stock update for SKU-URBW-001', at: new Date(Date.now() - 120000).toISOString() },
  ],
  'conv-2': [
    { id: 'm-4', sender: 'buyer@wholexale.com', content: 'Refund still not credited to wallet', at: new Date(Date.now() - 240000).toISOString() },
    { id: 'm-5', sender: 'support@wholexale.com', content: 'Investigating with finance team.', at: new Date(Date.now() - 120000).toISOString() },
  ],
}

export default function AdminChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [activeId, setActiveId] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [note, setNote] = useState('')

  const loadConversations = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getConversations()
      const list = (res?.data?.conversations || res?.data || []) as Array<Record<string, unknown>>
      const mapped = list.map((c, idx) => ({
        id: String(c.id || c._id || `conv-${idx}`),
        name: String(c.name || c.businessName || c.title || 'Conversation'),
        unreadCount: Number(c.unreadCount || c.unread || 0),
        lastMessage: String(c.lastMessage || c.preview || 'No recent message'),
        updatedAt: String(c.updatedAt || c.lastMessageAt || new Date().toISOString()),
        status: String(c.status || 'open') as Conversation['status'],
      }))
      setConversations(mapped)
      if (mapped[0]?.id) setActiveId((prev) => prev || mapped[0].id)
    } catch {
      setConversations(demoConversations)
      setMessages(demoMessages)
      setActiveId((prev) => prev || demoConversations[0].id)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()
  }, [])

  const loadMessages = async (conversationId: string) => {
    if (!conversationId) return
    if (messages[conversationId]) return
    try {
      const res = await adminApi.getConversationMessages(conversationId)
      const list = (res?.data?.messages || res?.data || []) as Array<Record<string, unknown>>
      setMessages((prev) => ({
        ...prev,
        [conversationId]: list.map((m, idx) => ({
          id: String(m.id || m._id || idx),
          sender: String(m.sender || m.senderEmail || m.user || 'unknown@wholexale.com'),
          content: String(m.content || m.text || ''),
          at: String(m.createdAt || m.at || new Date().toISOString()),
        })),
      }))
    } catch {
      setMessages((prev) => ({ ...prev, [conversationId]: demoMessages[conversationId] || [] }))
    }
  }

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return conversations.filter((c) =>
      !q || c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q)
    )
  }, [conversations, query])

  const activeConversation = conversations.find((c) => c.id === activeId) || null
  const activeMessages = messages[activeId] || []

  const updateStatus = (id: string, status: Conversation['status']) => {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)))
  }

  const addInternalNote = () => {
    if (!activeId || !note.trim()) return
    const msg: Message = {
      id: `note-${Date.now()}`,
      sender: 'admin-note@wholexale.com',
      content: `[Internal] ${note.trim()}`,
      at: new Date().toISOString(),
    }
    setMessages((prev) => ({ ...prev, [activeId]: [...(prev[activeId] || []), msg] }))
    setNote('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Chat Console</h1>
          <p className="text-sm text-gray-500">Monitor buyer/seller conversations, escalate issues, and add internal notes.</p>
        </div>
        <Button variant="outline" onClick={loadConversations} disabled={loading}>Refresh</Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Conversations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search conversations" />
            <div className="max-h-[580px] space-y-2 overflow-auto pr-1">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`w-full rounded-md border p-3 text-left transition-colors ${activeId === c.id ? 'border-primary bg-primary/5' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium text-sm">{c.name}</div>
                    {c.unreadCount > 0 && <Badge variant="warning">{c.unreadCount}</Badge>}
                  </div>
                  <div className="mt-1 text-xs text-gray-600 line-clamp-2">{c.lastMessage}</div>
                  <div className="mt-2 flex items-center justify-between">
                    <Badge variant={c.status === 'resolved' ? 'success' : c.status === 'escalated' ? 'destructive' : 'secondary'}>{c.status}</Badge>
                    <span className="text-[11px] text-gray-500">{new Date(c.updatedAt).toLocaleTimeString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Thread</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeConversation ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">{activeConversation.name}</Badge>
                  <Badge variant={activeConversation.status === 'resolved' ? 'success' : activeConversation.status === 'escalated' ? 'destructive' : 'secondary'}>
                    {activeConversation.status}
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(activeConversation.id, 'open')}>Mark Open</Button>
                  <Button size="sm" variant="outline" onClick={() => updateStatus(activeConversation.id, 'pending')}>Mark Pending</Button>
                  <Button size="sm" variant="destructive" onClick={() => updateStatus(activeConversation.id, 'escalated')}>Escalate</Button>
                  <Button size="sm" onClick={() => updateStatus(activeConversation.id, 'resolved')}>Resolve</Button>
                </div>

                <div className="max-h-[420px] space-y-3 overflow-auto rounded-md border p-3">
                  {activeMessages.map((m) => (
                    <div key={m.id} className={`rounded-md border p-3 ${m.sender.includes('admin') ? 'bg-blue-50 border-blue-100' : 'bg-white'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-700">{m.sender}</span>
                        <span className="text-[11px] text-gray-500">{new Date(m.at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{m.content}</p>
                    </div>
                  ))}
                  {activeMessages.length === 0 && <p className="text-sm text-gray-500">No messages available.</p>}
                </div>

                <div className="space-y-2">
                  <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add internal admin note" />
                  <Button onClick={addInternalNote}>Add Note</Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-500">Select a conversation to view messages.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
