import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogOut, MessageCircle, Minus, Send, X } from 'lucide-react'
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
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Timestamp,
} from 'firebase/firestore'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { auth, db, isFirebaseReady, signInWithGoogle, signOutUser } from '../lib/firebase'

interface LiveMessage {
  id: string
  sender: 'visitor' | 'admin'
  name: string
  text: string
  createdAt: Timestamp | null
}

function chatTime(ts: Timestamp | null | undefined): string {
  const d = ts ? ts.toDate() : new Date()
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
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
  const [user, setUser] = useState<User | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [signingIn, setSigningIn] = useState(false)
  const [open, setOpen] = useState(false)
  // One chat per Google user — chatId is the user's UID.
  const chatId = user?.uid ?? null
  const [messages, setMessages] = useState<LiveMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const [unreadVisitor, setUnreadVisitor] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const typingTimer = useRef<number | undefined>(undefined)
  const chatIdRef = useRef<string | null>(null)
  chatIdRef.current = chatId

  // Track Google auth state.
  useEffect(() => {
    if (!ready || !auth) {
      setAuthChecking(false)
      return
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthChecking(false)
    })
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

  // Ensure the user's chat doc exists (one per Google UID).
  const ensureChatDoc = useCallback(async () => {
    if (!db || !user || !chatId) return
    try {
      const chatRef = doc(db, 'portfolio_chats', chatId)
      const snap = await getDoc(chatRef)
      if (!snap.exists()) {
        await setDoc(chatRef, {
          name: user.displayName ?? 'Google User',
          email: user.email ?? '',
          photoURL: user.photoURL ?? '',
          uid: user.uid,
          createdAt: serverTimestamp(),
          lastMessage: '',
          lastAt: serverTimestamp(),
          lastSender: 'visitor',
          unreadAdmin: 0,
          unreadVisitor: 0,
          visitorTyping: false,
          adminTyping: false,
        })
      }
    } catch {
      // best-effort
    }
  }, [user, chatId])

  useEffect(() => {
    if (user && chatId) void ensureChatDoc()
  }, [user, chatId, ensureChatDoc])

  // Real-time subscription to the chat doc (typing + unread) and its messages.
  useEffect(() => {
    if (!ready || !db || !chatId) {
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
        if (!data) return
        setAdminTyping(!!data.adminTyping)
        setUnreadVisitor(data.unreadVisitor ?? 0)
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
  }, [ready, chatId])

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

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    try {
      await signInWithGoogle()
      toast.success('Signed in — say hello!')
    } catch {
      toast.error('Google sign-in failed — try again')
    } finally {
      setSigningIn(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      setMessages([])
      setInput('')
      toast.success('Signed out')
    } catch {
      toast.error('Could not sign out')
    }
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
    void setTyping(true)
    window.clearTimeout(typingTimer.current)
    typingTimer.current = window.setTimeout(() => void setTyping(false), 2000)
  }

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || sending || !db || !chatId || !user) return
    setSending(true)
    try {
      await addDoc(collection(db, 'portfolio_chats', chatId, 'messages'), {
        sender: 'visitor',
        name: user.displayName ?? 'Google User',
        text,
        createdAt: serverTimestamp(),
        read: false,
      })
      await updateDoc(doc(db, 'portfolio_chats', chatId), {
        name: user.displayName ?? 'Google User',
        email: user.email ?? '',
        photoURL: user.photoURL ?? '',
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
              <div className="flex items-center gap-1">
                {user && (
                  <button
                    onClick={handleSignOut}
                    aria-label="Sign out"
                    title="Sign out"
                    className="rounded-full p-1.5 hover:bg-white/15"
                  >
                    <LogOut size={18} />
                  </button>
                )}
                <button onClick={toggle} aria-label="Close chat" className="rounded-full p-1 hover:bg-white/15">
                  <X size={20} />
                </button>
              </div>
            </div>

            {authChecking ? (
              <p className="py-8 text-center text-sm text-[var(--muted)]">Connecting…</p>
            ) : !user ? (
              /* Google sign-in gate */
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white">
                  <MessageCircle size={30} />
                </div>
                <div>
                  <p className="font-semibold text-[var(--text)]">Live chat with Huzaifa</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Sign in with Google to start chatting — your messages stay private.
                  </p>
                </div>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={signingIn}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface2)] px-5 py-2.5 text-sm font-semibold text-[var(--text)] transition hover:shadow-md disabled:opacity-60"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {signingIn ? 'Signing in…' : 'Sign in with Google'}
                </button>
              </div>
            ) : (
              /* Live thread */
              <>
                <div className="flex items-center gap-2.5 border-b border-[var(--border)] px-4 py-2.5">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="h-8 w-8 rounded-full" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-sm font-bold text-white">
                      {(user.displayName ?? 'U')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--text)]">
                      {user.displayName ?? 'Google User'}
                    </p>
                    <p className="truncate text-xs text-[var(--muted)]">{user.email}</p>
                  </div>
                </div>
                <div ref={scrollRef} className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
                  {loading ? (
                    <p className="py-8 text-center text-sm text-[var(--muted)]">Loading…</p>
                  ) : messages.length === 0 ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-[var(--muted)]">
                        Hi {user.displayName?.split(' ')[0] ?? 'there'}! 👋
                      </p>
                      <p className="mt-1 text-xs text-[var(--muted)]">Say hello — Huzaifa will reply here live.</p>
                    </div>
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
                <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-[var(--border)] p-3">
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
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
