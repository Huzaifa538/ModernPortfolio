import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Minus, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import {
  addDoc,
  collection,
  doc,
  getDoc,
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
import { onAuthStateChanged } from 'firebase/auth'
import { auth, db, isFirebaseReady } from '../lib/firebase'

const CHAT_KEY = 'portfolio_chat_id'

interface LiveMessage {
  id: string
  sender: 'visitor' | 'admin'
  name: string
  text: string
  createdAt: Timestamp | null
}

function tsToDate(ts: Timestamp | null | undefined): Date {
  return ts ? ts.toDate() : new Date()
}

function chatTime(ts: Timestamp | null | undefined): string {
  return tsToDate(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Bubble({ msg }: { msg: LiveMessage }) {
  const mine = msg.sender === 'visitor'
  return (
    <div className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[85%]', mine ? 'text-right' : 'text-left')}>
        <div
          className={clsx(
            'inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
            mine
              ? 'rounded-br-md bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md shadow-indigo-500/25'
              : 'rounded-bl-md border border-[var(--border)] bg-[var(--surface2)] text-[var(--text)]'
          )}
        >
          {msg.text}
        </div>
        <p className="font-mono mt-1 text-[10px] text-[var(--muted)]">
          {mine ? 'You' : msg.name} · {chatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  )
}

export function ChatWidget() {
  const [ready] = useState(() => isFirebaseReady())
  const [authReady, setAuthReady] = useState(false)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [firstMsg, setFirstMsg] = useState('')
  const [starting, setStarting] = useState(false)
  const [chatId, setChatId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(CHAT_KEY)
  )
  const [visitorName, setVisitorName] = useState('')
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [unreadVisitor, setUnreadVisitor] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)
  const chatIdRef = useRef<string | null>(chatId)
  chatIdRef.current = chatId

  // Wait for anonymous auth before touching Firestore.
  useEffect(() => {
    if (!ready || !auth) return
    const unsub = onAuthStateChanged(auth, (user) => setAuthReady(!!user))
    return unsub
  }, [ready])

  const markRead = useCallback(async (id: string) => {
    if (!db) return
    try {
      const chatRef = doc(db, 'portfolio_chats', id)
      const snap = await getDoc(chatRef)
      const data = snap.data() as DocumentData | undefined
      if (data && (data.unreadVisitor ?? 0) > 0) {
        const batch = writeBatch(db)
        batch.update(chatRef, { unreadVisitor: 0 })
        // Mark unread admin messages as read too.
        const unread = await getDocs(
          query(
            collection(db, 'portfolio_chats', id, 'messages'),
            where('sender', '==', 'admin'),
            where('read', '==', false)
          )
        )
        unread.forEach((d) => batch.update(d.ref, { read: true }))
        await batch.commit()
      }
    } catch {
      // Read receipts are best-effort.
    }
  }, [])

  // Real-time subscription to the chat doc (typing + unread) and its messages.
  useEffect(() => {
    if (!ready || !db || !authReady || !chatId) {
      setMessages([])
      setAdminTyping(false)
      setUnreadVisitor(0)
      return
    }
    setLoading(true)
    const unsubs: Array<() => void> = []

    unsubs.push(
      onSnapshot(doc(db, 'portfolio_chats', chatId), (snap) => {
        const data = snap.data() as DocumentData | undefined
        if (!data) {
          // Chat was deleted — reset to the start form.
          localStorage.removeItem(CHAT_KEY)
          setChatId(null)
          setMessages([])
          setVisitorName('')
          return
        }
        setAdminTyping(!!data.adminTyping)
        setUnreadVisitor(data.unreadVisitor ?? 0)
        if (data.name && !visitorName) setVisitorName(data.name)
      })
    )

    unsubs.push(
      onSnapshot(
        query(collection(db, 'portfolio_chats', chatId, 'messages'), orderBy('createdAt', 'asc')),
        (snap) => {
          const list: LiveMessage[] = snap.docs.map((d) => {
            const data = d.data() as DocumentData
            return {
              id: d.id,
              sender: data.sender as 'visitor' | 'admin',
              name: (data.name as string) ?? '',
              text: (data.text as string) ?? '',
              createdAt: (data.createdAt as Timestamp) ?? null,
            }
          })
          setMessages(list)
          setLoading(false)
        },
        () => setLoading(false)
      )
    )

    return () => unsubs.forEach((u) => u())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, authReady, chatId])

  // When the panel is open and new admin messages arrive, mark them read.
  useEffect(() => {
    if (open && chatId && unreadVisitor > 0) markRead(chatId)
  }, [open, chatId, unreadVisitor, markRead])

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el && open) el.scrollTop = el.scrollHeight
  }, [messages, adminTyping, open])

  const toggle = () => {
    setOpen((o) => {
      const next = !o
      if (next && chatIdRef.current) markRead(chatIdRef.current)
      return next
    })
  }

  const setTyping = useCallback(
    async (typing: boolean) => {
      const id = chatIdRef.current
      if (!db || !id) return
      try {
        await updateDoc(doc(db, 'portfolio_chats', id), { visitorTyping: typing })
      } catch {
        // best-effort
      }
    },
    []
  )

  const handleInput = (value: string) => {
    setInput(value)
    // Debounced typing indicator: set true now, reset after 2s idle.
    void setTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => void setTyping(false), 2000)
  }

  const startConversation = async (e: FormEvent) => {
    e.preventDefault()
    if (!db || !authReady) return toast.error('Chat is still connecting — try again in a moment')
    if (name.trim().length < 2) return toast.error('Please enter your name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error('Enter a valid email')
    if (firstMsg.trim().length < 3) return toast.error('Write your message')
    setStarting(true)
    try {
      const chatRef = await addDoc(collection(db, 'portfolio_chats'), {
        name: name.trim(),
        email: email.trim(),
        createdAt: serverTimestamp(),
        lastMessage: firstMsg.trim(),
        lastAt: serverTimestamp(),
        lastSender: 'visitor',
        unreadAdmin: 1,
        unreadVisitor: 0,
        visitorTyping: false,
        adminTyping: false,
      })
      await addDoc(collection(db, 'portfolio_chats', chatRef.id, 'messages'), {
        sender: 'visitor',
        name: name.trim(),
        text: firstMsg.trim(),
        createdAt: serverTimestamp(),
        read: false,
      })
      localStorage.setItem(CHAT_KEY, chatRef.id)
      setChatId(chatRef.id)
      setVisitorName(name.trim())
      setFirstMsg('')
      toast.success('Message sent!')
    } catch {
      toast.error('Could not send — try again')
    } finally {
      setStarting(false)
    }
  }

  const sendFollowUp = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !db || !chatId || !visitorName) return
    setSending(true)
    try {
      await addDoc(collection(db, 'portfolio_chats', chatId, 'messages'), {
        sender: 'visitor',
        name: visitorName,
        text,
        createdAt: serverTimestamp(),
        read: false,
      })
      await updateDoc(doc(db, 'portfolio_chats', chatId), {
        lastMessage: text,
        lastAt: serverTimestamp(),
        lastSender: 'visitor',
        unreadAdmin: increment(1),
        visitorTyping: false,
      })
      setInput('')
      window.clearTimeout(typingTimer.current)
    } catch {
      toast.error('Could not send — try again')
    } finally {
      setSending(false)
    }
  }

  const newConversation = () => {
    localStorage.removeItem(CHAT_KEY)
    setChatId(null)
    setMessages([])
    setVisitorName('')
    setInput('')
    setName('')
    setEmail('')
    setFirstMsg('')
    setUnreadVisitor(0)
  }

  // Hide entirely when Firebase isn't configured.
  if (!ready) return null

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={toggle}
        aria-label="Chat with me"
        className={clsx(
          'fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full',
          'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white',
          'shadow-lg shadow-indigo-500/40 transition-transform hover:scale-105 active:scale-95'
        )}
        whileTap={{ scale: 0.92 }}
      >
        {open ? <Minus size={24} /> : <MessageCircle size={26} />}
        {unreadVisitor > 0 && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold">
            {unreadVisitor > 9 ? '9+' : unreadVisitor}
          </span>
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.22 }}
            className={clsx(
              'fixed bottom-24 right-5 z-50 flex w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden',
              'rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl shadow-black/30',
              'h-[480px] max-h-[70vh]'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-3 text-white">
              <div>
                <p className="font-semibold">Chat with Huzaifa</p>
                <p className="flex items-center gap-1.5 text-xs opacity-90">
                  <span className="h-2 w-2 rounded-full bg-green-300" />
                  {adminTyping ? 'Huzaifa is typing…' : 'Typically replies quickly'}
                </p>
              </div>
              <button onClick={toggle} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/15">
                <X size={20} />
              </button>
            </div>

            {!chatId ? (
              /* First-time form */
              <form onSubmit={startConversation} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <p className="text-sm text-[var(--muted)]">
                  Drop me a message and I'll get back to you right here — live.
                </p>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[#6366f1]"
                />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  type="email"
                  className="rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[#6366f1]"
                />
                <textarea
                  value={firstMsg}
                  onChange={(e) => setFirstMsg(e.target.value)}
                  placeholder="Hi Huzaifa, I wanted to talk about…"
                  rows={4}
                  className="flex-1 resize-none rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[#6366f1]"
                />
                <button
                  type="submit"
                  disabled={starting || !authReady}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Send size={16} />
                  {starting ? 'Sending…' : authReady ? 'Start chatting' : 'Connecting…'}
                </button>
              </form>
            ) : (
              /* Thread view */
              <>
                <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {loading ? (
                    <p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p>
                  ) : messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--muted)]">Say hello! 👋</p>
                  ) : (
                    messages.map((m) => <Bubble key={m.id} msg={m} />)
                  )}
                  {adminTyping && (
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
                <form onSubmit={sendFollowUp} className="flex items-center gap-2 border-t border-[var(--border)] p-3">
                  <input
                    value={input}
                    onChange={(e) => handleInput(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-3.5 py-2.5 text-sm text-[var(--text)] outline-none placeholder:text-[var(--muted)] focus:border-[#6366f1]"
                  />
                  <button
                    type="submit"
                    disabled={sending || !input.trim()}
                    aria-label="Send message"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white disabled:opacity-50"
                  >
                    <Send size={17} />
                  </button>
                </form>
                <button
                  onClick={newConversation}
                  className="border-t border-[var(--border)] py-1.5 text-center text-xs text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Start a new conversation
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
