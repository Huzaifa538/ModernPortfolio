import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowLeft, CheckCheck, Inbox, MessageCircle, Send } from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth'
import { auth, db, isFirebaseReady } from '../../lib/firebase'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Input } from '../../components/ui/Input'
import { Skeleton } from '../../components/ui/Skeleton'

interface LiveChat {
  id: string
  name: string
  email: string
  lastMessage: string
  lastSender: 'visitor' | 'admin'
  lastAt: Timestamp | null
  unreadAdmin: number
  totalMessages: number
  visitorTyping: boolean
}

interface LiveMessage {
  id: string
  sender: 'visitor' | 'admin'
  name: string
  text: string
  createdAt: Timestamp | null
}

function tsToMillis(ts: Timestamp | null | undefined): number {
  return ts ? ts.toDate().getTime() : 0
}

function timeAgo(ts: Timestamp | null | undefined): string {
  const diff = Date.now() - tsToMillis(ts)
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(tsToMillis(ts)).toLocaleDateString()
}

function chatTime(ts: Timestamp | null | undefined): string {
  return new Date(tsToMillis(ts)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  const [ready] = useState(() => isFirebaseReady())
  const [authReady, setAuthReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [authSlow, setAuthSlow] = useState(false)
  const [chats, setChats] = useState<LiveChat[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [threadLoading, setThreadLoading] = useState(false)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  // The admin logs in with the backend (JWT), not Firebase — so silently
  // sign in to Firebase anonymously if needed. Firestore rules just need
  // *any* authenticated user for the inbox to connect.
  // A 20s watchdog turns a silent hang into a visible error with a retry,
  // so a blocked or very slow network never leaves the inbox stuck on
  // "Connecting to live chat…" forever.
  useEffect(() => {
    if (!ready || !auth) return
    const authInstance = auth
    let cancelled = false
    const watchdog = window.setTimeout(() => {
      if (!cancelled) setAuthSlow(true)
    }, 20000)
    const unsub = onAuthStateChanged(authInstance, (user) => {
      if (cancelled) return
      if (user) {
        window.clearTimeout(watchdog)
        setAuthSlow(false)
        setAuthError(null)
        setAuthReady(true)
      } else {
        setAuthError(null)
        setAuthSlow(false)
        signInAnonymously(authInstance).catch((err: unknown) => {
          if (cancelled) return
          window.clearTimeout(watchdog)
          setAuthError(
            err instanceof Error ? err.message : 'Could not reach the chat service'
          )
        })
      }
    })
    return () => {
      cancelled = true
      window.clearTimeout(watchdog)
      unsub()
    }
  }, [ready])

  const retryAuth = useCallback(() => {
    if (!auth) return
    setAuthError(null)
    setAuthSlow(false)
    signInAnonymously(auth)
      .then(() => {
        setAuthSlow(false)
        setAuthError(null)
        setAuthReady(true)
      })
      .catch((err: unknown) =>
        setAuthError(
          err instanceof Error ? err.message : 'Could not reach the chat service'
        )
      )
  }, [])

  // --- Real-time chat list -----------------------------------------------------
  useEffect(() => {
    if (!ready || !db || !authReady) return
    const unsub = onSnapshot(
      query(collection(db, 'portfolio_chats'), orderBy('lastAt', 'desc')),
      (snap) => {
        setChats(
          snap.docs.map((d) => {
            const data = d.data() as DocumentData
            return {
              id: d.id,
              name: (data.name as string) ?? 'Visitor',
              email: (data.email as string) ?? '',
              lastMessage: (data.lastMessage as string) ?? '',
              lastSender: (data.lastSender as 'visitor' | 'admin') ?? 'visitor',
              lastAt: (data.lastAt as Timestamp) ?? null,
              unreadAdmin: (data.unreadAdmin as number) ?? 0,
              totalMessages: (data.totalMessages as number) ?? 0,
              visitorTyping: !!data.visitorTyping,
            }
          })
        )
        setLoading(false)
      },
      () => setLoading(false)
    )
    return unsub
  }, [ready, authReady])

  // Mark a chat as read: clear unreadAdmin and flag visitor messages read.
  const markChatRead = useCallback(async (id: string) => {
    if (!db) return
    try {
      const batch = writeBatch(db)
      batch.update(doc(db, 'portfolio_chats', id), { unreadAdmin: 0 })
      const unread = await getDocs(
        query(
          collection(db, 'portfolio_chats', id, 'messages'),
          where('sender', '==', 'visitor'),
          where('read', '==', false)
        )
      )
      unread.forEach((d) => batch.update(d.ref, { read: true }))
      await batch.commit()
    } catch {
      // best-effort
    }
  }, [])

  // --- Real-time thread for the selected chat ----------------------------------
  useEffect(() => {
    if (!ready || !db || !authReady || !selectedId) {
      setMessages([])
      return
    }
    setThreadLoading(true)
    void markChatRead(selectedId)
    const unsub = onSnapshot(
      query(collection(db, 'portfolio_chats', selectedId, 'messages'), orderBy('createdAt', 'asc')),
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data() as DocumentData
            return {
              id: d.id,
              sender: data.sender as 'visitor' | 'admin',
              name: (data.name as string) ?? '',
              text: (data.text as string) ?? '',
              createdAt: (data.createdAt as Timestamp) ?? null,
            }
          })
        )
        setThreadLoading(false)
        // Keep read receipts fresh while the thread is open.
        void markChatRead(selectedIdRef.current ?? '')
      },
      () => setThreadLoading(false)
    )
    return unsub
  }, [ready, authReady, selectedId, markChatRead])

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const setTyping = useCallback(async (typing: boolean) => {
    const id = selectedIdRef.current
    if (!db || !id) return
    try {
      await updateDoc(doc(db, 'portfolio_chats', id), { adminTyping: typing })
    } catch {
      // best-effort
    }
  }, [])

  const handleReplyInput = (value: string) => {
    setReply(value)
    void setTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => void setTyping(false), 2000)
  }

  const sendReply = async (e: FormEvent) => {
    e.preventDefault()
    const text = reply.trim()
    if (!text || sending || !db || !selectedId) return
    setSending(true)
    try {
      await addDoc(collection(db, 'portfolio_chats', selectedId, 'messages'), {
        sender: 'admin',
        name: 'Huzaifa Adam',
        text,
        createdAt: serverTimestamp(),
        read: false,
      })
      await updateDoc(doc(db, 'portfolio_chats', selectedId), {
        lastMessage: text,
        lastAt: serverTimestamp(),
        lastSender: 'admin',
        unreadVisitor: increment(1),
        adminTyping: false,
        totalMessages: increment(1),
      })
      setReply('')
      window.clearTimeout(typingTimer.current)
    } catch {
      toast.error('Reply failed — please try again')
    } finally {
      setSending(false)
    }
  }

  const markAllRead = async () => {
    const unread = chats.filter((c) => c.unreadAdmin > 0)
    if (unread.length === 0) return
    try {
      await Promise.all(unread.map((c) => markChatRead(c.id)))
      toast.success('All conversations marked as read')
    } catch {
      toast.error('Something went wrong — try again')
    }
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Inbox</h1>
        <Card>
          <p className="text-[var(--muted)]">
            Live chat is not configured — Firebase is unavailable.
          </p>
        </Card>
      </div>
    )
  }

  const selected = chats.find((c) => c.id === selectedId) ?? null
  const totalUnread = chats.reduce((sum, c) => sum + c.unreadAdmin, 0)

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
            Live chat conversations with your visitors — each one separate, in real time.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {!authReady && (
        <Card>
          <p className="text-sm text-[var(--muted)]">Connecting to live chat…</p>
          {(authSlow || authError) && (
            <div className="mt-3 space-y-3">
              <p className="text-sm text-red-400">
                {authError ??
                  'Still connecting — your network may be slow or blocking the chat service.'}
              </p>
              <Button variant="outline" size="sm" onClick={retryAuth}>
                Retry connection
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Two-pane */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        {/* Left: chat list — hidden on mobile while a thread is open */}
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
          ) : chats.length === 0 ? (
            <div className="p-12 text-center text-[var(--muted)]">
              <Inbox className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No conversations yet.</p>
              <p className="mt-1 text-sm">New live-chat messages will appear here instantly.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedId(chat.id)}
                  className={clsx(
                    'block w-full px-5 py-4 text-left transition',
                    selectedId === chat.id
                      ? 'bg-[#8b5cf6]/10'
                      : 'hover:bg-[var(--surface2)]/50'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1]/30 to-[#22d3ee]/30 font-display text-xs font-bold text-[#8b5cf6]">
                      {initials(chat.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-semibold">{chat.name}</p>
                        {chat.unreadAdmin > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-1.5 text-[11px] font-bold text-white">
                            {chat.unreadAdmin}
                          </span>
                        )}
                        <span className="font-mono ml-auto shrink-0 text-[11px] text-[var(--muted)]">
                          {timeAgo(chat.lastAt)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{chat.email}</p>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        <span className="font-medium text-[var(--text)]/80">
                          {chat.lastSender === 'admin' ? 'You: ' : ''}
                        </span>
                        {chat.lastMessage}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Right: thread — hidden on mobile until a chat is picked */}
        <div className={clsx(!selectedId && 'hidden lg:block')}>
          <Card padded={false} className="flex max-h-[640px] min-h-[480px] flex-col overflow-hidden">
            {!selected ? (
              <div className="flex h-full min-h-[480px] flex-col items-center justify-center p-12 text-[var(--muted)]">
                <MessageCircle className="h-10 w-10 opacity-50" />
                <p className="mt-3 font-medium">Pick a conversation to chat here.</p>
                <p className="mt-1 text-sm">Replies go to the visitor instantly.</p>
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
                      {selected.email}
                      {selected.visitorTyping ? ' · typing…' : ''}
                    </p>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs text-[var(--muted)]">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    Live
                  </span>
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
                    messages.map((msg) => {
                      const mine = msg.sender === 'admin'
                      return (
                        <motion.div
                          key={msg.id}
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
                              {msg.text}
                            </div>
                            <p className="font-mono mt-1 text-[11px] text-[var(--muted)]">
                              {mine ? 'You' : msg.name} · {chatTime(msg.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                  {selected.visitorTyping && (
                    <div className="flex justify-start">
                      <div className="rounded-2xl rounded-bl-md border border-[var(--border)] bg-[var(--surface2)] px-4 py-2.5">
                        <span className="flex gap-1">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]"
                              animate={{ opacity: [0.3, 1, 0.3] }}
                              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                            />
                          ))}
                        </span>
                      </div>
                    </div>
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
                      onChange={(e) => handleReplyInput(e.target.value)}
                      disabled={threadLoading || !authReady}
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
