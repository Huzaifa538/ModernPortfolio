import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCheck,
  Inbox,
  Mail,
  MailOpen,
  Reply,
  Search,
  Star,
  Trash2,
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import { api } from '../../lib/api'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Skeleton } from '../../components/ui/Skeleton'
import { ConfirmDialog } from '../../components/admin/ConfirmDialog'
import type { Message } from '../../lib/types'

type Filter = 'all' | 'unread' | 'starred'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'starred', label: 'Starred' },
]

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

export function MessagesInbox() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('all')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Message | null>(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    api
      .getMessages({
        unread: filter === 'unread' || undefined,
        starred: filter === 'starred' || undefined,
        search: debouncedSearch || undefined,
      })
      .then((list) => {
        setMessages(list)
        // Keep the selection valid after a refresh
        if (selectedId && !list.some((m) => m._id === selectedId)) {
          setSelectedId(list[0]?._id ?? null)
        }
      })
      .catch(() => toast.error('Could not load messages'))
      .finally(() => setLoading(false))
  }, [filter, debouncedSearch, selectedId])

  // Debounce the search input so we don't hammer the API
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350)
    return () => window.clearTimeout(timer)
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const selected = useMemo(
    () => messages.find((m) => m._id === selectedId) ?? null,
    [messages, selectedId]
  )

  const openMessage = async (msg: Message) => {
    setSelectedId(msg._id)
    if (!msg.isRead) {
      try {
        const updated = await api.setMessageRead(msg._id, true)
        setMessages((list) => list.map((m) => (m._id === msg._id ? updated : m)))
      } catch {
        // non-fatal — the message is still readable
      }
    }
  }

  const toggleStar = async (msg: Message) => {
    try {
      const updated = await api.setMessageStarred(msg._id, !msg.isStarred)
      setMessages((list) => list.map((m) => (m._id === msg._id ? updated : m)))
    } catch {
      toast.error('Could not update star')
    }
  }

  const toggleRead = async (msg: Message) => {
    try {
      const updated = await api.setMessageRead(msg._id, !msg.isRead)
      setMessages((list) => list.map((m) => (m._id === msg._id ? updated : m)))
    } catch {
      toast.error('Could not update read status')
    }
  }

  const markAllRead = async () => {
    const unread = messages.filter((m) => !m.isRead)
    if (unread.length === 0) return
    try {
      await Promise.all(unread.map((m) => api.setMessageRead(m._id, true)))
      setMessages((list) => list.map((m) => ({ ...m, isRead: true })))
      toast.success('All messages marked as read')
    } catch {
      toast.error('Something went wrong — try again')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setDeleteBusy(true)
    try {
      await api.deleteMessage(deleting._id)
      toast.success('Message deleted')
      setDeleting(null)
      if (selectedId === deleting._id) setSelectedId(null)
      load()
    } catch {
      toast.error('Delete failed — please try again')
    } finally {
      setDeleteBusy(false)
    }
  }

  const replyHref = selected
    ? `mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject || 'Your message'}`)}&body=${encodeURIComponent(`Hi ${selected.name},\n\n`)}`
    : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">Inbox</h1>
          <p className="mt-1 text-[var(--muted)]">Messages from your contact form.</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" />
          Mark all read
        </Button>
      </div>

      {/* Filter tabs + search */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setFilter(key)
                setSelectedId(null)
              }}
              aria-pressed={filter === key}
              className={clsx(
                'rounded-full px-4 py-1.5 text-sm font-medium transition',
                filter === key
                  ? 'bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-md shadow-indigo-500/30'
                  : 'border border-[var(--border)] bg-[var(--glass)] text-[var(--muted)] hover:text-[var(--text)]'
              )}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages…"
            aria-label="Search messages"
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--glass)] py-2.5 pl-10 pr-4 text-sm text-[var(--text)] placeholder:text-[var(--muted)] focus:border-[#8b5cf6] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6]/30"
          />
        </div>
      </div>

      {/* Two-pane */}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card padded={false} className="max-h-[560px] overflow-y-auto">
          {loading ? (
            <div className="space-y-3 p-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center text-[var(--muted)]">
              <Inbox className="mx-auto h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">No messages here.</p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {messages.map((msg) => (
                <button
                  key={msg._id}
                  onClick={() => openMessage(msg)}
                  className={clsx(
                    'block w-full px-5 py-4 text-left transition',
                    selectedId === msg._id
                      ? 'bg-[#8b5cf6]/10'
                      : 'hover:bg-[var(--surface2)]/50'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {!msg.isRead && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-[#8b5cf6]" />
                    )}
                    <p className={clsx('truncate font-semibold', !msg.isRead && 'text-[var(--text)]')}>
                      {msg.name}
                    </p>
                    {msg.isStarred && (
                      <Star className="h-3.5 w-3.5 shrink-0 fill-amber-400 text-amber-400" />
                    )}
                    <span className="font-mono ml-auto shrink-0 text-[11px] text-[var(--muted)]">
                      {timeAgo(msg.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm text-[var(--muted)]">
                    {msg.subject ? `${msg.subject} — ` : ''}
                    {msg.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Detail pane */}
        <Card className="min-h-[280px]">
          {!selected ? (
            <div className="flex h-full flex-col items-center justify-center p-12 text-[var(--muted)]">
              <Mail className="h-10 w-10 opacity-50" />
              <p className="mt-3 font-medium">Pick a message to read it here.</p>
            </div>
          ) : (
            <div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">{selected.name}</h2>
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-sm text-[#8b5cf6] hover:underline underline-offset-4"
                  >
                    {selected.email}
                  </a>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => toggleStar(selected)}
                    aria-label={selected.isStarred ? 'Unstar message' : 'Star message'}
                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-amber-400"
                  >
                    <Star className={clsx('h-4.5 w-4.5', selected.isStarred && 'fill-amber-400 text-amber-400')} />
                  </button>
                  <button
                    onClick={() => toggleRead(selected)}
                    aria-label={selected.isRead ? 'Mark as unread' : 'Mark as read'}
                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)]"
                  >
                    {selected.isRead ? <Mail className="h-4.5 w-4.5" /> : <MailOpen className="h-4.5 w-4.5" />}
                  </button>
                  <a
                    href={replyHref}
                    aria-label="Reply by email"
                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[#8b5cf6]"
                  >
                    <Reply className="h-4.5 w-4.5" />
                  </a>
                  <button
                    onClick={() => setDeleting(selected)}
                    aria-label="Delete message"
                    className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </div>

              {selected.subject && (
                <p className="font-mono mt-4 text-sm text-[var(--muted)]">
                  Subject: <span className="text-[var(--text)]">{selected.subject}</span>
                </p>
              )}
              <p className="font-mono mt-1 text-xs text-[var(--muted)]">
                {new Date(selected.createdAt).toLocaleString()}
              </p>

              <div className="mt-5 rounded-xl bg-[var(--surface2)]/60 p-5">
                <p className="whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              <div className="mt-6">
                <a href={replyHref}>
                  <Button>
                    <Reply className="h-4 w-4" />
                    Reply via email
                  </Button>
                </a>
              </div>
            </div>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete message"
        message={`Delete the message from "${deleting?.name}"? This can't be undone.`}
        busy={deleteBusy}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
