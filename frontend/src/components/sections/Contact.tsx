import axios from 'axios'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { motion } from 'framer-motion'
import {
  Check,
  Copy,
  Github,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plus,
  Send,
  Twitter,
} from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import { SectionHeading } from '../ui/SectionHeading'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Button } from '../ui/Button'
import { Skeleton } from '../ui/Skeleton'
import { Reveal } from '../ui/Reveal'
import { api } from '../../lib/api'
import type { ChatMessage, Profile } from '../../lib/types'

interface FormState {
  name: string
  email: string
  subject: string
  message: string
  website: string // honeypot — left empty by humans
}

const EMPTY: FormState = { name: '', email: '', subject: '', message: '', website: '' }

const CONV_KEY = 'portfolio_conv_id'
const CONV_NAME_KEY = 'portfolio_conv_name'
const CONV_EMAIL_KEY = 'portfolio_conv_email'

function chatTime(date: string): string {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const mine = msg.sender === 'visitor'
  return (
    <div className={clsx('flex', mine ? 'justify-end' : 'justify-start')}>
      <div className={clsx('max-w-[85%] sm:max-w-[75%]', mine ? 'text-right' : 'text-left')}>
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
    </div>
  )
}

export function Contact({ profile }: { profile: Profile | null }) {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [sending, setSending] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  // --- Two-way chat state -----------------------------------------------------
  const [conversationId, setConversationId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : localStorage.getItem(CONV_KEY)
  )
  const [visitorName, setVisitorName] = useState(
    () => localStorage.getItem(CONV_NAME_KEY) ?? ''
  )
  const [visitorEmail, setVisitorEmail] = useState(
    () => localStorage.getItem(CONV_EMAIL_KEY) ?? ''
  )
  const [thread, setThread] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatSending, setChatSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const loadThread = useCallback(async (id: string, silent = false) => {
    if (!silent) setChatLoading(true)
    try {
      const msgs = await api.getConversation(id)
      setThread(msgs)
      // Recover the visitor's identity from the thread so follow-ups stay linked.
      const firstVisitor = msgs.find((m) => m.sender === 'visitor')
      if (firstVisitor) {
        setVisitorName((n) => {
          const next = n || firstVisitor.name
          if (next) localStorage.setItem(CONV_NAME_KEY, next)
          return next
        })
        setVisitorEmail((e) => {
          const next = e || firstVisitor.email || ''
          if (next) localStorage.setItem(CONV_EMAIL_KEY, next)
          return next
        })
      }
    } catch {
      if (!silent) {
        // The conversation no longer exists — drop back to the contact form.
        localStorage.removeItem(CONV_KEY)
        localStorage.removeItem(CONV_NAME_KEY)
        localStorage.removeItem(CONV_EMAIL_KEY)
        setConversationId(null)
        setThread([])
        toast.error('That conversation has expired — start a new one below.')
      }
    } finally {
      if (!silent) setChatLoading(false)
    }
  }, [])

  // Load + poll the open thread every 5 seconds.
  useEffect(() => {
    if (!conversationId) return
    loadThread(conversationId)
    const timer = window.setInterval(() => loadThread(conversationId, true), 5000)
    return () => window.clearInterval(timer)
  }, [conversationId, loadThread])

  // Keep the latest message in view.
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [thread])

  const startNewConversation = () => {
    localStorage.removeItem(CONV_KEY)
    localStorage.removeItem(CONV_NAME_KEY)
    localStorage.removeItem(CONV_EMAIL_KEY)
    setConversationId(null)
    setThread([])
    setChatInput('')
    setForm(EMPTY)
  }

  const sendFollowUp = async (e: FormEvent) => {
    e.preventDefault()
    const text = chatInput.trim()
    if (!text || chatSending || !conversationId || !visitorName || !visitorEmail) return
    setChatSending(true)
    try {
      await api.sendContact({
        name: visitorName,
        email: visitorEmail,
        message: text,
        conversationId,
      })
      setChatInput('')
      await loadThread(conversationId, true)
    } catch {
      toast.error('Could not send — please try again.')
    } finally {
      setChatSending(false)
    }
  }

  // --- Original contact form --------------------------------------------------
  const set = (key: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const copyToClipboard = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      toast.success(`${label} copied to clipboard`)
      window.setTimeout(() => setCopied((c) => (c === label ? null : c)), 1800)
    } catch {
      toast.error('Copy failed — long-press to copy instead')
    }
  }

  const validate = (): boolean => {
    const next: typeof errors = {}
    if (form.name.trim().length < 2) next.name = 'Please enter your name'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      next.email = 'Please enter a valid email address'
    if (form.message.trim().length < 10)
      next.message = 'Tell me a little more (at least 10 characters)'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || sending) return

    setSending(true)
    try {
      const res = await api.sendContact({
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim() || undefined,
        message: form.message.trim(),
        website: form.website || undefined,
      })
      if (res.conversationId) {
        // Switch to the live chat view for this conversation.
        localStorage.setItem(CONV_KEY, res.conversationId)
        localStorage.setItem(CONV_NAME_KEY, form.name.trim())
        localStorage.setItem(CONV_EMAIL_KEY, form.email.trim())
        setVisitorName(form.name.trim())
        setVisitorEmail(form.email.trim())
        setConversationId(res.conversationId)
        setForm(EMPTY)
        setErrors({})
        toast.success('Message sent! You can keep chatting right here.')
      } else {
        toast.success("Message sent! I'll get back to you soon.")
        setForm(EMPTY)
        setErrors({})
      }
    } catch (err: unknown) {
      const message =
        axios.isAxiosError<{ error?: string }>(err) ? err.response?.data?.error : undefined
      toast.error(message ?? 'Something went wrong — please try again.')
    } finally {
      setSending(false)
    }
  }

  const infoCards = [
    profile?.email && {
      icon: Mail,
      label: 'Email',
      value: profile.email,
      copy: true,
    },
    profile?.phone && {
      icon: Phone,
      label: 'Phone',
      value: profile.phone,
      copy: true,
    },
    profile?.location && {
      icon: MapPin,
      label: 'Location',
      value: profile.location,
      copy: false,
    },
  ].filter(Boolean) as { icon: typeof Mail; label: string; value: string; copy: boolean }[]

  const socials = [
    profile?.githubUrl && { href: profile.githubUrl, label: 'GitHub', icon: Github },
    profile?.linkedinUrl && { href: profile.linkedinUrl, label: 'LinkedIn', icon: Linkedin },
    profile?.twitterUrl && { href: profile.twitterUrl, label: 'Twitter', icon: Twitter },
  ].filter(Boolean) as { href: string; label: string; icon: typeof Github }[]

  return (
    <section id="contact" className="relative overflow-hidden py-24 sm:py-32 bg-[var(--bg-soft)]">
      <div className="aurora" aria-hidden>
        <div className="aurora-blob aurora-2" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6">
        <SectionHeading
          label="contact"
          title="Let's work together"
          subtitle="Have a project in mind, a role to fill, or just want to say hi? My inbox is always open."
        />

        <div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          {/* Left: info cards + socials */}
          <Reveal distance={40}>
            <h3 className="font-display text-2xl font-bold">
              Don't be a stranger<span className="text-gradient">.</span>
            </h3>
            <p className="mt-3 leading-relaxed text-[var(--muted)]">
              I usually reply within a day or two. If it's urgent, reach me directly on any of
              these — or just use the form and I'll find you.
            </p>

            <div className="mt-7 space-y-4">
              {infoCards.map(({ icon: Icon, label, value, copy }, i) => (
                <Reveal key={label} delay={i * 0.07} distance={28} tilt={7}>
                <Card hover={copy} className="flex items-center gap-4 p-4">
                  <span className="rounded-xl bg-gradient-to-br from-[#6366f1]/15 to-[#22d3ee]/15 p-3 text-[#8b5cf6]">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs uppercase tracking-widest text-[var(--muted)]">
                      {label}
                    </p>
                    <p className="truncate font-medium">{value}</p>
                  </div>
                  {copy && (
                    <button
                      onClick={() => copyToClipboard(value, label)}
                      aria-label={`Copy ${label}`}
                      className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]"
                    >
                      {copied === label ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </Card>
                </Reveal>
              ))}
            </div>

            {socials.length > 0 && (
              <div className="mt-7 flex items-center gap-3">
                {socials.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="rounded-full border border-[var(--border)] bg-[var(--glass)] p-3 text-[var(--muted)] transition-all duration-300 hover:-translate-y-1 hover:border-[#8b5cf6]/60 hover:text-[#8b5cf6]"
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            )}
          </Reveal>

          {/* Right: contact form, or the live chat once a conversation exists */}
          <Reveal distance={40} delay={0.12}>
            {conversationId ? (
              <Card padded={false} className="flex max-h-[640px] min-h-[480px] flex-col overflow-hidden">
                {/* Chat header */}
                <div className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-4">
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#22d3ee] font-display text-sm font-bold text-white">
                    {profile?.fullName?.charAt(0) ?? 'H'}
                    <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[var(--bg)] bg-emerald-400" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{profile?.fullName ?? 'Huzaifa Adam'}</p>
                    <p className="text-xs text-[var(--muted)]">Typically replies within a day</p>
                  </div>
                  <button
                    onClick={startNewConversation}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    New conversation
                  </button>
                </div>

                {/* Thread */}
                <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
                  {chatLoading ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-2/3" />
                      <Skeleton className="ml-auto h-12 w-1/2" />
                      <Skeleton className="h-12 w-3/5" />
                    </div>
                  ) : thread.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center text-center text-[var(--muted)]">
                      <MessageCircle className="h-10 w-10 opacity-50" />
                      <p className="mt-3 text-sm font-medium">Your message is on its way…</p>
                    </div>
                  ) : (
                    thread.map((msg, i) => (
                      <motion.div
                        key={`${msg.createdAt}-${i}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <ChatBubble msg={msg} />
                      </motion.div>
                    ))
                  )}
                </div>

                {/* Composer */}
                <form
                  onSubmit={sendFollowUp}
                  className="flex items-end gap-2 border-t border-[var(--border)] px-4 py-4"
                >
                  <div className="flex-1">
                    <Input
                      label="Type your message…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatLoading}
                      aria-label="Type your message"
                    />
                  </div>
                  <Button
                    type="submit"
                    size="md"
                    loading={chatSending}
                    disabled={!chatInput.trim()}
                    aria-label="Send message"
                    className="shrink-0 !px-4"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Card>
            ) : (
              <Card className="p-7 sm:p-8">
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <Input
                      label="Your name"
                      name="name"
                      autoComplete="name"
                      value={form.name}
                      onChange={set('name')}
                      error={errors.name}
                    />
                    <Input
                      label="Email address"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={set('email')}
                      error={errors.email}
                    />
                  </div>
                  <Input
                    label="Subject (optional)"
                    name="subject"
                    value={form.subject}
                    onChange={set('subject')}
                  />
                  <Textarea
                    label="Your message"
                    name="message"
                    value={form.message}
                    onChange={set('message')}
                    error={errors.message}
                  />

                  {/* Honeypot: invisible to humans, irresistible to bots */}
                  <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden>
                    <label>
                      Website
                      <input
                        type="text"
                        name="website"
                        tabIndex={-1}
                        autoComplete="off"
                        value={form.website}
                        onChange={set('website')}
                      />
                    </label>
                  </div>

                  <Button type="submit" size="lg" loading={sending} className="w-full sm:w-auto">
                    <Send className="h-4 w-4" />
                    {sending ? 'Sending…' : 'Send Message'}
                  </Button>
                </form>
              </Card>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
