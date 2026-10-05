import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircle, Minus, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { clsx } from 'clsx'
import { api } from '../lib/api'
import type { ChatMessage } from '../lib/types'

const CONV_KEY = 'portfolio_conv_id'
const CONV_NAME_KEY = 'portfolio_conv_name'
const CONV_EMAIL_KEY = 'portfolio_conv_email'

function chatTime(date: string): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Bubble({ msg }: { msg: ChatMessage }) {
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
          {msg.message}
        </div>
        <p className="font-mono mt-1 text-[10px] text-[var(--muted)]">
          {mine ? 'You' : msg.name} · {chatTime(msg.createdAt)}
        </p>
      </div>
    </div>
  )
}

export function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [firstMsg, setFirstMsg] = useState('')
  const [starting, setStarting] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(CONV_KEY)
  )
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem(CONV_NAME_KEY) ?? '')
  const [visitorEmail, setVisitorEmail] = useState(() => localStorage.getItem(CONV_EMAIL_KEY) ?? '')
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const prevCount = useRef(0)

  const loadThread = useCallback(
    async (id: string, silent = false) => {
      if (!silent) setLoading(true)
      try {
        const msgs = await api.getConversation(id)
        setThread((prev) => {
          // Flag unread when a new admin message arrives while the panel is closed.
          if (silent && !open && msgs.length > prevCount.current) {
            const fresh = msgs.slice(prevCount.current)
            if (fresh.some((m) => m.sender === 'admin')) setHasUnread(true)
          }
          prevCount.current = msgs.length
          return msgs
        })
        const firstVisitor = msgs.find((m) => m.sender === 'visitor')
        if (firstVisitor) {
          if (!visitorName && firstVisitor.name) {
            setVisitorName(firstVisitor.name)
            localStorage.setItem(CONV_NAME_KEY, firstVisitor.name)
          }
          if (!visitorEmail && firstVisitor.email) {
            setVisitorEmail(firstVisitor.email)
            localStorage.setItem(CONV_EMAIL_KEY, firstVisitor.email)
          }
        }
      } catch {
        if (!silent) {
          localStorage.removeItem(CONV_KEY)
          localStorage.removeItem(CONV_NAME_KEY)
          localStorage.removeItem(CONV_EMAIL_KEY)
          setConversationId(null)
          setThread([])
          prevCount.current = 0
        }
      } finally {
        if (!silent) setLoading(false)
      }
    },
    [open, visitorName, visitorEmail]
  )

  // Poll the thread — every 5s when open, every 15s when closed (for the badge).
  useEffect(() => {
    if (!conversationId) return
    loadThread(conversationId)
    const timer = window.setInterval(
      () => loadThread(conversationId, true),
      open ? 5000 : 15000
    )
    return () => window.clearInterval(timer)
  }, [conversationId, open, loadThread])

  useEffect(() => {
    const el = scrollRef.current
    if (el && open) el.scrollTop = el.scrollHeight
  }, [thread, open])

  const toggle = () => {
    setOpen((o) => {
      if (!o) setHasUnread(false)
      return !o
    })
  }

  const startConversation = async (e: FormEvent) => {
    e.preventDefault()
    if (name.trim().length < 2) return toast.error('Please enter your name')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return toast.error('Enter a valid email')
    if (firstMsg.trim().length < 3) return toast.error('Write your message')
    setStarting(true)
    try {
      const res = await api.sendContact({
        name: name.trim(),
        email: email.trim(),
        message: firstMsg.trim(),
      })
      if (res.conversationId) {
        localStorage.setItem(CONV_KEY, res.conversationId)
        localStorage.setItem(CONV_NAME_KEY, name.trim())
        localStorage.setItem(CONV_EMAIL_KEY, email.trim())
        setVisitorName(name.trim())
        setVisitorEmail(email.trim())
        setConversationId(res.conversationId)
        prevCount.current = 0
        setFirstMsg('')
        toast.success('Message sent!')
      }
    } catch {
      toast.error('Could not send — try again')
    } finally {
      setStarting(false)
    }
  }

  const sendFollowUp = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !conversationId || !visitorName || !visitorEmail) return
    setSending(true)
    try {
      await api.sendContact({
        name: visitorName,
        email: visitorEmail,
        message: text,
        conversationId,
      })
      setInput('')
      loadThread(conversationId, true)
    } catch {
      toast.error('Could not send — try again')
    } finally {
      setSending(false)
    }
  }

  const newConversation = () => {
    localStorage.removeItem(CONV_KEY)
    localStorage.removeItem(CONV_NAME_KEY)
    localStorage.removeItem(CONV_EMAIL_KEY)
    setConversationId(null)
    setThread([])
    prevCount.current = 0
    setInput('')
    setName('')
    setEmail('')
    setFirstMsg('')
  }

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
        {hasUnread && !open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            !
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
                  Typically replies quickly
                </p>
              </div>
              <button onClick={toggle} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/15">
                <X size={20} />
              </button>
            </div>

            {!conversationId ? (
              /* First-time form */
              <form onSubmit={startConversation} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                <p className="text-sm text-[var(--muted)]">
                  Drop me a message and I'll get back to you right here.
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
                  disabled={starting}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  <Send size={16} />
                  {starting ? 'Sending…' : 'Start chatting'}
                </button>
              </form>
            ) : (
              /* Thread view */
              <>
                <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {loading ? (
                    <p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p>
                  ) : thread.length === 0 ? (
                    <p className="py-8 text-center text-sm text-[var(--muted)]">Say hello! 👋</p>
                  ) : (
                    thread.map((m, i) => <Bubble key={i} msg={m} />)
                  )}
                </div>
                <form onSubmit={sendFollowUp} className="flex items-center gap-2 border-t border-[var(--border)] p-3">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
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
