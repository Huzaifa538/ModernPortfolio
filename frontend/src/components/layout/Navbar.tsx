import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import clsx from 'clsx'
import { useScrollSpy } from '../../hooks/useScrollSpy'
import { ThemeToggle } from './ThemeToggle'
import { Button } from '../ui/Button'

const LINKS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'contact', label: 'Contact' },
]

export function Navbar({ name }: { name?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const active = useScrollSpy(LINKS.map((l) => l.id))

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const goTo = (id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <header
        className={clsx(
          'fixed inset-x-0 top-0 z-[50] transition-all duration-300',
          scrolled
            ? 'border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-xl shadow-lg shadow-black/5'
            : 'bg-transparent'
        )}
      >
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-6">
          <button
            onClick={() => goTo('home')}
            className="font-display flex items-center gap-2.5 text-lg font-bold"
            aria-label="Go to top"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#6366f1] via-[#8b5cf6] to-[#22d3ee] text-base text-white shadow-md shadow-indigo-500/30">
              {(name ?? 'P').charAt(0).toUpperCase()}
            </span>
            <span className="hidden sm:inline">{name ?? 'Portfolio'}</span>
          </button>

          <div className="hidden items-center gap-1 lg:flex">
            {LINKS.map((link) => (
              <button
                key={link.id}
                onClick={() => goTo(link.id)}
                className={clsx(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active === link.id
                    ? 'text-[var(--text)]'
                    : 'text-[var(--muted)] hover:text-[var(--text)]'
                )}
              >
                {link.label}
                {active === link.id && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-[#6366f1] to-[#22d3ee]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="hidden lg:block">
              <Button size="sm" onClick={() => goTo('contact')}>
                Hire Me
              </Button>
            </div>
            <button
              className="rounded-lg p-2 text-[var(--text)] lg:hidden"
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[45] flex flex-col items-center justify-center gap-2 bg-[var(--bg)]/95 backdrop-blur-2xl lg:hidden"
          >
            {LINKS.map((link, i) => (
              <motion.button
                key={link.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => goTo(link.id)}
                className={clsx(
                  'font-display rounded-xl px-6 py-3 text-2xl font-semibold transition-colors',
                  active === link.id ? 'text-gradient' : 'text-[var(--text)]'
                )}
              >
                {link.label}
              </motion.button>
            ))}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6"
            >
              <Button size="lg" onClick={() => goTo('contact')}>
                Hire Me
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
