import { NavLink, useNavigate } from 'react-router-dom'
import {
  BriefcaseBusiness,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquareHeart,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  User,
  Wrench,
  Globe,
} from 'lucide-react'
import clsx from 'clsx'
import { auth } from '../../lib/api'

const NAV = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/dashboard/profile', label: 'Profile', icon: User },
  { to: '/admin/dashboard/projects', label: 'Projects', icon: FolderKanban },
  { to: '/admin/dashboard/skills', label: 'Skills', icon: Wrench },
  { to: '/admin/dashboard/experience', label: 'Experience', icon: BriefcaseBusiness },
  { to: '/admin/dashboard/testimonials', label: 'Testimonials', icon: MessageSquareHeart },
  { to: '/admin/dashboard/messages', label: 'Messages', icon: Mail, badgeKey: 'unread' },
  { to: '/admin/dashboard/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
  username?: string
  unreadCount?: number
}

export function Sidebar({
  collapsed,
  onToggle,
  mobileOpen,
  onCloseMobile,
  username,
  unreadCount = 0,
}: SidebarProps) {
  const navigate = useNavigate()

  const logout = () => {
    auth.clearToken()
    navigate('/admin/login', { replace: true })
  }

  const body = (
    <div className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center justify-between border-b border-[var(--border)] px-4">
        {!collapsed && (
          <span className="font-display flex items-center gap-2 text-base font-bold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#6366f1] to-[#22d3ee] text-sm text-white">
              P
            </span>
            Admin
          </span>
        )}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)] lg:block"
        >
          {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {NAV.map(({ to, label, icon: Icon, end, badgeKey }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onCloseMobile}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-gradient-to-r from-[#6366f1]/20 to-[#8b5cf6]/20 text-[var(--text)] ring-1 ring-[#8b5cf6]/30'
                  : 'text-[var(--muted)] hover:bg-[var(--surface2)] hover:text-[var(--text)]'
              )
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span className="flex-1">{label}</span>}
            {!collapsed && badgeKey === 'unread' && unreadCount > 0 && (
              <span className="rounded-full bg-[#8b5cf6] px-2 py-0.5 text-[11px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t border-[var(--border)] p-3 space-y-1">
        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--surface2)] hover:text-[var(--text)]"
          title={collapsed ? 'View site' : undefined}
        >
          <Globe className="h-5 w-5 shrink-0" />
          {!collapsed && 'View site'}
        </a>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-red-500/10 hover:text-red-400"
          title={collapsed ? 'Log out' : undefined}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && `Log out${username ? ` (${username})` : ''}`}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 hidden border-r border-[var(--border)] bg-[var(--bg-soft)] transition-all duration-300 lg:block',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {body}
      </aside>

      {/* Mobile drawer */}
      <div
        className={clsx(
          'fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden',
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onCloseMobile}
        aria-hidden
      />
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 border-r border-[var(--border)] bg-[var(--bg-soft)] transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {body}
      </aside>
    </>
  )
}
