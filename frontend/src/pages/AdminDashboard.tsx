import { Suspense, lazy, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Menu } from 'lucide-react'
import { Sidebar } from '../components/admin/Sidebar'
import { ThemeToggle } from '../components/layout/ThemeToggle'
import { Skeleton } from '../components/ui/Skeleton'
import { api } from '../lib/api'

const Overview = lazy(() => import('./admin/Overview').then((m) => ({ default: m.Overview })))
const ProfileEditor = lazy(() => import('./admin/ProfileEditor').then((m) => ({ default: m.ProfileEditor })))
const ProjectsManager = lazy(() => import('./admin/ProjectsManager').then((m) => ({ default: m.ProjectsManager })))
const SkillsManager = lazy(() => import('./admin/SkillsManager').then((m) => ({ default: m.SkillsManager })))
const ExperienceManager = lazy(() => import('./admin/ExperienceManager').then((m) => ({ default: m.ExperienceManager })))
const TestimonialsManager = lazy(() => import('./admin/TestimonialsManager').then((m) => ({ default: m.TestimonialsManager })))
const MessagesInbox = lazy(() => import('./admin/MessagesInbox').then((m) => ({ default: m.MessagesInbox })))
const Settings = lazy(() => import('./admin/Settings').then((m) => ({ default: m.Settings })))

const TITLES: Record<string, string> = {
  '/admin/dashboard': 'Overview',
  '/admin/dashboard/profile': 'Profile',
  '/admin/dashboard/projects': 'Projects',
  '/admin/dashboard/skills': 'Skills',
  '/admin/dashboard/experience': 'Experience',
  '/admin/dashboard/testimonials': 'Testimonials',
  '/admin/dashboard/messages': 'Messages',
  '/admin/dashboard/settings': 'Settings',
}

function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="h-64" />
    </div>
  )
}

export function AdminDashboard() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [username, setUsername] = useState<string>()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    api
      .getMe()
      .then((me) => setUsername(me.username))
      .catch(() => undefined)
    api
      .getStats()
      .then((s) => setUnreadCount(s.unreadMessages))
      .catch(() => undefined)
  }, [location.pathname])

  const title = TITLES[location.pathname] ?? 'Dashboard'

  return (
    <>
      <Helmet>
        <title>{title} — Admin</title>
      </Helmet>
      <div className="min-h-screen bg-[var(--bg)]">
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
          username={username}
          unreadCount={unreadCount}
        />

        <div
          className={`transition-all duration-300 ${
            collapsed ? 'lg:pl-20' : 'lg:pl-64'
          }`}
        >
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-[var(--border)] bg-[var(--bg)]/85 px-4 backdrop-blur-xl sm:px-6">
            <button
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="rounded-lg p-2 text-[var(--text)] lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-display text-lg font-bold">{title}</h1>
            <div className="ml-auto flex items-center gap-3">
              {username && (
                <span className="hidden text-sm text-[var(--muted)] sm:inline">
                  Signed in as <span className="font-semibold text-[var(--text)]">{username}</span>
                </span>
              )}
              <ThemeToggle />
            </div>
          </header>

          {/* Page content */}
          <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route index element={<Overview />} />
                <Route path="profile" element={<ProfileEditor />} />
                <Route path="projects" element={<ProjectsManager />} />
                <Route path="skills" element={<SkillsManager />} />
                <Route path="experience" element={<ExperienceManager />} />
                <Route path="testimonials" element={<TestimonialsManager />} />
                <Route path="messages" element={<MessagesInbox />} />
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </>
  )
}
