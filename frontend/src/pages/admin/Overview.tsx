import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderKanban, Inbox, Mail, Plus, User, Wrench } from 'lucide-react'
import { api } from '../../lib/api'
import { StatCard } from '../../components/admin/StatCard'
import { Card } from '../../components/ui/Card'
import { Skeleton } from '../../components/ui/Skeleton'
import type { Stats } from '../../lib/types'

export function Overview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api
      .getStats()
      .then(setStats)
      .catch(() => setError('Could not load dashboard stats.'))
  }, [])

  const quickActions = [
    { to: '/admin/dashboard/projects', label: 'New project', icon: FolderKanban },
    { to: '/admin/dashboard/skills', label: 'Add skill', icon: Wrench },
    { to: '/admin/dashboard/profile', label: 'Edit profile', icon: User },
    { to: '/admin/dashboard/messages', label: 'Check inbox', icon: Inbox },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold sm:text-3xl">Overview</h1>
        <p className="mt-1 text-[var(--muted)]">A quick look at how your portfolio is doing.</p>
      </div>

      {error ? (
        <Card className="text-red-400">{error}</Card>
      ) : !stats ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Total projects" value={stats.totalProjects} icon={FolderKanban} accent="linear-gradient(135deg,#6366f1,#8b5cf6)" />
            <StatCard label="Total skills" value={stats.totalSkills} icon={Wrench} accent="linear-gradient(135deg,#8b5cf6,#d946ef)" />
            <StatCard label="Messages" value={stats.totalMessages} icon={Mail} accent="linear-gradient(135deg,#0ea5e9,#22d3ee)" />
            <StatCard label="Unread" value={stats.unreadMessages} icon={Inbox} accent="linear-gradient(135deg,#f59e0b,#ef4444)" />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            {/* Recent messages */}
            <Card padded={false}>
              <div className="flex items-center justify-between px-6 pt-6">
                <h2 className="font-display text-lg font-bold">Recent messages</h2>
                <Link
                  to="/admin/dashboard/messages"
                  className="text-sm font-medium text-[#8b5cf6] hover:underline underline-offset-4"
                >
                  View all →
                </Link>
              </div>
              <div className="mt-4 divide-y divide-[var(--border)]">
                {stats.recentMessages.length === 0 ? (
                  <p className="px-6 py-10 text-center text-[var(--muted)]">
                    No messages yet. Share your site and they'll show up here.
                  </p>
                ) : (
                  stats.recentMessages.map((msg) => (
                    <Link
                      key={msg._id}
                      to="/admin/dashboard/messages"
                      className="block px-6 py-4 transition hover:bg-[var(--surface2)]/50"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold">
                          {msg.name}
                          {!msg.isRead && (
                            <span className="ml-2 inline-block h-2 w-2 rounded-full bg-[#8b5cf6]" />
                          )}
                        </p>
                        <span className="font-mono shrink-0 text-xs text-[var(--muted)]">
                          {new Date(msg.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 truncate text-sm text-[var(--muted)]">
                        {msg.subject ? `${msg.subject} — ` : ''}
                        {msg.message}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Quick actions */}
            <Card>
              <h2 className="font-display text-lg font-bold">Quick actions</h2>
              <div className="mt-4 space-y-2.5">
                {quickActions.map(({ to, label, icon: Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface2)]/50 px-4 py-3 transition hover:border-[#8b5cf6]/50 hover:bg-[var(--surface2)]"
                  >
                    <span className="rounded-lg bg-gradient-to-br from-[#6366f1]/20 to-[#22d3ee]/20 p-2 text-[#8b5cf6]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="font-medium">{label}</span>
                    <Plus className="ml-auto h-4 w-4 text-[var(--muted)]" />
                  </Link>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
