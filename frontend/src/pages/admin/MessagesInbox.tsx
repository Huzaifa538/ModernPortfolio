import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCheck, Inbox, MessageCircle, Send } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'
import type { ChatMessage, ConversationSummary } from '../../lib/types'

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

function chatTime(date: string): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function MessagesInbox() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // --- Conversation list (polled every 10s) -----------------------------------
  const loadList = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const list = await api.getConversations()
      setConversations(list)
    } catch {
      if (!silent) toast.error('Could not load conversations')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadList()
    const timer = window.setInterval(() => loadList(true), 10000)
    return () => window.clearInterval(timer)
  }, [loadList])

  // --- Open thread (polled every 5s) -------------------------------------------
  const loadThread = useCallback(async (id: string, silent = false) => {
    if (!silent) setThreadLoading(true)
    try {
      const msgs = await api.getConversationThread(id)
      setThread(msgs)
      // The backend marks visitor messages read when the thread is fetched.
      setConversations((list) =>
        list.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c))
      )
    } catch {
      if (!silent) toast.error('Could not load the conversation')
    } finally {
      if (!silent) setThreadLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setThread([])
      return
    }
    loadThread(selectedId)
    const timer = window.setInterval(() => loadThread(selectedId, true), 5000)
    return () => window.clearInterval(timer)
  }, [selectedId, loadThread])

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread])

  const sendReply = async (e: FormEvent) => {
    e.preventDefault()
    const text = reply.trim()
    if (!text || sending || !selectedId) return
    setSending(true)
    try {
      await api.replyConversation(selectedId, text)
      setReply('')
      await loadThread(selectedId, true)
      loadList(true)
    } catch {
      toast.error('Reply failed — please try again')
    } finally {
      setSending(false)
    }
  }

  const markAllRead = async () => {
    const unread = conversations.filter((c) => c.unreadCount > 0)
    if (unread.length === 0) return
    try {
      // Fetching a thread marks its visitor messages as read on the backend.
      await Promise.all(unread.map((c) => api.getConversationThread(c._id)))
      setConversations((list) => list.map((c) => ({ ...c, unreadCount: 0 })))
      toast.success('All conversations marked as read')
    } catch {
      toast.error('Something went wrong — try again')
    }
  }

  const selected = conversations.find((c) => c._id === selectedId) ?? null
  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Inbox{' '}
            {totalUnread > 0 && (
              <Badge tone="brand" className="ml-1 align-middle">
                {totalUnread} unread
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-[var(--muted)]">
            Live chat conversations with your visitors — each one separate.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {/* Two-pane */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Left: conversation list — hidden on mobile while a thread is open */}
        <Card
          padded={false}
          className={clsx(
            'max-h-[560px] overflow-y-auto',
            selectedId && 'hidden lg:block'
          )}
        >
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-12 text-center text-[var(--muted)]">
              <Inbox className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No conversations yet.</p>
              <p className="mt-1 text-sm">New contact-form messages will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {conversations.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setSelectedId(conv._id)}
                  className={clsx(
                    'block w-full px-5 py-4 text-left transition',
                    selectedId === conv._id
                      ? 'bg-[#8b5cf6]/10'
                      : 'hover:bg-[var(--surface2)]/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1]/30 to-[#22d3ee]/30 font-display text-xs font-bold text-[#8b5cf6]">
                      {initials(conv.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={clsx(
                            'truncate font-semibold',
                            conv.unreadCount > 0 && 'text-[var(--text)]'
                          )}
                        >
                          {conv.name}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-1.5 text-[11px] font-bold text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                        <span className="font-mono ml-auto shrink-0 text-[11px] text-[var(--muted)]">
                          {timeAgo(conv.lastAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{conv.email}</p>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        <span className="font-medium text-[var(--text)]/80">
                          {conv.lastSender === 'admin' ? 'You: ' : ''}
                        </span>
                        {conv.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right: thread — hidden on mobile until a conversation is picked */}
        <div className={clsx(!selectedId && 'hidden lg:block')}>
          <Card padded={false} className="flex max-h-[640px] min-h-[480px] flex-col overflow-hidden">
            {!selected ? (
              <div className="flex h-full min-h-[480px] flex-col items-center justify-center p-12 text-[var(--muted)]">
                <MessageCircle className="h-10 w-10 opacity-50" />
                <p className="mt-3 font-medium">Pick a conversation to chat here.</p>
                <p className="mt-1 text-sm">Replies go straight to the visitor.</p>
              </div>
            ) : (
              <>
                {/* Thread header */}
                <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
                  <button
                    onClick={() => setSelectedId(null)}
                    aria-label="Back to conversations"
                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] lg:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1]/30 to-[#22d3ee]/30 font-display text-xs font-bold text-[#8b5cf6]">
                    {initials(selected.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{selected.name}</p>
                    <p className="truncate text-xs text-[var(--muted)]">
                      {selected.email} · {selected.totalMessages}{' '}
                      {selected.totalMessages === 1 ? 'message' : 'messages'}
                    </p>
                  </div>
                </div>

                {/* Thread */}
                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {threadLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-2/3" />
                      <Skeleton className="ml-auto h-12 w-1/2" />
                      <Skeleton className="h-12 w-3/5" />
                    </div>
                  ) : (
                    thread.map((msg, i) => {
                      const mine = msg.sender === 'admin'
                      return (
                        <motion.div
                          key={msg._id ?? `${msg.createdAt}-${i}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.25 }}
                          className={clsx('flex', mine ? 'justify-end' : 'justify-start')}
                        >
                          <div
                            className={clsx(
                              'max-w-[85%] sm:max-w-[75%]',
                              mine ? 'text-right' : 'text-left'
                            )}
                          >
                            <div
                              className={clsx(
                                'inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                                mine
                                  ? 'rounded-br-md bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md shadow-indigo-500/25'
                                  : 'rounded-bl-md border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)]'
                              )}
                            >
                              {msg.message}
                            </div>
                            <p className="font-mono mt-1 text-[11px] text-[var(--muted)]">
                              {mine ? 'You' : msg.name} · {chatTime(msg.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                </div>

                {/* Reply box */}
                <form
                  onSubmit={sendReply}
                  className="flex items-end gap-2 border-t border-[var(--border)] px-4 py-4"
                >
                  <div className="flex-1">
                    <Input
                      label="Reply to the visitor…"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      disabled={threadLoading}
                      aria-label="Reply to the visitor"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="md"
                    loading={sending}
                    disabled={!reply.trim()}
                    aria-label="Send reply"
                    className="shrink-0 !px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
