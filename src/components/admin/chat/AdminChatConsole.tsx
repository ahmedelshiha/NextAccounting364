"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type ChatMsg = {
  id: string
  text: string
  userId: string
  userName: string
  role: string
  tenantId?: string | null
  room?: string | null
  createdAt: string
}

export default function AdminChatConsole() {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [text, setText] = useState('')
  const [room, setRoom] = useState<string>('')
  const [connected, setConnected] = useState(false)
  const [metrics, setMetrics] = useState<{ transport: string; connectionCount: number; totalEvents: number } | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight }, [messages])

  // Poll realtime metrics
  useEffect(() => {
    let t: any
    const load = async () => {
      try {
        const res = await fetch('/api/admin/system/health', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const r = data?.realtime
          if (r) setMetrics({ transport: r.transport || 'unknown', connectionCount: r.connectionCount || 0, totalEvents: r.totalEvents || 0 })
        }
      } catch {}
      t = setTimeout(load, 5000)
    }
    void load()
    return () => { if (t) clearTimeout(t) }
  }, [])

  // Load backlog
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const qp = room ? `?limit=200&room=${encodeURIComponent(room)}` : '?limit=200'
        const res = await fetch(`/api/admin/chat${qp}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && Array.isArray(data.messages)) setMessages(data.messages)
      } catch {}
    }
    void load()
    return () => { cancelled = true }
  }, [room])

  // Subscribe to realtime events
  useEffect(() => {
    const eventsParam = 'chat-message'
    const es = new EventSource(`/api/admin/realtime?events=${eventsParam}`)
    const onMessage = (evt: MessageEvent) => {
      try {
        const payload = JSON.parse(evt.data)
        if (payload && payload.type === 'chat-message' && payload.data) {
          const msg = payload.data as ChatMsg
          if (!room || (msg.room || null) === room) {
            setMessages((prev) => [...prev, msg])
          }
        }
      } catch {}
    }
    es.addEventListener('open', () => setConnected(true))
    es.addEventListener('error', () => setConnected(false))
    es.addEventListener('message', onMessage)
    return () => { try { es.removeEventListener('message', onMessage); es.close() } catch {} ; setConnected(false) }
  }, [room])

  const canSend = useMemo(() => text.trim().length > 0 && text.trim().length <= 1000, [text])
  const send = async () => {
    const value = text.trim()
    if (!value) return
    setText('')
    try {
      const res = await fetch('/api/admin/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(room ? { message: value, room } : { message: value })
      })
      if (!res.ok) console.warn('Failed to send admin chat message')
    } catch (e) { console.warn('Failed to send admin chat message', e) }
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <div className="mb-3 flex items-center gap-3">
        <Input value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room (optional)" className="max-w-xs" />
        <div className={`text-xs ${connected ? 'text-green-600' : 'text-muted-foreground'}`}>{connected ? 'Online' : 'Connecting...'}</div>
        {metrics ? (
          <div className="text-xs text-muted-foreground">
            transport: <span className="font-medium">{metrics.transport}</span>, connections: {metrics.connectionCount}, events: {metrics.totalEvents}
          </div>
        ) : null}
      </div>
      <div ref={listRef} className="border rounded-lg h-96 overflow-y-auto p-3 bg-card">
        {messages.map((m) => (
          <div key={m.id} className="text-sm py-1">
            <div className="font-medium">
              {m.userName} <span className="text-muted-foreground text-xs">{new Date(m.createdAt).toLocaleTimeString()}</span>
              {m.room ? <span className="ml-2 text-muted-foreground text-xs">#{m.room}</span> : null}
            </div>
            <div>{m.text}</div>
          </div>
        ))}
        {messages.length === 0 && <div className="text-sm text-muted-foreground">No messages</div>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && canSend) void send() }} placeholder="Type a reply..." />
        <Button onClick={() => void send()} disabled={!canSend}>Send</Button>
      </div>
    </div>
  )
}
